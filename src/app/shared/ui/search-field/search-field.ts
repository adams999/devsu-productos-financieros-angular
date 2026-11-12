import { ChangeDetectionStrategy, Component, input, OnDestroy, output } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-search-field',
  styleUrl: './search-field.scss',
  templateUrl: './search-field.html',
})
export class SearchField implements OnDestroy {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly placeholder = input('Buscar...');
  readonly value = input('');
  readonly debounceMs = input(0);
  readonly valueInput = output<string>();
  private pendingInput?: ReturnType<typeof setTimeout>;

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    clearTimeout(this.pendingInput);
    const delay = Math.max(0, this.debounceMs());
    if (delay === 0) this.valueInput.emit(value);
    else this.pendingInput = setTimeout(() => this.valueInput.emit(value), delay);
  }

  ngOnDestroy(): void {
    clearTimeout(this.pendingInput);
  }
}
