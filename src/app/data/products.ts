export interface Product {
  readonly id: 'nature' | 'degue';
  readonly eyebrow: string;
  readonly name: string;
  readonly price: number;
  readonly description: string;
}

export const PRODUCTS: readonly Product[] = [
  {
    id: 'nature',
    eyebrow: 'SIGNATURE',
    name: 'Yaourt Nature',
    price: 7,
    description: 'Yaourt Danone, lait Nido, lait concentré sucré, sucre vanillé, noix de muscade.',
  },
  {
    id: 'degue',
    eyebrow: 'SPÉCIALITÉ',
    name: 'Dègue',
    price: 8,
    description: 'Notre base de yaourt nature enrichie de grain de mil.',
  },
];
