import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderService } from '../core/order.service';
import { displayOrderNumber } from '../core/order-number';

@Component({
  selector: 'app-account-orders-live',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <section class="subpage orders-page">
      <p class="eyebrow">HISTORIQUE</p>
      <h1>Mes commandes</h1>
      <div class="order-tabs" role="tablist" aria-label="Filtrer les commandes">
        <button type="button" role="tab" [class.active]="tab() === 'current'" [attr.aria-selected]="tab() === 'current'" (click)="tab.set('current')" aria-label="Commandes en cours" title="Commandes en cours">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          @if (currentCount()) { <span>{{ currentCount() }}</span> }
        </button>
        <button type="button" role="tab" [class.active]="tab() === 'history'" [attr.aria-selected]="tab() === 'history'" (click)="tab.set('history')" aria-label="Historique des commandes" title="Historique des commandes">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4Z"/><path d="M3 4h18v4H3Z"/><path d="m9 14 2 2 4-4"/></svg>
          @if (historyCount()) { <span>{{ historyCount() }}</span> }
        </button>
      </div>
      @if (orders.loading()) {
        <div class="empty-state"><p>Chargement des commandes…</p></div>
      } @else if (!orders.orders().length) {
        <div class="empty-state"><h2>Ta première commande t’attend.</h2><p>Aucune commande enregistrée pour le moment.</p><a routerLink="/boutique" class="button">Commander</a></div>
      } @else if (!visibleOrders().length) {
        <div class="empty-state compact-order-empty">
          @if (tab() === 'current') {
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <h2>Aucune commande en cours.</h2>
            <a routerLink="/boutique" class="button">Voir la boutique</a>
          } @else {
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4Z"/><path d="M3 4h18v4H3Z"/></svg>
            <h2>Historique vide.</h2>
          }
        </div>
      } @else {
        <div class="customer-orders">
          @for (order of visibleOrders(); track order.id) {
            <a [routerLink]="[order.id]" class="customer-order-card" [attr.aria-label]="'Voir la commande ' + orderNumber(order)">
              <div>
                <small>{{ order.createdAt?.toDate() | date:'dd MMMM yyyy · HH:mm' }}</small>
                <h2 class="customer-order-title"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg><span>Commande {{ orderNumber(order) }}</span></h2>
                <p>{{ itemCount(order.items) }} article(s)</p>
              </div>
              <div>
                <span class="status" [class]="'status ' + order.status">{{ label(order.status) }}</span>
                <strong>{{ order.total || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                <b aria-hidden="true">→</b>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `
})
export class AccountOrdersLiveComponent {
  readonly orders = inject(OrderService);
  readonly orderNumber = displayOrderNumber;
  readonly tab = signal<'current' | 'history'>('current');
  readonly currentCount = computed(() => this.orders.orders().filter(order => !this.isHistory(order.status)).length);
  readonly historyCount = computed(() => this.orders.orders().filter(order => this.isHistory(order.status)).length);
  readonly visibleOrders = computed(() => this.orders.orders().filter(order => this.tab() === 'history' ? this.isHistory(order.status) : !this.isHistory(order.status)));

  itemCount(items?: Array<{ quantity?: number }>) {
    return (items ?? []).reduce((total, item) => total + (item.quantity ?? 1), 0);
  }

  label(status = 'pending') {
    return ({ pending: 'Commande reçue', confirmed: 'Confirmée', preparing: 'En préparation', ready: 'Prête', delivering: 'En livraison', completed: 'Livrée', cancelled: 'Annulée' } as Record<string, string>)[status] ?? status;
  }

  private isHistory(status?: string) {
    return status === 'completed' || status === 'cancelled';
  }
}
