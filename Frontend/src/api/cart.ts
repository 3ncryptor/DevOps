import { apiClient } from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  Cart,
  CartCount,
  CartByStore,
  CartValidation,
} from "@/types/cart";

export const cartService = {
  getCart: async () => {
    const res = await apiClient.get<ApiResponse<Cart>>("/cart");
    return res.data;
  },

  getCount: async () => {
    const res = await apiClient.get<ApiResponse<CartCount>>("/cart/count");
    return res.data;
  },

  getByStore: async () => {
    const res = await apiClient.get<ApiResponse<CartByStore>>("/cart/by-store");
    return res.data;
  },

  validate: async () => {
    const res =
      await apiClient.post<ApiResponse<CartValidation>>("/cart/validate");
    return res.data;
  },

  addItem: async (productId: string, quantity = 1) => {
    const res = await apiClient.post<ApiResponse<Cart>>("/cart/items", {
      productId,
      quantity,
    });
    return res.data;
  },

  updateItem: async (productId: string, quantity: number) => {
    const res = await apiClient.patch<ApiResponse<Cart>>(
      `/cart/items/${productId}`,
      { quantity },
    );
    return res.data;
  },

  removeItem: async (productId: string) => {
    const res = await apiClient.delete<ApiResponse<Cart>>(
      `/cart/items/${productId}`,
    );
    return res.data;
  },

  clearCart: async () => {
    const res = await apiClient.delete<ApiResponse<Cart>>("/cart");
    return res.data;
  },
};
