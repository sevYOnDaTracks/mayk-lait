import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
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
      @if (orders.loading()) {
        <div class="empty-state"><p>Chargement des commandes…</p></div>
      } @else if (!orders.orders().length) {
        <div class="empty-state"><h2>Ta première commande t’attend.</h2><p>Aucune commande enregistrée pour le moment.</p><a routerLink="/boutique" class="button">Commander</a></div>
      } @else {
        <div class="customer-orders">
          @for (order of orders.orders(); track order.id) {
            <a [routerLink]="[order.id]" class="customer-order-card" [attr.aria-label]="'Voir la commande ' + orderNumber(order)">
              <div>
                <small>{{ order.createdAt?.toDate() | date:'dd MMMM yyyy · HH:mm' }}</small>
                <h2>Commande {{ orderNumber(order) }}</h2>
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

  itemCount(items?: Array<{ quantity?: number }>) {
    return (items ?? []).reduce((total, item) => total + (item.quantity ?? 1), 0);
  }

  label(status = 'pending') {
    return ({ pending: 'Commande reçue', confirmed: 'Confirmée', preparing: 'En préparation', ready: 'Prête', delivering: 'En livraison', completed: 'Livrée', cancelled: 'Annulée' } as Record<string, string>)[status] ?? status;
  }
}
