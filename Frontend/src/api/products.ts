import { apiClient } from './client';
import { ApiResponse } from './auth';

export interface Product {
  _id: string;
  storeId: {
    _id: string;
    identity: {
      storeName: string;
    };
  } | string;
  categoryId: string;
  identity: {
    productName: string;
    brand: string;
    description: string;
  };
  attributes: {
    images: {
      url: string;
      alt: string;
      isPrimary: boolean;
      _id: string;
    }[];
  };
  pricing: Array<{
    price: number;
    currency: string;
  }>;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

interface ProductQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  store?: string;
}

export const productsService = {
  getProducts: async (params: ProductQueryParams = {}) => {
    // Append query params
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.sort) query.append('sort', params.sort);
    if (params.search) query.append('search', params.search);
    if (params.store) query.append('store', params.store);

    const queryString = query.toString() ? `?${query.toString()}` : '';

    const response = await apiClient.get<ApiResponse<{products: Product[], totalPages: number, currentPage: number}>>(`/products${queryString}`);
    return response.data;
  },
};
