import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { CartItem, OrderStatus } from '../core/models';
import { AdminOrder, AdminOrderItem } from '../core/order-admin.service';
import { displayOrderNumber } from '../core/order-number';
import { OrderService } from '../core/order.service';

@Component({
  selector: 'app-account-order-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <section class="subpage order-detail-page">
      <a routerLink="/compte/commandes" class="back-link">← Mes commandes</a>

      @if (orders.loading()) {
        <div class="empty-state"><p>Chargement de la commande…</p></div>
      } @else if (order(); as order) {
        <header class="order-detail-head">
          <div>
            <p class="eyebrow">{{ order.createdAt?.toDate() | date:'dd MMMM yyyy · HH:mm' }}</p>
            <h1>{{ orderNumber(order) }}</h1>
          </div>
          <span class="status" [class]="'status ' + order.status">{{ statusLabel(order.status) }}</span>
        </header>

        @if (order.status === 'cancelled') {
          <div class="order-cancelled"><strong>Cette commande a été annulée.</strong><p>Contacte MAYKLAIT si tu as besoin d’aide.</p></div>
        } @else {
          <section class="order-progress" aria-label="Suivi de la commande">
            @for (step of steps; track step.status) {
              <div [class.done]="isDone(order.status, step.status)" [class.current]="order.status === step.status">
                <i aria-hidden="true"></i><span>{{ step.label }}</span>
              </div>
            }
          </section>
        }

        <div class="order-detail-grid">
          <main>
            <section class="order-detail-section">
              <h2>Articles</h2>
              <div class="order-detail-items">
                @for (item of order.items ?? []; track item.id ?? $index) {
                  <article>
                    @if (item.image) { <img [src]="item.image" [alt]="item.name || 'Produit MAYKLAIT'"> }
                    <div>
                      <h3>{{ item.quantity || 1 }} × {{ item.name }}</h3>
                      @if (item.volume) { <p>{{ item.volume }}</p> }
                      @for (selection of item.selections ?? []; track selection.groupId ?? $index) {
                        <small><strong>{{ selection.groupName }}</strong> : @for (option of selection.options ?? []; track option.id ?? $index) { {{ option.name }}@if (!$last) {, } }</small>
                      }
                    </div>
                    <strong>{{ (item.unitPrice || 0) * (item.quantity || 1) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                  </article>
                }
              </div>
            </section>

            <section class="order-detail-section delivery-detail">
              <h2>Livraison</h2>
              <p><strong>{{ order.customer?.firstName }} {{ order.customer?.lastName }}</strong><br>{{ order.address?.line1 }}@if (order.address?.line2) {<br>{{ order.address?.line2 }}}<br>{{ order.address?.postalCode }} {{ order.address?.city }}</p>
              @if (order.customer?.phone) { <p>{{ order.customer?.phone }}</p> }
              @if (order.address?.instructions) { <div class="delivery-instructions"><small>INSTRUCTIONS</small><p>{{ order.address?.instructions }}</p></div> }
              <span>Livraison prévue pour le week-end suivant la commande.</span>
            </section>
          </main>

          <aside class="order-detail-summary">
            <h2>Récapitulatif</h2>
            <dl>
              <div><dt>Sous-total</dt><dd>{{ order.subtotal || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
              @if (order.discount) { <div class="discount-line"><dt>Code {{ order.promotion?.code }}</dt><dd>− {{ order.discount | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div> }
              <div><dt>Livraison</dt><dd>{{ order.deliveryFee || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
              <div class="grand-total"><dt>Total</dt><dd>{{ order.total || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
            </dl>
            @if (canReorder(order)) { <button class="button full" (click)="reorder(order)">Commander à nouveau</button> }
          </aside>
        </div>
      } @else {
        <div class="empty-state order-not-found"><h2>Commande introuvable.</h2><p>Cette commande n’existe pas ou ne t’appartient pas.</p><a routerLink="/compte/commandes" class="button">Retour aux commandes</a></div>
      }
    </section>
  `
})
export class AccountOrderDetailComponent {
  private route = inject(ActivatedRoute);
  readonly orders = inject(OrderService);
  private cart = inject(CartService);
  private id = this.route.snapshot.paramMap.get('id');
  readonly order = computed(() => this.orders.orders().find(order => order.id === this.id));
  readonly orderNumber = displayOrderNumber;
  readonly steps: Array<{ status: OrderStatus; label: string }> = [
    { status: 'pending', label: 'Reçue' },
    { status: 'confirmed', label: 'Confirmée' },
    { status: 'preparing', label: 'En préparation' },
    { status: 'ready', label: 'Prête' },
    { status: 'delivering', label: 'En livraison' },
    { status: 'completed', label: 'Livrée' }
  ];

  statusLabel(status = 'pending') {
    return ({ pending: 'Commande reçue', confirmed: 'Confirmée', preparing: 'En préparation', ready: 'Prête', delivering: 'En livraison', completed: 'Livrée', cancelled: 'Annulée' } as Record<string, string>)[status] ?? status;
  }

  isDone(current: OrderStatus | undefined, step: OrderStatus) {
    return this.steps.findIndex(item => item.status === step) <= this.steps.findIndex(item => item.status === (current ?? 'pending'));
  }

  canReorder(order: AdminOrder) {
    return Boolean(order.items?.length && order.items.every(item => item.productId && item.name && item.slug && typeof item.unitPrice === 'number'));
  }

  reorder(order: AdminOrder) {
    (order.items ?? []).forEach(item => this.cart.add(this.toCartItem(item)));
  }

  private toCartItem(item: AdminOrderItem): CartItem {
    return {
      id: crypto.randomUUID(),
      productId: item.productId ?? '',
      name: item.name ?? '',
      slug: item.slug ?? '',
      image: item.image ?? '',
      volume: item.volume,
      basePrice: item.basePrice ?? item.unitPrice ?? 0,
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? 0,
      selections: (item.selections ?? []).map(selection => ({
        groupId: selection.groupId ?? '',
        groupName: selection.groupName ?? '',
        options: (selection.options ?? []).map(option => ({ id: option.id ?? '', name: option.name ?? '', priceModifier: option.priceModifier ?? 0, available: true, position: 0 }))
      }))
    };
  }
}
