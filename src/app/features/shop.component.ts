import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../core/catalog.service';

@Component({selector:'app-shop',imports:[CurrencyPipe,RouterLink],template:`
<section class="shop-page"><header class="shop-heading"><p class="eyebrow">LA BOUTIQUE</p><h1>Choisis.<br>Compose. Savoure.</h1><p>Tous les produits disponibles, préparés avec soin.</p></header>
@if(catalog.loading()){<div class="empty-state shop-state"><p>La boutique se prépare…</p></div>}@else if(catalog.error()){<div class="empty-state shop-state"><h2>Petit souci en cuisine.</h2><p>{{catalog.error()}}</p></div>}@else{<div class="shop-grid">@for(product of catalog.products();track product.id){@if(product.available){<article class="shop-product"><a [routerLink]="['/produit',product.slug]" class="product-visual"><img [src]="product.images[0]||'/images/mayklait/degue-hero.svg'" [alt]="product.name" loading="lazy"></a><div class="shop-product-copy"><div><h2>{{product.name}}</h2><p>{{product.description}}</p></div><div class="shop-product-action"><strong>{{product.price|currency:'EUR':'symbol':'1.2-2':'fr'}}</strong><a [routerLink]="['/produit',product.slug]" class="button">Choisir</a></div></div></article>}}@empty{<div class="empty-state shop-state"><h2>La boutique se prépare.</h2><p>Aucun produit n’est disponible pour le moment.</p></div>}</div>}</section>`})
export class ShopComponent{readonly catalog=inject(CatalogService)}
