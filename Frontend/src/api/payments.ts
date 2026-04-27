import { apiClient } from "./client";
import type { ApiResponse, Paginated } from "@/types/common";
import type { Payment, InitiatePaymentPayload } from "@/types/payment";

export const paymentsService = {
  initiatePayment: async (payload: InitiatePaymentPayload) => {
    const res = await apiClient.post<ApiResponse<Payment>>(
      "/payments/initiate",
      payload,
    );
    return res.data;
  },

  processPayment: async (paymentId: string) => {
    const res = await apiClient.post<ApiResponse<Payment>>(
      `/payments/${paymentId}/process`,
    );
    return res.data;
  },

  quickPay: async (orderId: string, provider?: string) => {
    const res = await apiClient.post<ApiResponse<Payment>>(
      "/payments/quick-pay",
      { orderId, provider },
    );
    return res.data;
  },

  getMyPayments: async (
    params: { page?: number; limit?: number; status?: string } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.status) query.set("status", params.status);
    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await apiClient.get<ApiResponse<Paginated<Payment>>>(
      `/payments/my-payments${qs}`,
    );
    return res.data;
  },

  getPaymentsForOrder: async (orderId: string) => {
    const res = await apiClient.get<ApiResponse<Payment[]>>(
      `/payments/order/${orderId}`,
    );
    return res.data;
  },
};
