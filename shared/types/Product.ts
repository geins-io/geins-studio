export interface Category {
  id: number;
  name: string;
  market?: string;
}

export interface Brand {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  categories: Category[];
  brand: Brand;
  image: string;
  sellingPrice: number;
  category?: string;
  status: 'published' | 'draft' | 'unpublished';
  stockStatus: StockStatus;
}

export type StockStatus = 'in-stock' | 'out-of-stock';
