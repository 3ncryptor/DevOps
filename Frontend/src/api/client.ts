import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import type { AuthUser } from "@/types/auth";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Request: inject Bearer token ────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response: single-flight refresh lock ────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post<{ data: { accessToken: string; user: AuthUser } }>(
            `${baseURL}/auth/refresh`,
            {},
            { withCredentials: true },
          )
          .then((res) => {
            const { accessToken, user } = res.data.data;
            useAuthStore.getState().setAuth(accessToken, user);
            return accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  },
);

export { baseURL };
