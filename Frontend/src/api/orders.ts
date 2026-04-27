import { apiClient } from "./client";
import type { ApiResponse, BackendList } from "@/types/common";
import type {
  Order,
  CreateOrderPayload,
  ShipOrderPayload,
} from "@/types/order";

export const ordersService = {
  createOrder: async (payload: CreateOrderPayload) => {
    const res = await apiClient.post<ApiResponse<Order[]>>("/orders", payload);
    return res.data;
  },

  getMyOrders: async (
    params: { page?: number; limit?: number; status?: string } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<ApiResponse<BackendList<"orders", Order>>>(
      `/orders/my-orders${qs}`,
    );
    return res.data;
  },

  getOrderById: async (orderId: string) => {
    const res = await apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return res.data;
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    const res = await apiClient.post<ApiResponse<Order>>(
      `/orders/${orderId}/cancel`,
      { reason },
    );
    return res.data;
  },

  // Seller operations
  getStoreOrders: async (
    storeId: string,
    params: { page?: number; limit?: number; status?: string } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<ApiResponse<BackendList<"orders", Order>>>(
      `/orders/store/${storeId}${qs}`,
    );
    return res.data;
  },

  processOrder: async (orderId: string) => {
    const res = await apiClient.post<ApiResponse<Order>>(
      `/orders/${orderId}/process`,
    );
    return res.data;
  },

  shipOrder: async (orderId: string, payload: ShipOrderPayload) => {
    const res = await apiClient.post<ApiResponse<Order>>(
      `/orders/${orderId}/ship`,
      payload,
    );
    return res.data;
  },

  deliverOrder: async (orderId: string) => {
    const res = await apiClient.post<ApiResponse<Order>>(
      `/orders/${orderId}/deliver`,
    );
    return res.data;
  },
};
