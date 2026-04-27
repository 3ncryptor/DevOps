import { apiClient } from "./client";
import type { ApiResponse, BackendList } from "@/types/common";
import type {
  AdminUser,
  AdminDashboardStats,
  AuditLog,
  CategoryFormPayload,
} from "@/types/admin";
import type { Seller, Store } from "@/types/seller";
import type { Category } from "@/types/product";

export const adminService = {
  getDashboard: async () => {
    const res =
      await apiClient.get<ApiResponse<AdminDashboardStats>>("/admin/dashboard");
    return res.data;
  },

  getStats: async (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set("startDate", params.startDate);
    if (params?.endDate) query.set("endDate", params.endDate);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<ApiResponse<AdminDashboardStats>>(
      `/admin/stats${qs}`,
    );
    return res.data;
  },

  // Users
  getUsers: async (
    params: {
      page?: number;
      limit?: number;
      role?: string;
      status?: string;
      search?: string;
    } = {},
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.set(k, String(v));
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<
      ApiResponse<BackendList<"users", AdminUser>>
    >(`/admin/users${qs}`);
    return res.data;
  },

  suspendUser: async (userId: string, reason?: string) => {
    const res = await apiClient.post<ApiResponse<null>>(
      `/admin/users/${userId}/suspend`,
      { reason },
    );
    return res.data;
  },

  activateUser: async (userId: string) => {
    const res = await apiClient.post<ApiResponse<null>>(
      `/admin/users/${userId}/activate`,
    );
    return res.data;
  },

  // Sellers
  getSellers: async (params: { page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.set(k, String(v));
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<
      ApiResponse<BackendList<"sellers", Seller>>
    >(`/admin/sellers${qs}`);
    return res.data;
  },

  getPendingSellers: async () => {
    // Returns same paginated shape: { sellers: [], pagination: {...} }
    const res = await apiClient.get<
      ApiResponse<BackendList<"sellers", Seller>>
    >("/admin/sellers/pending");
    return res.data;
  },

  approveSeller: async (sellerId: string) => {
    const res = await apiClient.post<ApiResponse<null>>(
      `/admin/sellers/${sellerId}/approve`,
    );
    return res.data;
  },

  rejectSeller: async (sellerId: string, reason: string) => {
    const res = await apiClient.post<ApiResponse<null>>(
      `/admin/sellers/${sellerId}/reject`,
      { reason },
    );
    return res.data;
  },

  suspendSeller: async (sellerId: string, reason?: string) => {
    const res = await apiClient.post<ApiResponse<null>>(
      `/admin/sellers/${sellerId}/suspend`,
      { reason },
    );
    return res.data;
  },

  // Stores
  getAllStores: async () => {
    const res = await apiClient.get<ApiResponse<Store[]>>("/admin/stores");
    return res.data;
  },

  // Categories — returns { categories: [], flat: [] }
  getCategories: async () => {
    const res =
      await apiClient.get<
        ApiResponse<{ categories: Category[]; flat: Category[] }>
      >("/admin/categories");
    return res.data;
  },

  createCategory: async (payload: CategoryFormPayload) => {
    const res = await apiClient.post<ApiResponse<Category>>(
      "/admin/categories",
      payload,
    );
    return res.data;
  },

  updateCategory: async (
    categoryId: string,
    payload: Partial<CategoryFormPayload>,
  ) => {
    const res = await apiClient.patch<ApiResponse<Category>>(
      `/admin/categories/${categoryId}`,
      payload,
    );
    return res.data;
  },

  deleteCategory: async (categoryId: string) => {
    const res = await apiClient.delete<ApiResponse<null>>(
      `/admin/categories/${categoryId}`,
    );
    return res.data;
  },

  // Audit logs
  getAuditLogs: async (
    params: {
      page?: number;
      limit?: number;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    } = {},
  ) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.set(k, String(v));
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<ApiResponse<BackendList<"logs", AuditLog>>>(
      `/admin/audit-logs${qs}`,
    );
    return res.data;
  },
};
