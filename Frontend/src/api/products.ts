import { apiClient } from "./client";
import type { ApiResponse, BackendList } from "@/types/common";
import type {
  Product,
  ProductQueryParams,
  CreateProductPayload,
  UpdateProductPayload,
  UpdateInventoryPayload,
  ProductImage,
  ProductPrice,
  Category,
} from "@/types/product";

export const productsService = {
  getProducts: async (params: ProductQueryParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.sort) query.set("sort", params.sort);
    if (params.search) query.set("search", params.search);
    if (params.storeId) query.set("storeId", params.storeId);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.minPrice !== undefined)
      query.set("minPrice", String(params.minPrice));
    if (params.maxPrice !== undefined)
      query.set("maxPrice", String(params.maxPrice));
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<
      ApiResponse<BackendList<"products", Product>>
    >(`/products${qs}`);
    return res.data;
  },

  getProductById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data;
  },

  // Seller endpoints — backend route: GET /products/my-products
  getMyProducts: async (
    params: {
      storeId?: string;
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.storeId) query.set("storeId", params.storeId);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<
      ApiResponse<BackendList<"products", Product>>
    >(`/products/my-products${qs}`);
    return res.data;
  },

  getMyProductById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Product>>(
      `/products/my-products/${id}`,
    );
    return res.data;
  },

  createProduct: async (payload: CreateProductPayload) => {
    const res = await apiClient.post<ApiResponse<Product>>(
      "/products",
      payload,
    );
    return res.data;
  },

  updateProduct: async (id: string, payload: UpdateProductPayload) => {
    const res = await apiClient.patch<ApiResponse<Product>>(
      `/products/my-products/${id}`,
      payload,
    );
    return res.data;
  },

  deleteProduct: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<null>>(
      `/products/my-products/${id}`,
    );
    return res.data;
  },

  publishProduct: async (id: string) => {
    const res = await apiClient.post<ApiResponse<Product>>(
      `/products/my-products/${id}/publish`,
    );
    return res.data;
  },

  archiveProduct: async (id: string) => {
    const res = await apiClient.post<ApiResponse<Product>>(
      `/products/my-products/${id}/archive`,
    );
    return res.data;
  },

  addImages: async (
    id: string,
    images: { url: string; altText?: string }[],
  ) => {
    const res = await apiClient.post<ApiResponse<ProductImage[]>>(
      `/products/my-products/${id}/images`,
      { images },
    );
    return res.data;
  },

  removeImage: async (productId: string, imageId: string) => {
    const res = await apiClient.delete<ApiResponse<null>>(
      `/products/my-products/${productId}/images/${imageId}`,
    );
    return res.data;
  },

  updateInventory: async (id: string, payload: UpdateInventoryPayload) => {
    const res = await apiClient.patch<ApiResponse<unknown>>(
      `/products/my-products/${id}/inventory`,
      payload,
    );
    return res.data;
  },

  getPriceHistory: async (id: string) => {
    const res = await apiClient.get<ApiResponse<ProductPrice[]>>(
      `/products/my-products/${id}/price-history`,
    );
    return res.data;
  },

  getLowStock: async () => {
    const res = await apiClient.get<ApiResponse<Product[]>>(
      "/products/low-stock",
    );
    return res.data;
  },

  getCategories: async () => {
    const res = await apiClient.get<
      ApiResponse<{ categories: Category[]; flat: Category[] }>
    >("/products/categories");
    return res.data;
  },
};
