import type { Category } from './Category';

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  categories: Category[];
  image: string;
  sellingPrice: number;
  category?: string;
  status: 'published' | 'draft' | 'unpublished';
}
