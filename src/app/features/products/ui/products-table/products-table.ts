import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActionMenu } from '@app/shared/ui/action-menu/action-menu';
import type { ActionMenuItem } from '@app/shared/ui/action-menu/action-menu.models';
import { AvatarImage } from '@app/shared/ui/avatar-image/avatar-image';
import { DataTable } from '@app/shared/ui/data-table/data-table';
import { InfoTooltip } from '@app/shared/ui/info-tooltip/info-tooltip';
import type { Product } from '@products/models/products.models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActionMenu, AvatarImage, DataTable, InfoTooltip, RouterLink],
  selector: 'app-products-table',
  styleUrl: './products-table.scss',
  templateUrl: './products-table.html',
})
export class ProductsTable {
  private readonly dataTable = viewChild.required(DataTable);
  readonly products = input<readonly Product[]>([]);
  readonly loading = input(false);
  readonly error = input<string>();
  readonly emptyMessage = input('Aún no hay productos para mostrar.');
  readonly actions = input<readonly ActionMenuItem[]>([]);
  readonly productLink = input<(product: Product) => string[]>();
  readonly retry = output<void>();
  readonly actionRequested = output<{ id: string; product: Product }>();

  scrollToTop(): void {
    this.dataTable().scrollToTop();
  }

  protected onRowAction(id: string, product: Product): void {
    this.actionRequested.emit({ id, product });
  }

  protected displayDate(value: string): string {
    const [year, month, day] = value.split('-');
    return year && month && day ? day + '/' + month + '/' + year : value;
  }
}
