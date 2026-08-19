import { Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Product } from './models';
import { firestore } from './firebase';
export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
@Injectable({ providedIn: 'root' })
export class CatalogService {
  readonly products = signal<Product[]>([]); readonly loading = signal(true); readonly error = signal<string | null>(null);
  constructor() { onSnapshot(query(collection(firestore, 'products'), orderBy('name')), snapshot => { this.products.set(snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as Product)); this.loading.set(false); this.error.set(null); }, error => { console.error(error); this.loading.set(false); this.error.set('Impossible de charger les produits pour le moment.'); }); }
  bySlug(slug: string | null) { return this.products().find(product => product.slug === slug); }
  create(product: ProductInput) { return addDoc(collection(firestore, 'products'), { ...product, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
  update(id: string, product: ProductInput) { return updateDoc(doc(firestore, 'products', id), { ...product, updatedAt: serverTimestamp() }); }
  remove(id: string) { return deleteDoc(doc(firestore, 'products', id)); }
}
