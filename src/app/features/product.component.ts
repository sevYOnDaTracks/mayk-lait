import { Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from '../core/catalog.service';
import { CartService } from '../core/cart.service';
import { ProductOption } from '../core/models';
@Component({
  selector: 'app-product',
  imports: [CurrencyPipe, RouterLink],
  template: ` @if (catalog.loading()) {
      <section class="empty-state page"><p>Chargement du produit…</p></section>
    } @else if (product(); as product) {
      <section class="product-detail">
        <div class="product-photo">
          <img
            [src]="product.images[0] || '/images/mayklait/degue-hero.svg'"
            [alt]="product.name"
          /><a routerLink="/" class="back-link">← Retour</a>
        </div>
        <div class="configurator">
          <p class="eyebrow">PRÉPARÉ À LA COMMANDE</p>
          <h1>{{ product.name }}</h1>
          <p class="product-description">{{ product.description }}</p>
          <div class="meta-row">
            <span class="delivery-meta">{{
              product.available ? 'Livraison prévue pour le week-end prochain' : 'Indisponible'
            }}</span>
            @if (product.volume) {
              <span class="volume-meta">{{ product.volume }}</span>
            }
            <span class="price-meta">{{
              product.price | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr'
            }}</span>
          </div>
          @for (group of product.optionGroups; track group.id) {
            <fieldset class="option-group">
              <legend>
                {{ group.name }}
                @if (group.required) {
                  <small>Requis</small>
                }
              </legend>
              <div class="option-list">
                @for (option of group.options; track option.id) {
                  <button
                    type="button"
                    class="option"
                    [class.selected]="isSelected(group.id, option.id)"
                    [disabled]="!option.available"
                    (click)="select(group.id, group.multiple, option)"
                  >
                    <span>{{ option.name }}</span
                    ><span>{{
                      option.priceModifier
                        ? '+' + (option.priceModifier | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr')
                        : 'Inclus'
                    }}</span>
                  </button>
                }
              </div>
            </fieldset>
          }
          <details class="ingredients">
            <summary>Allergènes et ingrédients <span>+</span></summary>
            <div>
              <p><strong>Allergènes</strong></p>
              <div class="badges">
                @for (allergen of product.allergens; track allergen) {
                  <span>{{ allergen }}</span>
                }
              </div>
              <p><strong>Ingrédients</strong><br />{{ product.ingredients.join(', ') }}.</p>
            </div>
          </details>
          <div class="add-bar">
            <div>
              <small>Total</small
              ><strong>{{ total() | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr' }}</strong>
            </div>
            <button class="button" [disabled]="!valid() || !product.available" (click)="add()">
              Ajouter <span>• {{ total() | currency: 'EUR' : 'symbol' : '1.2-2' : 'fr' }}</span>
            </button>
          </div>
        </div>
      </section>
    } @else {
      <section class="empty-state page">
        <h1>Produit introuvable.</h1>
        <a routerLink="/commander" class="button">Voir la carte</a>
      </section>
    }`,
})
export class ProductComponent {
  private route = inject(ActivatedRoute);
  readonly catalog = inject(CatalogService);
  private cart = inject(CartService);
  readonly product = computed(() => this.catalog.bySlug(this.route.snapshot.paramMap.get('slug')));
  readonly selected = signal<Record<string, ProductOption[]>>({});
  readonly total = computed(
    () =>
      (this.product()?.price ?? 0) +
      Object.values(this.selected())
        .flat()
        .reduce((sum, o) => sum + o.priceModifier, 0),
  );
  constructor() {
    effect(() => {
      const product = this.product();
      if (!product) return;
      const defaults: Record<string, ProductOption[]> = {};
      product.optionGroups
        .filter((g) => g.required)
        .forEach((g) => {
          const first = g.options.find((o) => o.available);
          if (first) defaults[g.id] = [first];
        });
      this.selected.set(defaults);
    });
  }
  isSelected(g: string, o: string) {
    return this.selected()[g]?.some((x) => x.id === o);
  }
  select(g: string, multiple: boolean, o: ProductOption) {
    this.selected.update((all) => ({
      ...all,
      [g]: multiple
        ? all[g]?.some((x) => x.id === o.id)
          ? all[g].filter((x) => x.id !== o.id)
          : [...(all[g] ?? []), o]
        : [o],
    }));
  }
  valid() {
    return (
      this.product()
        ?.optionGroups.filter((g) => g.required)
        .every((g) => this.selected()[g.id]?.length) ?? false
    );
  }
  add() {
    const p = this.product();
    if (!p || !this.valid()) return;
    this.cart.add({
      id: crypto.randomUUID(),
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images[0] || '/images/mayklait/degue-hero.svg',
      volume: p.optionGroups.some(
        (group) => group.id === 'volume' || group.name.trim().toLocaleLowerCase('fr') === 'volume',
      )
        ? undefined
        : p.volume,
      basePrice: p.price,
      quantity: 1,
      unitPrice: this.total(),
      selections: p.optionGroups
        .filter((g) => this.selected()[g.id]?.length)
        .map((g) => ({ groupId: g.id, groupName: g.name, options: this.selected()[g.id] })),
    });
  }
}
