import { effect, inject, Injectable, signal } from '@angular/core';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { AuthService } from './auth.service';
import { CartItem } from './models';
import { firebaseFunctions, firestore } from './firebase';
import { AdminOrder } from './order-admin.service';

export interface CheckoutOrderInput {
  customer: { firstName: string; lastName: string; phone: string; email: string };
  address: { line1: string; line2: string; city: string; postalCode: string; instructions: string };
  items: CartItem[];
  promoCode?: string;
}

export interface PromotionValidation {
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface CreatedOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private auth = inject(AuthService);
  readonly orders = signal<AdminOrder[]>([]);
  readonly loading = signal(true);

  constructor() {
    effect(onCleanup => {
      const user = this.auth.user();
      if (!user) {
        this.orders.set([]);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      const unsubscribe = onSnapshot(
        query(collection(firestore, 'orders'), where('userId', '==', user.uid)),
        snapshot => {
          this.orders.set(snapshot.docs
            .map(item => ({ id: item.id, ...item.data() }) as AdminOrder)
            .sort((a, b) => (b.createdAt?.toDate().getTime() ?? 0) - (a.createdAt?.toDate().getTime() ?? 0)));
          this.loading.set(false);
        }
      );
      onCleanup(unsubscribe);
    });
  }

  async validatePromotion(code: string, subtotal: number) {
    const callable = httpsCallable<{ code: string; subtotal: number }, PromotionValidation>(firebaseFunctions, 'validatePromotion');
    return (await callable({ code, subtotal })).data;
  }

  async create(input: CheckoutOrderInput) {
    if (!this.auth.user()) throw new Error('Tu dois être connecté pour commander.');
    const callable = httpsCallable<CheckoutOrderInput, CreatedOrder>(firebaseFunctions, 'createOrder');
    return (await callable(input)).data;
  }
}
