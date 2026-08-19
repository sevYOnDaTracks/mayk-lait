import { Injectable, signal } from '@angular/core';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';

export type PromotionType = 'percentage' | 'fixed';

export interface Promotion {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
  minimumAmount: number;
  active: boolean;
  startsAt?: Timestamp | null;
  endsAt?: Timestamp | null;
  maxUses?: number | null;
  usedCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PromotionInput {
  code: string;
  type: PromotionType;
  value: number;
  minimumAmount: number;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  maxUses: number | null;
}

@Injectable({ providedIn: 'root' })
export class PromotionAdminService {
  readonly promotions = signal<Promotion[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    onSnapshot(
      query(collection(firestore, 'promotions'), orderBy('createdAt', 'desc')),
      snapshot => {
        this.promotions.set(snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as Promotion));
        this.loading.set(false);
        this.error.set(null);
      },
      error => {
        console.error(error);
        this.loading.set(false);
        this.error.set('Impossible de charger les codes promo. Déploie les règles Firestore mises à jour.');
      }
    );
  }

  async create(input: PromotionInput) {
    const code = this.normalizeCode(input.code);
    const reference = doc(firestore, 'promotions', code);
    if ((await getDoc(reference)).exists()) throw new Error('Ce code promo existe déjà.');
    return setDoc(reference, {
      ...input,
      code,
      startsAt: input.startsAt ? Timestamp.fromDate(input.startsAt) : null,
      endsAt: input.endsAt ? Timestamp.fromDate(input.endsAt) : null,
      usedCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  update(id: string, input: PromotionInput) {
    return updateDoc(doc(firestore, 'promotions', id), {
      type: input.type,
      value: input.value,
      minimumAmount: input.minimumAmount,
      active: input.active,
      startsAt: input.startsAt ? Timestamp.fromDate(input.startsAt) : null,
      endsAt: input.endsAt ? Timestamp.fromDate(input.endsAt) : null,
      maxUses: input.maxUses,
      updatedAt: serverTimestamp()
    });
  }

  remove(id: string) {
    return deleteDoc(doc(firestore, 'promotions', id));
  }

  private normalizeCode(code: string) {
    const normalized = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9_-]{3,30}$/.test(normalized)) throw new Error('Utilise 3 à 30 lettres, chiffres, tirets ou underscores.');
    return normalized;
  }
}
