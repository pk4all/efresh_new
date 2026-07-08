export type Category =
  | "Vegetables & Fruit"
  | "Beverages"
  | "Dairy & Breakfast"
  | "Biscuits & Snacks"
  | "Frozen Foods"
  | "Grocery & Staples";

export type Badge = "Sale" | "New" | "Organic" | "Hot" | null;

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: Category;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviewCount: number;
  badge: Badge;
  stock: number;
  description: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
}

export interface GetCategoriesParams {
  limit?: number;
  offset?: number;
  vendor_id?: string;
}

export interface GetSubCategoriesParams {
  limit?: number;
  offset?: number;
  vendor_id?: string;
  category_id?: string;
}

