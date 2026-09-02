import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";

export const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Concurrency-safe in-flight refresh promise singleton
let refreshPromise: Promise<string> | null = null;

/**
 * Executes a single token refresh call, sharing the active promise
 * among all concurrent 401 requests to prevent multiple refresh calls
 * and token rotation replay errors.
 */
const getRefreshTokenPromise = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const currentRefreshToken = useAuthStore.getState().refreshToken;
  if (!currentRefreshToken) {
    useAuthStore.getState().clearAuth();
    throw new Error("No refresh token available");
  }

  refreshPromise = (async () => {
    try {
      const response = await axios.post("/api/v1/auth/refresh", {
        refreshToken: currentRefreshToken,
      });

      const newAccessToken = response.data.data.tokens.accessToken;
      const newRefreshToken = response.data.data.tokens.refreshToken;

      // Update persisted store with rotated tokens
      useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

      return newAccessToken;
    } catch (err) {
      // Clear auth on refresh failure to prevent infinite loops
      useAuthStore.getState().clearAuth();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Response Interceptor: Handle 401 and Concurrency-Safe Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (
    error: AxiosError<{ error?: { code?: string; message?: string } }>,
  ) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and request has not already been retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await getRefreshTokenPromise();

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
