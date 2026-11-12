import { safeImageUrl } from './safe-image-url';

describe('image URL policy', () => {
  it('allows the supplied HTTPS logo and bundled assets', () => {
    expect(safeImageUrl('https://www.visa.com.ec/dam/VCOM/visa-signature.jpg')).toBe(
      'https://www.visa.com.ec/dam/VCOM/visa-signature.jpg',
    );
    expect(safeImageUrl('/assets/logos/visa.png')).toBe('/assets/logos/visa.png');
  });

  it.each([
    'http://example.com/logo.png',
    '//example.com/logo.png',
    'javascript:alert(1)',
    'data:image/svg+xml,evil',
    'https://user:password@example.com/logo.png',
    '/assets/../private.png',
    'assets-1.png',
  ])('rejects an unsafe or unrecognized image path: %s', (value) => {
    expect(safeImageUrl(value)).toBeUndefined();
  });
});
