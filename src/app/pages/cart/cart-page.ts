import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../data/products';
import { CartStore } from '../../services/cart-store';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
  templateUrl: './cart-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  protected readonly cart = inject(CartStore);
  protected readonly formattedTotal = computed(() => this.cart.total().toFixed(2));

  protected increment(productId: Product['id']): void {
    this.cart.increment(productId);
  }

  protected decrement(productId: Product['id']): void {
    this.cart.decrement(productId);
  }

  protected remove(productId: Product['id']): void {
    this.cart.remove(productId);
  }
}
