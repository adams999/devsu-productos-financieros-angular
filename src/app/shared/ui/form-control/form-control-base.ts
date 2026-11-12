import { computed, Directive, input, output } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';

@Directive()
export abstract class FormControlFieldBase {
  readonly field = input.required<FieldTree<string>>();
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly status = input<string>();
  readonly valueInput = output<string>();

  protected readonly showError = computed(() => {
    const state = this.field()();
    return state.invalid() && (state.dirty() || state.touched());
  });
  protected readonly errorId = computed(() => `${this.controlId()}-error`);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly statusId = computed(() => `${this.controlId()}-status`);
  protected readonly describedBy = computed(
    () =>
      [
        this.hint() ? this.hintId() : '',
        this.status() ? this.statusId() : '',
        this.showError() ? this.errorId() : '',
      ]
        .filter(Boolean)
        .join(' ') || null,
  );

  protected onValueInput(event: Event): void {
    this.valueInput.emit(
      (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value,
    );
  }
}
