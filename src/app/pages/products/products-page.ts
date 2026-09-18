import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductCard } from '../../components/product-card/product-card';
import { PRODUCTS } from '../../data/products';

@Component({
  selector: 'app-products-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './products-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  protected readonly products = PRODUCTS;
}
