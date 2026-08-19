import { Injectable, signal } from '@angular/core';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';

export const DEFAULT_DELIVERY_FEE = 2.9;

@Injectable({ providedIn: 'root' })
export class CheckoutSettingsService {
  readonly deliveryFee = signal(DEFAULT_DELIVERY_FEE);
  readonly loading = signal(true);
  readonly error = signal('');

  private readonly settingsRef = doc(firestore, 'settings', 'checkout');

  constructor() {
    onSnapshot(this.settingsRef, snapshot => {
      const value = Number(snapshot.data()?.['deliveryFee'] ?? DEFAULT_DELIVERY_FEE);
      this.deliveryFee.set(Number.isFinite(value) && value >= 0 ? value : DEFAULT_DELIVERY_FEE);
      this.error.set('');
      this.loading.set(false);
    }, () => {
      this.error.set('Impossible de charger les paramètres de livraison.');
      this.loading.set(false);
    });
  }

  async updateDeliveryFee(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error('INVALID_DELIVERY_FEE');
    }
    const deliveryFee = Math.round(value * 100) / 100;
    await setDoc(this.settingsRef, { deliveryFee, updatedAt: serverTimestamp() }, { merge: true });
  }
}
