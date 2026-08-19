import { Injectable, signal } from '@angular/core';
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, sendEmailVerification, signOut } from 'firebase/auth';
import { deleteApp, initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';
import { firestore } from './firebase';
import { AppUser } from './models';

export interface CreateCustomerInput { firstName:string; lastName:string; email:string; phone:string; password:string; birthDate?:string; }
export type UpdateCustomerInput = Pick<AppUser,'firstName'|'lastName'|'phone'|'birthDate'|'allergies'|'intolerances'|'role'>;

@Injectable({providedIn:'root'})
export class CustomerAdminService {
  readonly customers=signal<AppUser[]>([]); readonly loading=signal(true); readonly error=signal<string|null>(null);
  constructor(){onSnapshot(collection(firestore,'users'),snapshot=>{this.customers.set(snapshot.docs.map(item=>({uid:item.id,...item.data()}) as AppUser).sort((a,b)=>(a.lastName||'').localeCompare(b.lastName||'')));this.loading.set(false);this.error.set(null)},error=>{console.error(error);this.loading.set(false);this.error.set('Impossible de charger les clients.')})}
  async create(input:CreateCustomerInput){const secondary=initializeApp(environment.firebase,`create-user-${Date.now()}`);const secondaryAuth=getAuth(secondary);try{const credential=await createUserWithEmailAndPassword(secondaryAuth,input.email,input.password);const profile:AppUser={uid:credential.user.uid,firstName:input.firstName,lastName:input.lastName,email:input.email,phone:input.phone,birthDate:input.birthDate,role:'customer',onboardingComplete:false,disabled:false};await setDoc(doc(firestore,'users',credential.user.uid),{...profile,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});await sendEmailVerification(credential.user,{url:`${window.location.origin}/connexion?emailVerifie=1`});await signOut(secondaryAuth);return credential.user.uid}finally{await deleteApp(secondary)}}
  update(uid:string,input:UpdateCustomerInput){return updateDoc(doc(firestore,'users',uid),{...input,updatedAt:serverTimestamp()})}
  setDisabled(uid:string,disabled:boolean){return updateDoc(doc(firestore,'users',uid),{disabled,updatedAt:serverTimestamp()})}
}
