import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '@app/core/notifications/toast.service';
import { InputControlField } from '@app/shared/ui/form-control/input-control';
import { TextareaControlField } from '@app/shared/ui/form-control/textarea-control';
import { LEAVE_CONFIRMATION } from '@app/shared/browser/leave-confirmation';
import { createProductForm } from '@products/forms/product-form.rules';
import { PRODUCT_TODAY } from '@products/ports/product-clock';
import { ProductFormComponentStore } from '@products/state/product-form.component-store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InputControlField, TextareaControlField, RouterLink],
  selector: 'app-product-form',
  styleUrl: './product-form.scss',
  templateUrl: './product-form.html',
})
export class ProductForm {
  protected readonly store = inject(ProductFormComponentStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmLeave = inject(LEAVE_CONFIRMATION);
  private readonly today = inject(PRODUCT_TODAY);
  private readonly toast = inject(ToastService);
  protected readonly productId = signal(this.route.snapshot.paramMap.get('id') ?? '');
  protected readonly isEdit = this.productId() !== '';

  protected readonly productForm = createProductForm(this.store.model, {
    isEdit: this.isEdit,
    idVerification: this.store.idVerification,
    today: this.today,
  });

  protected readonly canSubmit = computed(
    () =>
      !this.store.isLoading() &&
      !this.store.isSaving() &&
      !this.productForm().pending() &&
      !this.productForm().invalid() &&
      (this.isEdit
        ? this.store.hasLoadedProduct()
        : this.store.idVerification().id === this.store.model().id &&
          this.store.idVerification().status === 'available'),
  );

  constructor() {
    if (this.isEdit) {
      this.route.paramMap
        .pipe(
          map((params) => params.get('id') ?? ''),
          distinctUntilChanged(),
          takeUntilDestroyed(),
        )
        .subscribe((id) => {
          this.productId.set(id);
          this.store.load(id);
        });
    }
  }

  canLeave(): boolean {
    return (
      !this.store.hasUnsavedChanges() ||
      this.confirmLeave('Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?')
    );
  }

  protected onIdInput(value: string): void {
    if (!this.isEdit) this.store.verifyId(value);
  }

  protected onReleaseInput(value: string): void {
    this.store.setReleaseDate(value);
  }

  protected onReset(): void {
    this.productForm().reset();
    this.store.reset();
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.canSubmit()) {
      this.productForm().markAsTouched();
      return;
    }

    void submit(this.productForm, {
      ignoreValidators: 'none',
      action: async () => {
        const saved = this.isEdit ? await this.store.update() : await this.store.create();
        if (saved) {
          this.toast.success(
            this.isEdit ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
          );
          await this.router.navigate(['/products']);
        } else {
          const error = this.store.error();
          if (error) this.toast.error(error);
        }
      },
    });
  }
}
