import { Injectable, computed, signal } from '@angular/core';
import { CartItem } from './models';
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly key = 'mayklait_cart_v1'; readonly items = signal<CartItem[]>(this.restore()); readonly open = signal(false);
  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  add(item: CartItem) { this.items.update(items => [...items, item]); this.persist(); this.open.set(true); }
  remove(id: string) { this.items.update(items => items.filter(item => item.id !== id)); this.persist(); }
  changeQuantity(id: string, delta: number) { this.items.update(items => items.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)); this.persist(); }
  clear() { this.items.set([]); this.persist(); }
  private persist() { localStorage.setItem(this.key, JSON.stringify(this.items())); }
  private restore(): CartItem[] { try { return JSON.parse(localStorage.getItem(this.key) ?? '[]'); } catch { return []; } }
}
