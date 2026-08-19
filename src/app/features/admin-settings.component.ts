import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckoutSettingsService } from '../core/checkout-settings.service';

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule, CurrencyPipe],
  template: `
    <section class="admin-page settings-admin">
      <div class="admin-title">
        <div>
          <p class="eyebrow">PARAMÈTRES</p>
          <h1>Livraison</h1>
          <p>Configure les frais appliqués à toutes les nouvelles commandes.</p>
        </div>
      </div>

      <section class="settings-card" aria-labelledby="delivery-fee-title">
        <div class="settings-card-copy">
          <p class="eyebrow">TARIFICATION</p>
          <h2 id="delivery-fee-title">Frais de livraison</h2>
          <p>Ce montant sera ajouté au panier et recalculé par Firebase au moment de confirmer la commande.</p>
        </div>

        @if (settings.loading()) {
          <p>Chargement…</p>
        } @else {
          <form (ngSubmit)="save()">
            <label for="delivery-fee">Montant en euros</label>
            <div class="money-input">
              <input id="delivery-fee" name="deliveryFee" type="number" min="0" max="100" step="0.01" required [(ngModel)]="deliveryFee">
              <span>€</span>
            </div>
            <p class="settings-preview">Le client verra : <strong>{{ normalizedFee() | currency:'EUR':'symbol':'1.2-2':'fr' }}</strong></p>
            <p class="settings-hint">Indique 0 € si la livraison est gratuite.</p>
            @if (saved()) { <p class="success">Les frais de livraison sont enregistrés.</p> }
            @if (error()) { <p class="form-error">{{ error() }}</p> }
            <button class="button" [disabled]="saving() || !valid()">{{ saving() ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </form>
        }
      </section>
    </section>
  `
})
export class AdminSettingsComponent {
  readonly settings = inject(CheckoutSettingsService);
  readonly saving = signal(false);
  readonly saved = signal(false);
  readonly error = signal('');
  deliveryFee = 0;

  constructor() {
    effect(() => { if (!this.settings.loading()) this.deliveryFee = this.settings.deliveryFee(); });
  }

  normalizedFee() { const value = Number(this.deliveryFee); return Number.isFinite(value) ? Math.max(0, value) : 0; }
  valid() { const value = Number(this.deliveryFee); return Number.isFinite(value) && value >= 0 && value <= 100; }

  async save() {
    if (!this.valid()) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');
    try {
      await this.settings.updateDeliveryFee(Number(this.deliveryFee));
      this.saved.set(true);
    } catch {
      this.error.set('Impossible d’enregistrer les frais de livraison. Vérifie ton accès administrateur.');
    } finally {
      this.saving.set(false);
    }
  }
}
