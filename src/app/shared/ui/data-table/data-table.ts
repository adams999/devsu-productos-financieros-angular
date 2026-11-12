import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-data-table',
  styleUrl: './data-table.scss',
  templateUrl: './data-table.html',
})
export class DataTable {
  private readonly scrollRegion = viewChild.required<ElementRef<HTMLElement>>('scrollRegion');
  readonly ariaLabel = input.required<string>();
  readonly loading = input(false);
  readonly error = input<string>();
  readonly loadingLabel = input('Cargando…');
  readonly retryLabel = input('Reintentar');
  readonly retry = output<void>();

  scrollToTop(): void {
    this.scrollRegion().nativeElement.scrollTop = 0;
  }
}
