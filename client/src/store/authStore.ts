import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

const ACCESS_TOKEN_KEY = "skillbridge_access_token";
const REFRESH_TOKEN_KEY = "skillbridge_refresh_token";

// Read initial state from localStorage
const storedAccessToken =
  typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
const storedRefreshToken =
  typeof window !== "undefined"
    ? localStorage.getItem(REFRESH_TOKEN_KEY)
    : null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  isAuthenticated: Boolean(storedAccessToken),

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setAccessToken: (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    set({
      accessToken,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
