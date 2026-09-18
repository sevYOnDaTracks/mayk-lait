import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { Product } from '../../data/products';
import { CartStore } from '../../services/cart-store';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'product-card' },
})
export class ProductCard {
  readonly product = input.required<Product>();
  readonly compact = input(false);

  private readonly cart = inject(CartStore);

  protected addToCart(): void {
    this.cart.add(this.product());
  }
}
