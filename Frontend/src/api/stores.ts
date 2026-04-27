import { apiClient } from "./client";
import type { ApiResponse, Paginated } from "@/types/common";
import type {
  Store,
  CreateStorePayload,
  UpdateStorePayload,
} from "@/types/seller";

export const storesService = {
  listStores: async (
    params: {
      search?: string;
      city?: string;
      page?: number;
      limit?: number;
    } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.city) query.set("city", params.city);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<ApiResponse<Paginated<Store>>>(
      `/stores${qs}`,
    );
    return res.data;
  },

  getStoreById: async (storeId: string) => {
    const res = await apiClient.get<ApiResponse<Store>>(
      `/stores/id/${storeId}`,
    );
    return res.data;
  },

  // Seller endpoints
  getMyStores: async () => {
    const res = await apiClient.get<ApiResponse<Store[]>>("/stores/my-stores");
    return res.data;
  },

  createStore: async (payload: CreateStorePayload) => {
    const res = await apiClient.post<ApiResponse<Store>>("/stores", payload);
    return res.data;
  },

  updateStore: async (storeId: string, payload: UpdateStorePayload) => {
    const res = await apiClient.patch<ApiResponse<Store>>(
      `/stores/my-stores/${storeId}`,
      payload,
    );
    return res.data;
  },

  closeStore: async (storeId: string) => {
    const res = await apiClient.post<ApiResponse<Store>>(
      `/stores/my-stores/${storeId}/close`,
    );
    return res.data;
  },
};
