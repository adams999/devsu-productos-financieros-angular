import { Routes } from '@angular/router';
import { unsavedProductChangesGuard } from './guards/unsaved-product-changes-guard';
import { PRODUCT_PROVIDERS } from './products.providers';
import { ProductIdAvailability } from './state/product-id-availability';
import { ProductFormComponentStore } from './state/product-form.component-store';
import { ProductDeletionComponentStore } from './state/product-deletion.component-store';
import { ProductsListComponentStore } from './state/products-list.component-store';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Productos financieros',
    providers: [...PRODUCT_PROVIDERS, ProductsListComponentStore, ProductDeletionComponentStore],
    loadComponent: () =>
      import('./pages/products-list/products-list').then((module) => module.ProductsList),
  },
  {
    path: 'new',
    title: 'Agregar producto',
    providers: [...PRODUCT_PROVIDERS, ProductIdAvailability, ProductFormComponentStore],
    canDeactivate: [unsavedProductChangesGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then((module) => module.ProductForm),
  },
  {
    path: ':id/edit',
    title: 'Editar producto',
    providers: [...PRODUCT_PROVIDERS, ProductIdAvailability, ProductFormComponentStore],
    canDeactivate: [unsavedProductChangesGuard],
    loadComponent: () =>
      import('./pages/product-form/product-form').then((module) => module.ProductForm),
  },
];
