import { apiClient } from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  Seller,
  SellerVerification,
  RegisterSellerPayload,
  SellerDocument,
} from "@/types/seller";

export const sellersService = {
  registerAsSeller: async (payload: RegisterSellerPayload) => {
    const res = await apiClient.post<ApiResponse<Seller>>(
      "/sellers/register",
      payload,
    );
    return res.data;
  },

  getMyProfile: async () => {
    const res = await apiClient.get<ApiResponse<Seller>>("/sellers/me");
    return res.data;
  },

  updateMyProfile: async (payload: Partial<RegisterSellerPayload>) => {
    const res = await apiClient.patch<ApiResponse<Seller>>(
      "/sellers/me",
      payload,
    );
    return res.data;
  },

  submitDocuments: async (documents: SellerDocument[]) => {
    const res = await apiClient.post<ApiResponse<SellerVerification>>(
      "/sellers/me/documents",
      { documents },
    );
    return res.data;
  },

  getVerificationStatus: async () => {
    const res = await apiClient.get<ApiResponse<SellerVerification>>(
      "/sellers/me/verification",
    );
    return res.data;
  },
};
