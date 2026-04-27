import { Routes } from '@angular/router';
import { adminGuard, staffGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./pages/catalogo/catalogo.page').then((m) => m.CatalogoPage),
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./pages/producto/producto.page').then((m) => m.ProductoPage),
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'usuarios',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/usuarios/usuarios.page').then((m) => m.UsuariosPage),
  },
  {
    path: 'productos',
    canActivate: [staffGuard],
    loadComponent: () => import('./pages/productos/productos.page').then((m) => m.ProductosPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
