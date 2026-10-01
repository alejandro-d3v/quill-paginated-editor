import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.routes').then((r) => r.HOME_ROUTES)
  },

  {
    path: '**',
    redirectTo: '',
  }
];
