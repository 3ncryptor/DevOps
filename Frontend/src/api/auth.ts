import { apiClient } from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  AuthUser,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ChangePasswordPayload,
} from "@/types/auth";

export const authService = {
  login: async (credentials: LoginPayload) => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials,
    );
    return res.data;
  },

  register: async (credentials: RegisterPayload) => {
    const res = await apiClient.post<ApiResponse<AuthUser>>(
      "/auth/register",
      credentials,
    );
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get<ApiResponse<AuthUser>>("/auth/me");
    return res.data;
  },

  logout: async () => {
    const res = await apiClient.post<ApiResponse<null>>("/auth/logout");
    return res.data;
  },

  logoutAll: async () => {
    const res = await apiClient.post<ApiResponse<null>>("/auth/logout-all");
    return res.data;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const res = await apiClient.post<ApiResponse<null>>(
      "/auth/change-password",
      payload,
    );
    return res.data;
  },
};
