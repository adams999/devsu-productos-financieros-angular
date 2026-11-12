import { TestBed } from '@angular/core/testing';
import { ToastService } from '@app/core/notifications/toast.service';
import { ToastOutlet } from './toast-outlet';

describe('ToastOutlet', () => {
  it('announces success and errors, renders messages as text and can close them', async () => {
    const fixture = TestBed.createComponent(ToastOutlet);
    const toast = TestBed.inject(ToastService);
    const root = fixture.nativeElement as HTMLElement;

    toast.success('Producto creado correctamente.');
    await fixture.whenStable();
    expect(root.querySelector('[role="status"]')?.textContent).toContain('Producto creado');

    toast.error('<img src=x onerror=alert(1)>');
    await fixture.whenStable();
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('<img src=x');
    expect(root.querySelector('img')).toBeNull();

    root.querySelector<HTMLButtonElement>('button[aria-label="Cerrar aviso"]')!.click();
    await fixture.whenStable();
    expect(root.querySelector('.toast')).toBeNull();
  });
});
