import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

let nextPaginationId = 0;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pagination',
  styleUrl: './pagination.scss',
  templateUrl: './pagination.html',
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageSizes = input.required<readonly number[]>();
  readonly ariaLabel = input('Páginas');
  readonly pageSizeLabel = input('Registros por página');
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();
  protected readonly pageSizeId = `page-size-${nextPaginationId++}`;

  protected onPageSizeChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (this.pageSizes().includes(value)) this.pageSizeChange.emit(value);
  }
}
