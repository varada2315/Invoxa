import { useMutation, useQuery } from "@tanstack/react-query";
import type { LoginInput, PublicUser, SignupInput } from "@shared/schema";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";

export function useAuth() {
  const authQuery = useQuery<PublicUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn<PublicUser | null>({ on401: "returnNull" }),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: LoginInput) => {
      const res = await apiRequest("POST", "/api/auth/login", payload);
      return (await res.json()) as PublicUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (payload: SignupInput) => {
      const res = await apiRequest("POST", "/api/auth/signup", payload);
      return (await res.json()) as PublicUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.removeQueries({ queryKey: ["/api/invoices"] });
      queryClient.removeQueries({ queryKey: ["/api/invoice-templates"] });
    },
  });

  return {
    user: authQuery.data ?? null,
    isLoading: authQuery.isLoading,
    loginMutation,
    signupMutation,
    logoutMutation,
  };
}
