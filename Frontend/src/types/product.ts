import type { ProductStatus } from "./common";

export interface ProductImage {
  _id: string;
  productId: string;
  url: string;
  altText?: string;
  sortOrder?: number;
}

export interface ProductPrice {
  _id: string;
  productId: string;
  price: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Inventory {
  _id: string;
  productId: string;
  storeId: string;
  availableStock: number;
  reservedStock: number;
  reorderThreshold?: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parentCategoryId?: string | null;
  isActive: boolean;
  sortOrder?: number;
}

export interface PopulatedStore {
  _id: string;
  storeIdentity: { name: string; slug: string };
}

export interface Product {
  _id: string;
  storeId: PopulatedStore | string;
  categoryId: Category | string;
  identity: {
    title: string;
    subtitle?: string;
    description?: string;
  };
  attributes?: {
    brand?: string;
    sku?: string;
    weight?: string;
    dimensions?: string;
  };
  status: ProductStatus;
  images?: ProductImage[];
  pricing?: ProductPrice[];
  currentPrice?: ProductPrice;
  inventory?: Inventory;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  storeId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateProductPayload {
  storeId: string;
  categoryId: string;
  identity: { title: string; subtitle?: string; description?: string };
  attributes?: { brand?: string; sku?: string };
  price: number;
  currency?: string;
  initialStock?: number;
}

export interface UpdateProductPayload {
  identity?: { title?: string; subtitle?: string; description?: string };
  attributes?: { brand?: string; sku?: string };
  categoryId?: string;
  price?: number;
}

export interface UpdateInventoryPayload {
  availableStock?: number;
  reorderThreshold?: number;
}
