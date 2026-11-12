import { TestBed } from '@angular/core/testing';
import { AvatarImage } from './avatar-image';

describe('AvatarImage', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AvatarImage] }));

  it('recovers with a new image after the previous image fails', async () => {
    const fixture = TestBed.createComponent(AvatarImage);
    fixture.componentRef.setInput('label', 'Visa Signature');
    fixture.componentRef.setInput('src', 'https://example.com/first.png');
    fixture.componentRef.setInput('alt', 'Logo Visa');
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const first = root.querySelector<HTMLImageElement>('img')!;
    expect(first.alt).toBe('Logo Visa');
    expect(first.getAttribute('referrerpolicy')).toBe('no-referrer');
    first.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.avatar-placeholder')?.textContent).toBe('VS');

    fixture.componentRef.setInput('src', 'https://example.com/second.png');
    await fixture.whenStable();
    expect(root.querySelector<HTMLImageElement>('img')?.src).toBe('https://example.com/second.png');
  });

  it('does not load an unsafe image', async () => {
    const fixture = TestBed.createComponent(AvatarImage);
    fixture.componentRef.setInput('label', 'Producto');
    fixture.componentRef.setInput('src', 'javascript:alert(1)');
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.avatar-placeholder')?.textContent).toBe('P');
  });

  it('shows one or two initials when there is no image', async () => {
    const fixture = TestBed.createComponent(AvatarImage);
    fixture.componentRef.setInput('label', '  Juan   Gabriel  Pérez ');
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('.avatar-placeholder')?.textContent).toBe('JG');

    fixture.componentRef.setInput('label', 'Juan');
    await fixture.whenStable();
    expect(root.querySelector('.avatar-placeholder')?.textContent).toBe('J');
  });
});
