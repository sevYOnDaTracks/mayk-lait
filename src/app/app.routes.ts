import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards';

export const routes: Routes = [
  { path: 'connexion', loadComponent: () => import('./features/auth.component').then(m => m.AuthComponent), title: 'Connexion | MAYKLAIT' },
  { path: 'inscription', loadComponent: () => import('./features/auth.component').then(m => m.AuthComponent), title: 'Inscription | MAYKLAIT' },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./features/admin.component').then(m => m.AdminShellComponent), children: [
    { path: '', loadComponent: () => import('./features/admin-dashboard.component').then(m => m.AdminDashboardLiveComponent), title: 'Administration | MAYKLAIT' },
    { path: 'orders', loadComponent: () => import('./features/admin-orders.component').then(m => m.AdminOrdersLiveComponent), title: 'Commandes | Admin MAYKLAIT' },
    { path: 'products', loadComponent: () => import('./features/admin-products.component').then(m => m.AdminProductsLiveComponent), title: 'Produits | Admin MAYKLAIT' },
    { path: 'clients', loadComponent: () => import('./features/admin-customers.component').then(m => m.AdminCustomersComponent), title: 'Clients | Admin MAYKLAIT' },
    { path: 'promotions', loadComponent: () => import('./features/admin-promotions.component').then(m => m.AdminPromotionsComponent), title: 'Codes promo | Admin MAYKLAIT' },
    { path: 'settings', loadComponent: () => import('./features/admin-settings.component').then(m => m.AdminSettingsComponent), title: 'Paramètres | Admin MAYKLAIT' }
  ]},
  { path: '', loadComponent: () => import('./shared/storefront-shell.component').then(m => m.StorefrontShellComponent), children: [
    { path: '', loadComponent: () => import('./features/home.component').then(m => m.HomeComponent), title: 'MAYKLAIT — Dêguê premium' },
    { path: 'boutique', loadComponent: () => import('./features/shop.component').then(m => m.ShopComponent), title: 'Boutique | MAYKLAIT' },
    { path: 'commander', redirectTo: 'boutique', pathMatch: 'full' },
    { path: 'produit/:slug', loadComponent: () => import('./features/product.component').then(m => m.ProductComponent), title: 'Dêguê | MAYKLAIT' },
    { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./features/checkout.component').then(m => m.CheckoutComponent), title: 'Finaliser ma commande | MAYKLAIT' },
    { path: 'compte', canActivate: [authGuard], loadComponent: () => import('./features/account.component').then(m => m.AccountComponent), title: 'Mon compte | MAYKLAIT', children: [
      { path: 'commandes', loadComponent: () => import('./features/account-orders.component').then(m => m.AccountOrdersLiveComponent) },
      { path: 'commandes/:id', loadComponent: () => import('./features/account-order-detail.component').then(m => m.AccountOrderDetailComponent), title: 'Détail de la commande | MAYKLAIT' },
      { path: 'adresses', loadComponent: () => import('./features/account-pages.component').then(m => m.AddressesComponent) },
      { path: 'profil', loadComponent: () => import('./features/account-pages.component').then(m => m.ProfileComponent) }
    ]}
  ]},
  { path: '**', redirectTo: '' }
];
