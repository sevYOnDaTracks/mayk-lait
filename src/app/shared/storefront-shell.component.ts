import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../core/cart.service';
import { AuthService } from '../core/auth.service';
import { OnboardingComponent } from './onboarding.component';

@Component({ selector: 'app-storefront-shell', imports: [RouterOutlet, RouterLink, RouterLinkActive, CurrencyPipe, OnboardingComponent], template: `
  <header class="site-header">
    <a routerLink="/" class="brand" aria-label="MAYKLAIT, accueil">MAYKLAIT</a>
    <nav class="desktop-nav icon-nav" aria-label="Navigation principale"><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" aria-label="Accueil" title="Accueil"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></svg></a><a routerLink="/boutique" routerLinkActive="active" aria-label="Boutique" title="Boutique"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v11h16V9"/><path d="M3 4h18l-1 5a3 3 0 0 1-5 1 3 3 0 0 1-6 0 3 3 0 0 1-5-1l-1-5Z"/><path d="M9 20v-5h6v5"/></svg></a></nav>
    <div class="header-actions">@if(auth.isAdmin()){<a routerLink="/admin" class="mode-switch">Mode administrateur</a>}<a routerLink="/compte" class="account-link header-icon" aria-label="Mon compte" title="Mon compte"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></a><button class="cart-trigger icon-cart" (click)="cart.open.set(true)" aria-label="Ouvrir le panier" title="Panier"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg><span>{{ cart.count() }}</span></button><button class="menu-trigger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-label="Ouvrir le menu"><i></i><i></i></button></div>
    @if (menuOpen()) { <nav class="mobile-menu"><a routerLink="/" (click)="menuOpen.set(false)">Accueil</a><a routerLink="/boutique" (click)="menuOpen.set(false)">Boutique</a><a routerLink="/compte" (click)="menuOpen.set(false)">Mon compte</a></nav> }
  </header>
  <main><router-outlet /></main>
  <app-onboarding />
  <footer><a routerLink="/" class="brand brand-light">MAYKLAIT</a><div class="footer-links"><a routerLink="/commander">Commander</a><a routerLink="/compte">Mon compte</a><a href="mailto:bonjour@mayklait.fr">Contact</a><a href="#">Conditions</a><a href="#">Confidentialité</a><a href="#">Instagram</a></div><small>© 2026 MAYKLAIT. Préparé avec soin.</small></footer>
  @if (cart.open()) { <div class="drawer-backdrop" (click)="cart.open.set(false)"></div><aside class="cart-drawer" aria-label="Panier"><div class="drawer-head"><h2>Ton panier</h2><button class="icon-button" (click)="cart.open.set(false)" aria-label="Fermer">×</button></div>
    @if (cart.items().length) { <div class="cart-list">@for (item of cart.items(); track item.id) { <article class="cart-item"><img [src]="item.image" [alt]="item.name"><div><strong>{{ item.name }}</strong><p>@if(item.volume){ {{item.volume}} · }@for (selection of item.selections; track selection.groupId) { {{ selection.options[0]?.name }} · }</p><div class="quantity"><button (click)="cart.changeQuantity(item.id,-1)" aria-label="Diminuer">−</button><span>{{ item.quantity }}</span><button (click)="cart.changeQuantity(item.id,1)" aria-label="Augmenter">+</button></div><button class="text-button" (click)="cart.remove(item.id)">Supprimer</button></div><strong>{{ item.unitPrice * item.quantity | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></article> }</div><div class="drawer-total"><span>Sous-total</span><strong>{{ cart.subtotal() | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></div><a routerLink="/checkout" class="button full" (click)="cart.open.set(false)">Commander</a><button class="button ghost full" (click)="cart.open.set(false)">Continuer mes achats</button>
    } @else { <div class="empty-state"><span>◯</span><h3>Ton panier a faim.</h3><p>Un bon dêguê devrait arranger ça.</p><a routerLink="/commander" class="button" (click)="cart.open.set(false)">Découvrir le menu</a></div> }
  </aside> }
` })
export class StorefrontShellComponent { readonly cart = inject(CartService); readonly auth = inject(AuthService); readonly menuOpen = signal(false); }
