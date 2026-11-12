import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const appRoot = path.resolve('src/app');
const files = [];
const dependencies = new Map();
const errors = [];

function collect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) files.push(file);
  }
}

function resolveLocal(from, specifier) {
  const base = specifier.startsWith('@app/')
    ? path.join(appRoot, specifier.slice('@app/'.length))
    : specifier.startsWith('@products/')
      ? path.join(appRoot, 'features/products', specifier.slice('@products/'.length))
      : specifier.startsWith('.')
        ? path.resolve(path.dirname(from), specifier)
        : undefined;
  if (!base) return undefined;
  for (const candidate of [`${base}.ts`, path.join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  errors.push(`${path.relative(appRoot, from)}: unresolved import ${specifier}`);
  return undefined;
}

function layer(file) {
  const parts = path.relative(appRoot, file).split(path.sep);
  return parts[0] === 'features' ? `${parts[0]}/${parts[1]}/${parts[2]}` : parts[0];
}

function checkBoundary(from, target) {
  if (from.endsWith('.spec.ts')) return;
  const source = layer(from);
  const destination = layer(target);
  if ((source === 'core' || source === 'shared') && destination.startsWith('features/')) {
    errors.push(`${path.relative(appRoot, from)}: ${source} cannot depend on a feature`);
  }
  if (source === 'core' && destination === 'shared') {
    errors.push(`${path.relative(appRoot, from)}: core cannot depend on shared`);
  }
  if (
    source.startsWith('features/') &&
    destination.startsWith('features/') &&
    source.split('/')[1] !== destination.split('/')[1]
  ) {
    errors.push(`${path.relative(appRoot, from)}: feature cannot import another feature directly`);
  }
  const restricted = {
    data: ['state', 'pages', 'ui', 'forms'],
    models: ['data', 'state', 'pages', 'ui', 'forms', 'ports'],
    ports: ['data', 'state', 'pages', 'ui', 'forms'],
    state: ['data', 'pages', 'ui', 'forms'],
    forms: ['data', 'state', 'pages', 'ui'],
    ui: ['data', 'state', 'pages', 'forms'],
  };
  const sourceParts = source.split('/');
  const destinationParts = destination.split('/');
  if (
    sourceParts[0] === 'features' &&
    destinationParts[0] === 'features' &&
    sourceParts[1] === destinationParts[1] &&
    restricted[sourceParts[2]]?.includes(destinationParts[2])
  ) {
    errors.push(
      `${path.relative(appRoot, from)}: ${sourceParts[2]} cannot import ${destinationParts[2]}`,
    );
  }
}

function group(specifier) {
  return specifier.startsWith('.')
    ? 2
    : specifier.startsWith('@app/') || specifier.startsWith('@products/')
      ? 1
      : 0;
}

function inspect(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const edges = [];
  let previousGroup = -1;
  let pastImports = false;
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const specifier = statement.moduleSpecifier.text;
      const currentGroup = group(specifier);
      const line = source.getLineAndCharacterOfPosition(statement.getStart()).line + 1;
      if (pastImports || currentGroup < previousGroup) {
        errors.push(
          `${path.relative(appRoot, file)}:${line}: imports must be grouped first: packages, aliases, relative`,
        );
      }
      previousGroup = currentGroup;
      const target = resolveLocal(file, specifier);
      if (target) {
        checkBoundary(file, target);
        edges.push(target);
      }
    } else {
      pastImports = true;
      if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
        const target = resolveLocal(file, statement.moduleSpecifier.text);
        if (target) {
          checkBoundary(file, target);
          edges.push(target);
        }
      }
    }
  }
  dependencies.set(file, edges);
}

function checkCycles() {
  const visited = new Set();
  const active = new Set();
  function visit(file, trail) {
    if (active.has(file)) {
      errors.push(
        `circular import: ${[...trail, file].map((item) => path.relative(appRoot, item)).join(' -> ')}`,
      );
      return;
    }
    if (visited.has(file)) return;
    visited.add(file);
    active.add(file);
    for (const target of dependencies.get(file) ?? []) visit(target, [...trail, file]);
    active.delete(file);
  }
  for (const file of files) visit(file, []);
}

collect(appRoot);
for (const file of files) inspect(file);
checkCycles();
if (errors.length) {
  for (const error of errors) process.stderr.write(`${error}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Architecture lint passed (${files.length} TypeScript files).\n`);
}
