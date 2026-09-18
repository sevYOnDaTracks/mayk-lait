import { Routes } from '@angular/router';

import { AccountPage } from './pages/account/account-page';
import { CartPage } from './pages/cart/cart-page';
import { ContactPage } from './pages/contact/contact-page';
import { HomePage } from './pages/home/home-page';
import { ProductsPage } from './pages/products/products-page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Mayk Lait — Yaourt et dègue faits maison' },
  { path: 'produits', component: ProductsPage, title: 'Produits — Mayk Lait' },
  { path: 'contact', component: ContactPage, title: 'Contact — Mayk Lait' },
  { path: 'commande', component: CartPage, title: 'Votre commande — Mayk Lait' },
  {
    path: 'connexion',
    component: AccountPage,
    data: { mode: 'login' },
    title: 'Connexion — Mayk Lait',
  },
  {
    path: 'inscription',
    component: AccountPage,
    data: { mode: 'register' },
    title: 'Créer un compte — Mayk Lait',
  },
  { path: 'panier', redirectTo: 'commande' },
  { path: '**', redirectTo: '' },
];
