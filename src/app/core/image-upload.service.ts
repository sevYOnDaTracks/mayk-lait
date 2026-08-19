import { Injectable } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { firebaseAuth, firebaseStorage } from './firebase';

@Injectable({providedIn:'root'})
export class ImageUploadService {
  readonly allowedTypes=['image/jpeg','image/png','image/webp']; readonly maxSize=8*1024*1024;
  validate(file:File){if(!this.allowedTypes.includes(file.type))throw new Error('FORMAT');if(file.size>this.maxSize)throw new Error('SIZE')}
  async uploadProduct(file:File,slug:string,onProgress:(progress:number)=>void):Promise<string>{this.validate(file);const user=firebaseAuth.currentUser;if(!user)throw new FirebaseError('storage/unauthorized','Aucune session Firebase active.');await user.getIdToken(true);const safeName=file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');const path=`products/${slug||'sans-slug'}/${crypto.randomUUID()}-${safeName}`;const task=uploadBytesResumable(ref(firebaseStorage,path),file,{contentType:file.type});return new Promise((resolve,reject)=>task.on('state_changed',snapshot=>onProgress(Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100)),reject,async()=>resolve(await getDownloadURL(task.snapshot.ref))))}
  async uploadProfile(file:File,onProgress:(progress:number)=>void):Promise<{url:string;path:string}>{
    this.validate(file);
    if(file.size>5*1024*1024)throw new Error('SIZE');
    const user=firebaseAuth.currentUser;
    if(!user)throw new FirebaseError('storage/unauthorized','Aucune session Firebase active.');
    await user.getIdToken(true);
    const extension=file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
    const path=`users/${user.uid}/profile/${crypto.randomUUID()}.${extension}`;
    const task=uploadBytesResumable(ref(firebaseStorage,path),file,{contentType:file.type});
    return new Promise((resolve,reject)=>task.on('state_changed',snapshot=>onProgress(Math.round(snapshot.bytesTransferred/snapshot.totalBytes*100)),reject,async()=>resolve({url:await getDownloadURL(task.snapshot.ref),path})));
  }
  removePath(path:string){return deleteObject(ref(firebaseStorage,path))}
  remove(url:string){return deleteObject(ref(firebaseStorage,url))}
}
