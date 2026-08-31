import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../lib/apiClient";
import { useAuthStore } from "../store/authStore";
import {
  User,
  LoginPayload,
  RegisterPayload,
  AuthResponseData,
} from "../types/auth";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated, setTokens, clearAuth } = useAuthStore();

  // Query: Current User Profile (Server State)
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      if (!accessToken) return null;
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: { user: User };
        }>("/auth/me");
        return response.data.data.user;
      } catch (err) {
        return null;
      }
    },
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Mutation: Register
  const registerMutation = useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await apiClient.post<{
        success: boolean;
        data: AuthResponseData;
      }>("/auth/register", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      queryClient.setQueryData(["auth", "me"], data.user);
      // Navigate to role-specific dashboard
      navigateBasedOnRole(data.user.role);
    },
  });

  // Mutation: Login
  const loginMutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const res = await apiClient.post<{
        success: boolean;
        data: AuthResponseData;
      }>("/auth/login", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      queryClient.setQueryData(["auth", "me"], data.user);
      navigateBasedOnRole(data.user.role);
    },
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch (_e) {
        // Ignore network failure on logout
      }
    },
    onSettled: () => {
      clearAuth();
      queryClient.removeQueries({ queryKey: ["auth"] });
      navigate("/login");
    },
  });

  const navigateBasedOnRole = (role: string) => {
    switch (role) {
      case "STUDENT":
        navigate("/student/dashboard");
        break;
      case "INDUSTRY":
        navigate("/industry/dashboard");
        break;
      case "INSTITUTION_ADMIN":
        navigate("/institution/dashboard");
        break;
      case "SUPER_ADMIN":
        navigate("/admin/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  return {
    user: user ?? null,
    role: user?.role ?? null,
    isAuthenticated: Boolean(isAuthenticated && accessToken),
    isLoading,
    isError,
    refetchUser: refetch,
    login: loginMutation.mutateAsync,
    loginStatus: loginMutation.status,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    registerStatus: registerMutation.status,
    registerError: registerMutation.error,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
};
