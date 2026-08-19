import { Injectable, signal } from '@angular/core';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firebaseFunctions, firestore } from './firebase';
import { OrderStatus } from './models';

export interface AdminOrderItem {
  id?: string;
  productId?: string;
  name?: string;
  slug?: string;
  image?: string;
  volume?: string;
  basePrice?: number;
  quantity?: number;
  unitPrice?: number;
  selections?: Array<{ groupId?: string; groupName?: string; options?: Array<{ id?: string; name?: string; priceModifier?: number }> }>;
}
export interface AdminOrder {
  id: string;
  orderNumber?: string;
  userId?: string;
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  address?: { line1?: string; line2?: string; city?: string; postalCode?: string; instructions?: string };
  items?: AdminOrderItem[];
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
  promotion?: { code?: string; type?: string; value?: number; discount?: number } | null;
  deliveryMode?: string;
  status?: OrderStatus;
  createdAt?: { toDate(): Date };
  updatedAt?: { toDate(): Date };
}

@Injectable({providedIn:'root'})
export class OrderAdminService {
  readonly orders=signal<AdminOrder[]>([]); readonly loading=signal(true); readonly error=signal<string|null>(null);
  constructor(){onSnapshot(query(collection(firestore,'orders'),orderBy('createdAt','desc')),snapshot=>{this.orders.set(snapshot.docs.map(item=>({id:item.id,...item.data()}) as AdminOrder));this.loading.set(false);this.error.set(null)},error=>{console.error(error);this.loading.set(false);this.error.set('Impossible de charger les commandes.')})}
  updateStatus(id:string,status:OrderStatus){return updateDoc(doc(firestore,'orders',id),{status,updatedAt:new Date()})}
  async updateItemQuantity(orderId:string,itemIndex:number,quantity:number){const callable=httpsCallable<{orderId:string;itemIndex:number;quantity:number},unknown>(firebaseFunctions,'updateOrderItemQuantity');return(await callable({orderId,itemIndex,quantity})).data}
}
