import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Determine the base URL based on environment variables
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Configure standard Axios client
 */
export const apiClient = axios.create({
    baseURL,
    withCredentials: true, // required for httpOnly cookies (refresh tokens)
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request Interceptor: Attach Access Token
 */
apiClient.interceptors.request.use(
    (config) => {
        // Read token from Zustand store directly
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Handle Token Refreshing
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh token using httpOnly cookie via the endpoint
                const refreshResponse = await axios.post(
                    `${baseURL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken, user } = refreshResponse.data.data;

                // Sync new token & user state into Zustand store
                useAuthStore.getState().setAuth(accessToken, user);

                // Update authorization header & retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
                
            } catch (refreshError) {
                // Refresh failed, meaning session is fully dead - log them out
                useAuthStore.getState().logout();
                // Optionally could window.location.href = '/login' here if we preferred hard redirect
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
