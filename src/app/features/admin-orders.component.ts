import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminOrder, OrderAdminService } from '../core/order-admin.service';
import { OrderStatus } from '../core/models';
import { displayOrderNumber } from '../core/order-number';

function inputDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function currentOrderWeek(date = new Date()) {
  const saturday = new Date(date);
  const daysSinceSaturday = (date.getDay() + 1) % 7;
  saturday.setDate(date.getDate() - daysSinceSaturday);
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  return { from: inputDate(saturday), to: inputDate(friday) };
}

@Component({
  selector: 'app-admin-orders-live',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <section class="admin-page admin-orders-page">
      <div class="admin-title">
        <div>
          <p class="eyebrow">OPÉRATIONS</p>
          <h1>Commandes</h1>
        </div>
      </div>

      <div class="order-toolbar">
        <label class="customer-search order-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            placeholder="Rechercher un numéro, un client, un email ou un téléphone"
            [value]="search()"
            (input)="search.set($any($event.target).value)"
            aria-label="Rechercher une commande"
          >
        </label>
        <div class="order-date-range" aria-label="Filtrer les commandes par intervalle de dates">
          <label>
            <span>Du</span>
            <input type="date" [ngModel]="dateFrom()" (ngModelChange)="dateFrom.set($event)">
          </label>
          <label>
            <span>Au</span>
            <input type="date" [ngModel]="dateTo()" (ngModelChange)="dateTo.set($event)">
          </label>
          @if (dateFrom() || dateTo()) {
            <button type="button" class="text-button" (click)="clearDates()">Effacer</button>
          }
        </div>
      </div>

      <div class="order-filter-row">
        <div class="filter-tabs">
          @for (item of filters; track item.value) {
            <button [class.active]="filter() === item.value" (click)="filter.set(item.value)">{{ item.label }}</button>
          }
        </div>
        <span class="order-results">{{ filtered().length }} commande(s)</span>
      </div>

      @if (orders.loading()) {
        <div class="admin-empty"><p>Chargement…</p></div>
      } @else if (orders.error()) {
        <p class="form-error">{{ orders.error() }}</p>
      } @else if (!filtered().length) {
        <div class="admin-empty">
          <h2>Aucune commande.</h2>
          <p>{{ search() ? 'Aucune commande ne correspond à cette recherche.' : 'Aucune commande ne correspond à ce filtre.' }}</p>
        </div>
      } @else {
        <div class="orders-mobile">
          @for (order of filtered(); track order.id) {
            <article>
              <div>
                <small>{{ orderNumber(order) }} · {{ order.createdAt?.toDate() | date:'dd/MM à HH:mm' }}</small>
                <h2>{{ customerName(order) }}</h2>
                <p>{{ itemCount(order) }} article(s)</p>
              </div>
              <div>
                <strong>{{ order.total || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                <select [ngModel]="order.status" (ngModelChange)="changeStatus(order, $event)" aria-label="Modifier le statut">
                  <option value="pending">Nouvelle</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="preparing">En préparation</option>
                  <option value="ready">Prête</option>
                  <option value="delivering">En livraison</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
                <button type="button" class="order-detail-trigger" (click)="openOrder(order)">Voir le détail <span>→</span></button>
              </div>
            </article>
          }
        </div>
      }

      @if (selectedOrder(); as order) {
        <div class="admin-order-backdrop" (click)="closeOrder()"></div>
        <aside class="admin-order-drawer" role="dialog" aria-modal="true" aria-labelledby="admin-order-title">
          <div class="drawer-head">
            <div>
              <p class="eyebrow">COMMANDE</p>
              <h2 id="admin-order-title">{{ orderNumber(order) }}</h2>
              <small>{{ order.createdAt?.toDate() | date:'dd MMMM yyyy à HH:mm' }}</small>
            </div>
            <button class="icon-button" (click)="closeOrder()" aria-label="Fermer">×</button>
          </div>

          <section class="admin-order-status">
            <label>Statut de la commande
              <select [ngModel]="order.status" (ngModelChange)="changeStatus(order, $event)">
                <option value="pending">Nouvelle</option>
                <option value="confirmed">Confirmée</option>
                <option value="preparing">En préparation</option>
                <option value="ready">Prête</option>
                <option value="delivering">En livraison</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </label>
          </section>

          <section class="admin-order-section">
            <div class="admin-order-section-title"><h3>Articles à préparer</h3><span>{{ itemCount(order) }}</span></div>
            <p class="admin-order-edit-note">{{ canEditOrder(order) ? 'Tu peux ajuster les quantités jusqu’au statut « En préparation ».' : 'Les quantités sont verrouillées à ce stade.' }}</p>
            @if (itemEditError()) { <p class="form-error">{{ itemEditError() }}</p> }
            <div class="admin-order-items">
              @for (item of order.items ?? []; track item.id ?? $index; let itemIndex = $index) {
                <article>
                  @if (item.image) { <img [src]="item.image" [alt]="item.name || 'Produit MAYKLAIT'"> }
                  <div>
                    <h4>{{ item.quantity || 1 }} × {{ item.name }}</h4>
                    @if (item.volume) { <p>{{ item.volume }}</p> }
                    @for (selection of item.selections ?? []; track selection.groupId ?? $index) {
                      <small><strong>{{ selection.groupName }}</strong> : @for (option of selection.options ?? []; track option.id ?? $index) { {{ option.name }}@if (!$last) {, } }</small>
                    }
                  </div>
                  <div class="admin-order-line-actions">
                    <strong>{{ (item.unitPrice || 0) * (item.quantity || 1) | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong>
                    @if (canEditOrder(order)) {
                      <div class="admin-quantity-editor" aria-label="Modifier la quantité">
                        <button type="button" [disabled]="(item.quantity || 1) <= 1 || updatingItemIndex() === itemIndex" (click)="changeQuantity(order, itemIndex, (item.quantity || 1) - 1)" [attr.aria-label]="'Diminuer la quantité de ' + item.name">−</button>
                        <span>{{ updatingItemIndex() === itemIndex ? '…' : (item.quantity || 1) }}</span>
                        <button type="button" [disabled]="(item.quantity || 1) >= 100 || updatingItemIndex() === itemIndex" (click)="changeQuantity(order, itemIndex, (item.quantity || 1) + 1)" [attr.aria-label]="'Augmenter la quantité de ' + item.name">+</button>
                      </div>
                    }
                  </div>
                </article>
              }
            </div>
          </section>

          <section class="admin-order-section admin-order-customer">
            <h3>Client et livraison</h3>
            <div class="admin-order-info-grid">
              <div><small>CLIENT</small><p><strong>{{ customerName(order) }}</strong><br>{{ order.customer?.email }}<br>{{ order.customer?.phone }}</p></div>
              <div><small>ADRESSE</small><p>{{ order.address?.line1 }}@if (order.address?.line2) {<br>{{ order.address?.line2 }}}<br>{{ order.address?.postalCode }} {{ order.address?.city }}</p></div>
            </div>
            @if (order.address?.instructions) {
              <div class="admin-delivery-note"><small>INSTRUCTIONS DE LIVRAISON</small><p>{{ order.address?.instructions }}</p></div>
            }
          </section>

          <section class="admin-order-totals">
            <dl>
              <div><dt>Sous-total</dt><dd>{{ order.subtotal || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
              @if (order.discount) { <div class="discount-line"><dt>Code {{ order.promotion?.code }}</dt><dd>− {{ order.discount | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div> }
              <div><dt>Livraison</dt><dd>{{ order.deliveryFee || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
              <div class="grand-total"><dt>Total</dt><dd>{{ order.total || 0 | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
            </dl>
          </section>
        </aside>
      }
    </section>
  `
})
export class AdminOrdersLiveComponent {
  private readonly defaultDateRange = currentOrderWeek();
  readonly orders = inject(OrderAdminService);
  readonly filter = signal<'all' | OrderStatus>('all');
  readonly search = signal('');
  readonly dateFrom = signal(this.defaultDateRange.from);
  readonly dateTo = signal(this.defaultDateRange.to);
  readonly selectedOrderId = signal<string | null>(null);
  readonly selectedOrder = computed(() => this.orders.orders().find(order => order.id === this.selectedOrderId()));
  readonly updatingItemIndex = signal<number | null>(null);
  readonly itemEditError = signal('');
  readonly orderNumber = displayOrderNumber;
  readonly filters = [
    { value: 'all' as const, label: 'Toutes' },
    { value: 'pending' as const, label: 'Nouvelles' },
    { value: 'confirmed' as const, label: 'Confirmées' },
    { value: 'preparing' as const, label: 'En préparation' },
    { value: 'ready' as const, label: 'Prêtes' },
    { value: 'delivering' as const, label: 'En livraison' },
    { value: 'completed' as const, label: 'Terminées' },
    { value: 'cancelled' as const, label: 'Annulées' }
  ];

  readonly filtered = computed(() => {
    const term = this.normalize(this.search());
    return this.orders.orders().filter(order => {
      const matchesStatus = this.filter() === 'all' || order.status === this.filter();
      const matchesDate = this.isWithinDateRange(order);
      if (!matchesStatus || !matchesDate) return false;
      if (!term) return true;
      const customer = order.customer;
      const searchable = [
        displayOrderNumber(order),
        customer?.firstName,
        customer?.lastName,
        customer?.email,
        customer?.phone
      ].filter(Boolean).join(' ');
      return this.normalize(searchable).includes(term);
    });
  });

  customerName(order: AdminOrder) {
    return [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Client';
  }

  itemCount(order: AdminOrder) {
    return (order.items ?? []).reduce((total, item) => total + (item.quantity ?? 1), 0);
  }

  openOrder(order: AdminOrder) {
    this.selectedOrderId.set(order.id);
  }

  closeOrder() {
    this.selectedOrderId.set(null);
    this.itemEditError.set('');
  }

  canEditOrder(order: AdminOrder) {
    return ['pending', 'confirmed', 'preparing'].includes(order.status ?? 'pending');
  }

  async changeQuantity(order: AdminOrder, itemIndex: number, quantity: number) {
    if (!this.canEditOrder(order) || quantity < 1 || quantity > 100) return;
    this.updatingItemIndex.set(itemIndex);
    this.itemEditError.set('');
    try {
      await this.orders.updateItemQuantity(order.id, itemIndex, quantity);
    } catch (error: any) {
      this.itemEditError.set(error?.message ?? 'Impossible de modifier cette quantité.');
    } finally {
      this.updatingItemIndex.set(null);
    }
  }

  async changeStatus(order: AdminOrder, status: OrderStatus) {
    await this.orders.updateStatus(order.id, status);
  }

  clearDates() {
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  private isWithinDateRange(order: AdminOrder) {
    if (!this.dateFrom() && !this.dateTo()) return true;
    const createdAt = order.createdAt?.toDate();
    if (!createdAt) return false;
    const from = this.dateFrom() ? new Date(`${this.dateFrom()}T00:00:00`) : null;
    const to = this.dateTo() ? new Date(`${this.dateTo()}T23:59:59.999`) : null;
    return (!from || createdAt >= from) && (!to || createdAt <= to);
  }

  private normalize(value: string) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  }
}
