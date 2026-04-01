import { apiClient } from "./client";
import { AuthUser } from "@/store/useAuthStore";

// standard Zentra API response interface
export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

// Request and Response interfaces
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: "USER" | "SELLER";
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

/**
 * Authentication service calls
 */
export const authService = {
  // Login user
  login: async (credentials: LoginData) => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      credentials,
    );
    return response.data;
  },

  // Register new user (returns user without tokens, as per backend logic they must login after optionally but in this app let's check response)
  register: async (credentials: RegisterData) => {
    const response = await apiClient.post<ApiResponse<AuthUser>>(
      "/auth/register",
      credentials,
    );
    return response.data;
  },
};
