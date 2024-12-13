export interface Category {
  id: number;
  name: string;
  market?: string;
}

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
