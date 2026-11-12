import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

let nextDialogId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-action-confirm-dialog',
  styleUrl: './action-confirm-dialog.scss',
  templateUrl: './action-confirm-dialog.html',
})
export class ActionConfirmDialog implements AfterViewInit, OnDestroy {
  readonly heading = input.required<string>();
  readonly busy = input(false);
  readonly error = input<string>();
  readonly errorHint = input<string>();
  readonly cancelLabel = input('Cancelar');
  readonly confirmLabel = input('Confirmar');
  readonly busyLabel = input('Procesando…');
  readonly cancelRequested = output<void>();
  readonly confirm = output<void>();
  private readonly id = ++nextDialogId;
  protected readonly titleId = `action-confirm-dialog-title-${this.id}`;
  protected readonly descriptionId = `action-confirm-dialog-description-${this.id}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly cancelButton = viewChild.required<ElementRef<HTMLButtonElement>>('cancelButton');

  ngAfterViewInit(): void {
    const dialog = this.dialog().nativeElement;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    this.cancelButton().nativeElement.focus();
  }

  ngOnDestroy(): void {
    const dialog = this.dialog().nativeElement;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
  }

  protected onCancel(event?: Event): void {
    event?.preventDefault();
    if (!this.busy()) this.cancelRequested.emit();
  }

  protected onConfirm(): void {
    if (!this.busy()) this.confirm.emit();
  }
}
