import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'products',
    loadChildren: () => import('@products/products.routes').then((module) => module.PRODUCT_ROUTES),
  },
  { path: '**', redirectTo: 'products' },
];
