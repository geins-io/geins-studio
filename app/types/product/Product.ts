import type { Category } from './Category';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  categories: Category[];
  image: string;
}
