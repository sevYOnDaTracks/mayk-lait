import { computed, Injectable, signal } from '@angular/core';

import { Product, PRODUCTS } from '../data/products';

export interface CartLine {
  readonly product: Product;
  readonly quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cartLines = signal<readonly CartLine[]>([{ product: PRODUCTS[1], quantity: 1 }]);

  readonly lines = this.cartLines.asReadonly();
  readonly count = computed(() =>
    this.cartLines().reduce((total, line) => total + line.quantity, 0),
  );
  readonly total = computed(() =>
    this.cartLines().reduce((total, line) => total + line.product.price * line.quantity, 0),
  );

  add(product: Product): void {
    this.cartLines.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);

      if (!existing) {
        return [...lines, { product, quantity: 1 }];
      }

      return lines.map((line) =>
        line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
      );
    });
  }

  increment(productId: Product['id']): void {
    this.cartLines.update((lines) =>
      lines.map((line) =>
        line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    );
  }

  decrement(productId: Product['id']): void {
    this.cartLines.update((lines) =>
      lines
        .map((line) =>
          line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  remove(productId: Product['id']): void {
    this.cartLines.update((lines) => lines.filter((line) => line.product.id !== productId));
  }
}
