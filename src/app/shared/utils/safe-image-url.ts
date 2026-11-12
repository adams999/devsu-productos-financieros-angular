/** Only HTTPS images and bundled images under /assets may be loaded. */
export function safeImageUrl(value: string): string | undefined {
  const url = value.trim();
  if (/^\/assets\/[A-Za-z0-9/_-]+\.(?:png|jpe?g|webp|gif|svg)$/.test(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password
      ? parsed.href
      : undefined;
  } catch {
    return undefined;
  }
}
