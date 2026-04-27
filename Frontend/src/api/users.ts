import { apiClient } from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  UserProfile,
  Address,
  UpdateProfilePayload,
  CreateAddressPayload,
} from "@/types/user";
import type { AuthUser } from "@/types/auth";

export const usersService = {
  getMe: async () => {
    const res =
      await apiClient.get<
        ApiResponse<{ user: AuthUser; profile: UserProfile }>
      >("/users/me");
    return res.data;
  },

  updateMe: async (payload: UpdateProfilePayload) => {
    const res = await apiClient.patch<ApiResponse<UserProfile>>(
      "/users/me",
      payload,
    );
    return res.data;
  },

  getAddresses: async () => {
    const res = await apiClient.get<ApiResponse<Address[]>>("/users/addresses");
    return res.data;
  },

  addAddress: async (payload: CreateAddressPayload) => {
    const res = await apiClient.post<ApiResponse<Address>>(
      "/users/addresses",
      payload,
    );
    return res.data;
  },

  updateAddress: async (
    addressId: string,
    payload: Partial<CreateAddressPayload>,
  ) => {
    const res = await apiClient.patch<ApiResponse<Address>>(
      `/users/addresses/${addressId}`,
      payload,
    );
    return res.data;
  },

  deleteAddress: async (addressId: string) => {
    const res = await apiClient.delete<ApiResponse<null>>(
      `/users/addresses/${addressId}`,
    );
    return res.data;
  },

  setDefaultAddress: async (addressId: string) => {
    const res = await apiClient.post<ApiResponse<Address>>(
      `/users/addresses/${addressId}/default`,
    );
    return res.data;
  },
};
