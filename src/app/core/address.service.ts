import { effect, inject, Injectable, signal } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Address } from './models';
import { AuthService } from './auth.service';
import { firestore } from './firebase';

export type AddressInput = Omit<Address, 'id'>;

@Injectable({ providedIn: 'root' })
export class AddressService {
  private auth = inject(AuthService);
  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    effect(onCleanup => {
      const user = this.auth.user();
      if (!user) { this.addresses.set([]); this.loading.set(false); return; }
      this.loading.set(true);
      const unsubscribe = onSnapshot(query(collection(firestore, 'addresses'), where('userId', '==', user.uid)), snapshot => {
        this.addresses.set(snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as Address));
        this.loading.set(false); this.error.set(null);
      }, error => { console.error(error); this.loading.set(false); this.error.set('Impossible de charger tes adresses.'); });
      onCleanup(unsubscribe);
    });
  }

  async create(address: AddressInput) { const user=this.auth.user(); if(!user)throw new Error('Unauthenticated'); const first=this.addresses().length===0; return addDoc(collection(firestore,'addresses'),{...address,userId:user.uid,primary:first||address.primary===true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}); }
  async update(id:string,address:AddressInput){await updateDoc(doc(firestore,'addresses',id),{...address,updatedAt:serverTimestamp()});}
  async remove(id:string){await deleteDoc(doc(firestore,'addresses',id));}
  async setPrimary(id:string){const batch=writeBatch(firestore);for(const address of this.addresses()){if(address.id)batch.update(doc(firestore,'addresses',address.id),{primary:address.id===id,updatedAt:serverTimestamp()});}await batch.commit();}
}
