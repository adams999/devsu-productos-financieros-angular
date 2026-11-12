import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  afterEach(() => vi.useRealTimers());

  it('dismisses success after five seconds and keeps errors until dismissed', () => {
    vi.useFakeTimers();
    const toast = TestBed.inject(ToastService);

    toast.success('Producto creado correctamente.');
    expect(toast.notice()).toMatchObject({
      kind: 'success',
      message: 'Producto creado correctamente.',
    });
    vi.advanceTimersByTime(5000);
    expect(toast.notice()).toBeUndefined();

    toast.error('No se pudo guardar.');
    vi.advanceTimersByTime(10000);
    expect(toast.notice()?.message).toBe('No se pudo guardar.');
    toast.dismiss();
    expect(toast.notice()).toBeUndefined();
  });

  it('replaces an earlier notice without letting its timer dismiss the new one', () => {
    vi.useFakeTimers();
    const toast = TestBed.inject(ToastService);

    toast.success('Primero');
    vi.advanceTimersByTime(3000);
    toast.success('Segundo');
    vi.advanceTimersByTime(2000);
    expect(toast.notice()?.message).toBe('Segundo');
    vi.advanceTimersByTime(3000);
    expect(toast.notice()).toBeUndefined();
  });
});
