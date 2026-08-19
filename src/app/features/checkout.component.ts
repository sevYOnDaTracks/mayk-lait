import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AddressService } from '../core/address.service';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { Address } from '../core/models';
import { OrderService, PromotionValidation } from '../core/order.service';
import { CheckoutSettingsService } from '../core/checkout-settings.service';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  template: `
    <section class="checkout page-container">
      @if (done()) {
        <section class="checkout-success" aria-labelledby="success-title" aria-live="polite">
          <div class="checkout-success-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="m5 12 4 4L19 6" />
            </svg>
          </div>

          <p class="checkout-success-thanks">Merci {{ confirmedFirstName() }}.</p>
          <h1 id="success-title">Commande<br>confirmée.</h1>
          <p class="checkout-success-lead">Ta commande est bien enregistrée.</p>

          <p class="checkout-success-number">{{ confirmedOrderNumber() }}</p>

          <div class="checkout-success-delivery">
            <span>PROCHAINE ÉTAPE</span>
            <strong>Livraison prévue pour le week-end prochain.</strong>
            <small>Tu peux suivre sa préparation depuis ton compte.</small>
          </div>

          <div class="checkout-success-actions">
            <a routerLink="/compte/commandes" class="button">Suivre ma commande</a>
            <a routerLink="/boutique" class="text-link">Retour à la boutique</a>
          </div>
        </section>
      } @else if (cart.items().length) {
        <a routerLink="/boutique" class="back-link">← Continuer mes achats</a>
        <div class="checkout-heading">
          <p class="eyebrow">DERNIÈRE ÉTAPE</p>
          <h1>Où doit-on<br>te livrer ?</h1>
        </div>

        <div class="checkout-grid">
          <form [formGroup]="form" (ngSubmit)="confirm()">
            <h2>Coordonnées</h2>
            <div class="form-row">
              <label>Prénom *<input formControlName="firstName" autocomplete="given-name"></label>
              <label>Nom *<input formControlName="lastName" autocomplete="family-name"></label>
            </div>
            <div class="form-row">
              <label>Téléphone *<input formControlName="phone" autocomplete="tel"></label>
              <label>Email *<input type="email" formControlName="email" autocomplete="email"></label>
            </div>

            <h2>Livraison</h2>
            @if (addresses.loading()) {
              <div class="saved-address-loading">Chargement de tes adresses…</div>
            } @else if (addresses.error()) {
              <p class="form-error">{{ addresses.error() }}</p>
            } @else if (addresses.addresses().length) {
              <section class="saved-addresses" aria-labelledby="saved-addresses-title">
                <div class="saved-addresses-head">
                  <h3 id="saved-addresses-title">Mes adresses enregistrées</h3>
                  <button type="button" class="text-button" (click)="useAnotherAddress()">Utiliser une autre adresse</button>
                </div>
                <div class="saved-address-grid" role="radiogroup" aria-label="Choisir une adresse de livraison">
                  @for (address of addresses.addresses(); track address.id) {
                    <button type="button" class="saved-address-card" [class.selected]="selectedAddressId() === address.id" [attr.aria-checked]="selectedAddressId() === address.id" role="radio" (click)="selectAddress(address)">
                      <span class="saved-address-title"><strong>{{ address.label }}</strong>@if (address.primary) { <small>PRINCIPALE</small> }</span>
                      <span>{{ address.line1 }}</span>
                      @if (address.line2) { <span>{{ address.line2 }}</span> }
                      <span>{{ address.postalCode }} {{ address.city }}</span>
                    </button>
                  }
                </div>
              </section>
            }

            <label>Adresse *<input formControlName="address" autocomplete="street-address" (input)="clearAddressSelection()"></label>
            <label>Complément d’adresse<input formControlName="address2" (input)="clearAddressSelection()"></label>
            <div class="form-row">
              <label>Ville *<input formControlName="city" autocomplete="address-level2" (input)="clearAddressSelection()"></label>
              <label>Code postal *<input formControlName="postalCode" autocomplete="postal-code" (input)="clearAddressSelection()"></label>
            </div>
            <label>Instructions de livraison<textarea formControlName="instructions" rows="3" placeholder="Code, étage, porte..." (input)="clearAddressSelection()"></textarea></label>

            @if (auth.emailVerificationRequired()) {
              <section class="checkout-email-verification" aria-live="polite">
                <div>
                  <strong>Vérifie ton adresse email</strong>
                  <p>Cette étape est obligatoire avant de confirmer ta commande.</p>
                </div>
                <div class="checkout-verification-actions">
                  <button type="button" class="text-button" (click)="refreshEmailVerification()" [disabled]="verificationBusy()">J’ai vérifié mon email</button>
                  <button type="button" class="text-button" (click)="resendVerification()" [disabled]="verificationBusy()">Renvoyer le lien</button>
                </div>
                @if (verificationMessage()) { <small>{{ verificationMessage() }}</small> }
              </section>
            }

            <h2>Paiement</h2>
            <div class="payment-placeholder"><span>À la livraison</span><small>Le paiement en ligne sera bientôt disponible.</small></div>
            @if (error()) { <p class="form-error">{{ error() }}</p> }
            <button class="button full" [disabled]="form.invalid || saving() || auth.emailVerificationRequired()">{{ saving() ? 'Enregistrement…' : 'Confirmer ma commande' }}</button>
          </form>

          <aside class="order-summary" [formGroup]="form">
            <h2>Ta commande</h2>
            @for (item of cart.items(); track item.id) {
              <div class="summary-item">
                <img [src]="item.image" [alt]="item.name">
                <div><strong>{{ item.quantity }} × {{ item.name }}</strong><small>@if (item.volume) { {{ item.volume }} · }@for (selection of item.selections; track selection.groupId) { {{ selection.options[0]?.name }} · }</small></div>
                <span>{{ item.unitPrice * item.quantity | currency:'EUR':'symbol':'1.2-2':'fr' }}</span>
              </div>
            }
            <div class="promo-box" [class.applied]="appliedPromotion()">
              @if (appliedPromotion(); as promotion) {
                <div class="promo-applied">
                  <span class="promo-check" aria-hidden="true">✓</span>
                  <span><small>CODE APPLIQUÉ</small><strong>{{ promotion.code }}</strong></span>
                  <button type="button" class="promo-remove" (click)="removePromotion()" aria-label="Retirer le code promo">Retirer</button>
                </div>
              } @else {
                <button type="button" class="promo-trigger" (click)="promoOpen.set(!promoOpen())" [attr.aria-expanded]="promoOpen()" aria-controls="promo-entry">
                  <span aria-hidden="true">{{ promoOpen() ? '−' : '+' }}</span>
                  {{ promoOpen() ? 'Code promo' : 'Ajouter un code promo' }}
                </button>
                @if (promoOpen()) {
                  <div id="promo-entry" class="promo-entry">
                    <label for="promo-code">Ton code</label>
                    <div class="promo-input-row">
                      <input id="promo-code" formControlName="promoCode" placeholder="Ex. MAYKLAIT10" autocomplete="off" (input)="promoChanged()">
                      <button type="button" class="promo-apply" [disabled]="promoValidating() || !form.controls.promoCode.value" (click)="applyPromotion()">
                        {{ promoValidating() ? 'Vérification…' : 'Appliquer' }}
                      </button>
                    </div>
                    @if (promoError()) { <p class="promo-error">{{ promoError() }}</p> }
                  </div>
                }
              }
            </div>
            <dl>
              <div><dt>Sous-total</dt><dd>{{ cart.subtotal() | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
              @if (discount()) {
                <div class="discount-line"><dt>Code promo</dt><dd>− {{ discount() | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
              }
              <div><dt>Livraison</dt><dd>{{ delivery() | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
              <div class="grand-total"><dt>Total</dt><dd>{{ total() | currency:'EUR':'symbol':'1.2-2':'fr' }}</dd></div>
            </dl>
          </aside>
        </div>
      } @else {
        <div class="empty-state page"><h2>Ton panier a faim.</h2><a routerLink="/boutique" class="button">Découvrir la boutique</a></div>
      }
    </section>
  `
})
export class CheckoutComponent {
  readonly cart = inject(CartService);
  readonly addresses = inject(AddressService);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private orders = inject(OrderService);
  private checkoutSettings = inject(CheckoutSettingsService);
  readonly done = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly confirmedFirstName = signal('');
  readonly confirmedOrderNumber = signal('');
  readonly promoValidating = signal(false);
  readonly promoError = signal('');
  readonly promoOpen = signal(false);
  readonly verificationBusy = signal(false);
  readonly verificationMessage = signal('');
  readonly appliedPromotion = signal<PromotionValidation | null>(null);
  readonly selectedAddressId = signal<string | null>(null);
  readonly delivery = this.checkoutSettings.deliveryFee;
  readonly discount = computed(() => this.appliedPromotion()?.discount ?? 0);
  readonly total = computed(() => Math.max(0, this.cart.subtotal() - this.discount()) + this.delivery());
  private defaultAddressApplied = false;
  private user = this.auth.user();

  readonly form = this.fb.group({
    firstName: [this.user?.firstName ?? '', Validators.required],
    lastName: [this.user?.lastName ?? '', Validators.required],
    phone: [this.user?.phone ?? '', Validators.required],
    email: [this.user?.email ?? '', [Validators.required, Validators.email]],
    address: ['', Validators.required],
    address2: [''],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    instructions: [''],
    promoCode: ['']
  });

  constructor() {
    effect(() => {
      const loading = this.addresses.loading();
      const saved = this.addresses.addresses();
      if (!loading && saved.length && !this.defaultAddressApplied) {
        this.defaultAddressApplied = true;
        this.selectAddress(saved.find(address => address.primary) ?? saved[0]);
      }
    });
  }

  selectAddress(address: Address) {
    this.selectedAddressId.set(address.id ?? null);
    this.form.patchValue({
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      address: address.line1,
      address2: address.line2 ?? '',
      city: address.city,
      postalCode: address.postalCode,
      instructions: address.instructions ?? ''
    });
  }

  clearAddressSelection() { this.selectedAddressId.set(null); }

  useAnotherAddress() {
    this.selectedAddressId.set(null);
    this.form.patchValue({ address: '', address2: '', city: '', postalCode: '', instructions: '' });
  }

  promoChanged() {
    const currentCode = (this.form.controls.promoCode.value ?? '').trim().toUpperCase();
    if (currentCode !== this.appliedPromotion()?.code) this.appliedPromotion.set(null);
    this.promoError.set('');
  }

  async applyPromotion() {
    const code = (this.form.controls.promoCode.value ?? '').trim().toUpperCase();
    if (!code) return;
    this.promoValidating.set(true);
    this.promoError.set('');
    try {
      const promotion = await this.orders.validatePromotion(code, this.cart.subtotal());
      this.form.controls.promoCode.setValue(promotion.code);
      this.appliedPromotion.set(promotion);
      this.promoOpen.set(false);
    } catch (error: any) {
      this.appliedPromotion.set(null);
      const message = String(error?.message ?? '').trim();
      this.promoError.set(!message || message.toLowerCase() === 'internal' || message.toLowerCase().includes('internal error') ? 'Impossible de vérifier ce code pour le moment.' : message);
    } finally {
      this.promoValidating.set(false);
    }
  }

  removePromotion() {
    this.form.controls.promoCode.setValue('');
    this.appliedPromotion.set(null);
    this.promoError.set('');
    this.promoOpen.set(true);
  }

  async resendVerification() {
    this.verificationBusy.set(true);
    this.verificationMessage.set('');
    try {
      await this.auth.sendVerificationEmail();
      this.verificationMessage.set('Un nouveau lien vient d’être envoyé.');
    } catch {
      this.verificationMessage.set('Impossible de renvoyer le lien maintenant. Réessaie dans quelques minutes.');
    } finally {
      this.verificationBusy.set(false);
    }
  }

  async refreshEmailVerification() {
    this.verificationBusy.set(true);
    this.verificationMessage.set('');
    try {
      const verified = await this.auth.refreshEmailVerification();
      if (!verified) this.verificationMessage.set('L’adresse n’est pas encore vérifiée. Clique sur le lien reçu par email.');
    } catch {
      this.verificationMessage.set('Impossible de vérifier le statut pour le moment.');
    } finally {
      this.verificationBusy.set(false);
    }
  }

  async confirm() {
    if (this.form.invalid || !this.cart.items().length || this.auth.emailVerificationRequired()) return;
    this.saving.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const items = this.cart.items();
    try {
      const order = await this.orders.create({
        customer: { firstName: value.firstName ?? '', lastName: value.lastName ?? '', phone: value.phone ?? '', email: value.email ?? '' },
        address: { line1: value.address ?? '', line2: value.address2 ?? '', city: value.city ?? '', postalCode: value.postalCode ?? '', instructions: value.instructions ?? '' },
        items,
        promoCode: this.appliedPromotion()?.code
      });
      this.confirmedFirstName.set((value.firstName ?? '').trim());
      this.confirmedOrderNumber.set(order.orderNumber);
      this.cart.clear();
      this.done.set(true);
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      this.error.set(error?.message ?? 'Impossible d’enregistrer la commande. Réessaie dans un instant.');
    } finally {
      this.saving.set(false);
    }
  }
}
