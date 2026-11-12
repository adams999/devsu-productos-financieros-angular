import { TestBed } from '@angular/core/testing';
import { ActionConfirmDialog } from './action-confirm-dialog';

describe('ActionConfirmDialog', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ActionConfirmDialog] }));

  it('emits confirmation while idle and blocks actions while busy', async () => {
    const fixture = TestBed.createComponent(ActionConfirmDialog);
    fixture.componentRef.setInput('heading', 'Confirmar acción');
    const confirm = vi.fn();
    const cancel = vi.fn();
    fixture.componentInstance.confirm.subscribe(confirm);
    fixture.componentInstance.cancelRequested.subscribe(cancel);
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector<HTMLDialogElement>('dialog')!;
    const confirmButton = root.querySelector<HTMLButtonElement>('button.primary')!;
    expect(dialog.getAttribute('role')).toBe('alertdialog');
    expect(root.hasAttribute('title')).toBe(false);
    expect(root.querySelector('h2')?.textContent).toBe('Confirmar acción');
    confirmButton.click();
    expect(confirm).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('busy', true);
    await fixture.whenStable();
    expect(confirmButton.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>('button.secondary')?.disabled).toBe(true);
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(cancel).not.toHaveBeenCalled();
  });
});
