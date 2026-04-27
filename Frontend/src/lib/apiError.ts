import type { AxiosError } from "axios";

export interface ParsedApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string>;
}

export function parseApiError(error: unknown): ParsedApiError {
  const axiosError = error as AxiosError<{
    message?: string;
    statusCode?: number;
    errors?: Record<string, string>;
  }>;

  if (axiosError.response?.data) {
    return {
      message: axiosError.response.data.message || "An error occurred",
      statusCode:
        axiosError.response.data.statusCode || axiosError.response.status,
      errors: axiosError.response.data.errors,
    };
  }

  if (axiosError.request) {
    return {
      message: "Network error — please check your connection",
      statusCode: 0,
    };
  }

  return { message: String(error), statusCode: 0 };
}
