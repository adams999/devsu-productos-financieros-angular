# Productos financieros — frontend Angular

Aplicación Angular para listar, buscar, crear, editar y eliminar productos financieros del ejercicio DevSu. Usa los diseños D1–D4 como referencia, SCSS propio y componentes accesibles y adaptables, sin biblioteca de componentes prefabricados.

## Requisitos

| Herramienta | Versión del proyecto                                                        |
| ----------- | --------------------------------------------------------------------------- |
| Node.js     | 22.22.3 o superior en la línea 22; 24.15.0 o superior en la línea 24; o 26+ |
| npm         | 11.16.0 para reproducir el lockfile                                         |
| Angular     | 22.2.5; CLI 22.2.6, instalados localmente                                   |
| TypeScript  | 6.0.2                                                                       |
| Vitest      | 5.1.0                                                                       |

No hace falta instalar Angular CLI globalmente. Compruebe `node --version` antes de instalar; Node 22.20.0 no cumple el requisito de Angular 22. La carpeta local `.tools/`, si existe en un entorno de desarrollo, está ignorada por Git y no forma parte del proyecto.

## Arranque local

Abra **dos terminales** desde la carpeta que contiene `repo-front-angular` y `repo-interview-main`. Primero, instale y arranque el backend descargado:

```powershell
cd repo-interview-main/repo-interview-main
npm install
npm run start:dev
```

Debe escuchar en `http://localhost:3002`. El repositorio del backend no incluye `package-lock.json`, por eso se usa `npm install` en ese proyecto. No se requieren credenciales ni variables de entorno para el arranque local indicado por el ejercicio.

En la segunda terminal, instale las dependencias fijadas por el lockfile e inicie Angular:

```powershell
cd repo-front-angular
npm ci
npm start
```

Abra `http://localhost:4200/`; la ruta inicial lleva a `/products`. `npm ci` se ejecuta **dentro de `repo-front-angular`**. El frontend consulta URLs relativas `/bp/products`; `npm start` carga `proxy.conf.json`, que reenvía `/bp/**` a `http://localhost:3002`. El proxy evita el bloqueo CORS durante desarrollo, porque el backend no habilita CORS. Si aparece un error de conexión en la interfaz, compruebe que el backend está encendido en el puerto 3002.

Para servir el build de producción, publique `dist/repo-front-angular/browser` con un servidor que devuelva `index.html` para las rutas de Angular y reenvíe `/bp/**` al backend bajo el **mismo origen**. `proxy.conf.json` solo funciona con `ng serve`; no se incluye en el build estático.

### Ejemplo de despliegue con Nginx

Ejecute `npm run build` y copie el contenido de `dist/repo-front-angular/browser` a `/srv/repo-front-angular/browser`. Este ejemplo supone que Nginx recibe tráfico desde un proxy que termina HTTPS y que el backend escucha en `127.0.0.1:3002`. Ajuste el dominio y las rutas al servidor real:

```nginx
server {
    listen 80;
    server_name ejemplo.com;
    root /srv/repo-front-angular/browser;
    index index.html;

    location /bp/ {
        proxy_pass http://127.0.0.1:3002;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`proxy_pass` sin una ruta final conserva `/bp/products` al enviarlo al backend. `try_files` sirve los archivos del build y devuelve `index.html` al abrir o recargar directamente `/products/new` o `/products/:id/edit`. Compruebe la configuración con `nginx -t` y verifique que `/bp/products` responde a través del mismo dominio que el frontend.

## Rutas y funciones

| Ruta                 | Función                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                  | Redirección al listado                                                                                                                                                                     |
| `/products`          | F1 listado, F2 búsqueda por ID/nombre/descripción con espera de 500 ms, F3 total y paginación de 5/10/20; clic en el nombre o menú para F5 editar y menú para F6 eliminar con confirmación |
| `/products/new`      | F4 creación con validaciones, verificación de ID, Reiniciar, Enviar y aviso al salir con cambios sin guardar                                                                               |
| `/products/:id/edit` | F5 edición con ID fijo, botón **Deshacer cambios** para restaurar el producto cargado y aviso al salir con cambios sin guardar                                                             |

La tabla distingue carga, vacío, ausencia de coincidencias y error. La tabla crece hasta un máximo adaptable; las cinco filas habituales se muestran completas y, con más registros, el cuerpo tiene scroll propio mientras el encabezado permanece visible. La paginación queda fuera del scroll, y al cambiar de página, tamaño o búsqueda las filas vuelven arriba. En pantallas estrechas, el desplazamiento horizontal se limita a la tabla. Los filtros, el total y la paginación se calculan en el cliente. El texto de búsqueda normalizado se calcula una vez por producto al recibir la colección y se reutiliza mientras cambia la consulta. Los tamaños 5/10/20 tienen una sola definición para el listado y el selector. Los datos de pantalla viven en servicios de estado por ruta con Angular signals; el backend es la fuente de productos. No se guardan productos ni credenciales en `localStorage` o `sessionStorage`.

Al crear, actualizar o eliminar un producto se muestra un aviso de éxito que desaparece después de cinco segundos o al cerrarlo. Los fallos de guardado muestran un aviso de error persistente y conservan los datos del formulario; los errores de eliminación permanecen dentro del modal para permitir reintentar o cancelar. Los botones indican cuando una operación está en curso.

## Arquitectura del frontend

La aplicación se organiza por funcionalidad. `products` reúne el comportamiento del ejercicio y depende de piezas genéricas de `core` y `shared`. Los componentes son standalone y las rutas cargan la funcionalidad y sus páginas de forma diferida. El estado de cada pantalla se provee en su ruta y usa Angular signals; no se necesita NgRx para este alcance.

| Ubicación                                                        | Responsabilidad                                                                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/app.routes.ts` y `features/products/products.routes.ts` | Navegación, carga diferida, proveedores por ruta y aviso de cambios sin guardar.                                                                |
| `features/products/pages/` y `features/products/ui/`             | Páginas que coordinan interacciones y presentación propia de productos, como columnas y acciones de la tabla.                                   |
| `features/products/state/`                                       | Estado de listado, formulario, eliminación y disponibilidad del ID; carga, errores y valores derivados con signals.                             |
| `features/products/models/` y `features/products/forms/`         | Modelo de dominio, reglas puras de fechas/búsqueda/paginación y validaciones de Signal Forms.                                                   |
| `features/products/ports/` y `features/products/data/`           | Contratos inyectables para los stores; `ProductsApi` implementa HTTP y los decodificadores convierten respuestas externas en modelos validados. |
| `src/app/core/`                                                  | Manejo genérico de errores y respuestas HTTP, y servicio global de avisos, sin reglas de productos.                                             |
| `src/app/shared/`                                                | Componentes, utilidades y comportamiento de navegador reutilizables entre funcionalidades, incluido el aviso visual.                            |

El flujo de una operación es **página → store → puerto inyectado → `ProductsApi` → backend**. La respuesta recorre el camino inverso: se valida y transforma en `data/`, el store actualiza sus signals y Angular refresca la vista. `PRODUCT_DATA_PROVIDERS` enlaza los puertos con `ProductsApi`; así, las pruebas pueden sustituir el acceso HTTP sin cambiar las páginas ni los stores. El backend conserva los productos; el frontend solo mantiene estado de pantalla en memoria.

Las respuestas HTTP entran como `unknown` y se decodifican antes de llegar al estado. `products.providers.ts` también proporciona un reloj para que la validación de fechas sea reproducible en pruebas. La eliminación y la verificación asincrónica del ID tienen estados propios por ruta.

`tsconfig.json` define `@app/*` para `src/app/*` y `@products/*` para la funcionalidad de productos. Se usan en importaciones largas; las importaciones entre archivos cercanos conservan rutas relativas. `@angular/*` corresponde a los paquetes de Angular y no forma parte de estos alias.

Los componentes reutilizables están en `src/app/shared/ui/`: `data-table/` aporta la tabla semántica, desplazamiento horizontal y estados de carga/error mediante proyección de encabezado y filas; `avatar-image/` muestra imágenes seguras con una o dos iniciales alternativas; `pagination/` ofrece tamaño de página y navegación; `action-menu/` recibe una lista de acciones y abre el panel en la capa superior del navegador para no ampliar el área desplazable de la tabla; `info-tooltip/` muestra ayuda accesible por cursor, foco y teclado; `action-confirm-dialog/` recibe etiquetas y contenido proyectado. El menú y el tooltip comparten posicionamiento, ciclo de apertura y registro de eventos en `src/app/shared/utils/anchored-popover.ts`. La confirmación de salida y la restauración del foco se aíslan en `src/app/shared/browser/`. `products-table/` permanece en la funcionalidad de productos porque define sus columnas y filas, pero recibe las acciones como configuración. La política de URL de imágenes se comparte con el formulario.

Los controles de formulario reutilizables están en `src/app/shared/ui/`: `form-control/` ofrece componentes independientes para `input`, `textarea` y `select` con una base común para etiqueta, ayuda, estado y error. Se puede añadir otro tipo de control sin modificar un selector central. `search-field/` ofrece la búsqueda controlada por valor. El área de texto mide lo mismo que los demás controles por defecto; admite `[rows]="4"` para ampliar su altura y `[allowResize]="true"` para permitir el ajuste vertical por el usuario. Las reglas de validación y la verificación de ID siguen en la funcionalidad de productos. El selector de cantidad del listado pertenece al componente reutilizable `pagination/`.

El formulario exige ID de 3–10 caracteres, nombre de 6–100, descripción de 10–200 y logo. El logo admite una URL HTTPS o una ruta local `/assets/`. La fecha de liberación debe ser hoy o posterior según la fecha local del navegador; la revisión se deriva exactamente un año calendario después (29 de febrero pasa a 28 de febrero). En creación se verifica que el ID esté libre antes de enviar. En edición el ID permanece fijo y `PUT` envía únicamente los campos editables.

La página de edición observa los cambios del parámetro `:id`: al navegar entre productos en la misma ruta carga el nuevo registro y el guard mantiene el aviso si hay cambios sin guardar.

## Producto de ejemplo

Puede introducir estos valores en `/products/new` a partir de noviembre de 2026. El logo de Visa representa **solo este producto**, no la identidad del encabezado BANCO:

```json
{
  "id": "visa-sig",
  "name": "Visa Signature",
  "description": "Tarjeta de crédito Visa Signature",
  "logo": "https://www.visa.com.ec/dam/VCOM/regional/lac/SPA/Default/Pay%20With%20Visa/Tarjetas/visa-signature-400x225.jpg",
  "date_release": "2027-12-01",
  "date_revision": "2028-12-01"
}
```

El formulario calcula `date_revision`; no hace falta introducirla. Las imágenes remotas requieren que su servidor permita cargarlas; si fallan, aparece una alternativa visual.

## Pruebas y puerta de cobertura

Desde `repo-front-angular`, con Node compatible:

```powershell
npm run format:check
npm run lint
npm test -- --watch=false
npm test -- --coverage --watch=false
npm run build
```

`npm run format` aplica Prettier a los archivos compatibles del proyecto; `format:check` verifica el formato. `npm run lint` incluye esa verificación para TS, HTML, SCSS, JSON, Markdown y scripts, comprueba los límites de dependencias, ciclos y grupos de imports, y ejecuta ESLint sobre código y plantillas. `.gitignore` y `.editorconfig` son archivos de reglas sin parser de Prettier; el icono y las carpetas generadas o de dependencias se excluyen. El cuarto comando activa la cobertura V8 de Vitest. `angular.json` impone un mínimo de **70 % para sentencias, ramas, funciones y líneas**; la orden sale con código distinto de cero si falla alguna métrica. Incluye los archivos TypeScript de `src/app` y no excluye código del producto. El informe HTML y el resumen JSON quedan en `coverage/repo-front-angular/`, carpeta ignorada por Git. `npm run build` genera el build de producción y debe terminar sin errores.

Última verificación con Node 22.22.3: **104/104 pruebas** en 28 archivos; sentencias **93,16 %** (722/775), ramas **87,27 %** (432/495), funciones **92,92 %** (197/212) y líneas **96,40 %** (590/612). El build de producción también pasó. Las pruebas unitarias simulan HTTP mediante las herramientas de Angular y no requieren que el backend esté ejecutándose; cubren además la sustitución de los puertos de datos y una fecha de validación inyectada. En navegador con el backend real se creó un producto temporal, se buscó, se editó y se eliminó, confirmando que los registros previos permanecieron intactos y que el avatar mostró dos iniciales al fallar la imagen.

## Contrato y límites conocidos

- API local: `GET/POST /bp/products`, `GET/PUT/DELETE /bp/products/:id` y `GET /bp/products/verification/:id`. El listado responde `{ "data": [...] }` y la verificación responde `true` o `false`.
- El backend mantiene productos **solo en memoria**: al reiniciarlo se pierden. No ofrece autenticación ni autorización. El guard `CanDeactivate` de alta y edición únicamente advierte sobre cambios sin guardar; no protege el API ni oculta datos sensibles del servidor.
- `GET /bp/products` devuelve siempre la colección completa y no admite parámetros de búsqueda ni paginación. Para volúmenes grandes haría falta ampliar el contrato del backend con filtros, página, tamaño y total; el frontend no puede realizar paginación remota real con el servicio actual.
- El enunciado pide mínimo 5 caracteres para `name`, pero el DTO del backend descargado usa `@MinLength(6)`. El formulario valida **6** para evitar un rechazo del API.
- El backend tiene CORS desactivado. El desarrollo usa el proxy indicado; producción necesita un proxy inverso del mismo origen o una configuración CORS adecuada en el servidor.
- Los flujos HTTP, rutas y estados se verificaron con pruebas unitarias y un recorrido manual de creación, búsqueda, edición y eliminación en navegador con el backend real.
