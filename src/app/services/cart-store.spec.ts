import { TestBed } from '@angular/core/testing';

import { PRODUCTS } from '../data/products';
import { CartStore } from './cart-store';

describe('CartStore', () => {
  let store: CartStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CartStore);
  });

  it('starts with the demo Dègue product', () => {
    expect(store.count()).toBe(1);
    expect(store.total()).toBe(8);
  });

  it('adds products and computes the total', () => {
    store.add(PRODUCTS[0]);
    store.add(PRODUCTS[1]);

    expect(store.count()).toBe(3);
    expect(store.total()).toBe(23);
  });

  it('updates quantities and removes products', () => {
    store.increment('degue');
    expect(store.count()).toBe(2);

    store.decrement('degue');
    expect(store.count()).toBe(1);

    store.remove('degue');
    expect(store.lines()).toEqual([]);
    expect(store.total()).toBe(0);
  });
});
