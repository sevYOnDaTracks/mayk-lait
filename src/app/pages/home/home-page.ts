import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProductCard } from '../../components/product-card/product-card';
import { PRODUCTS } from '../../data/products';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProductCard],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly products = PRODUCTS;
}
