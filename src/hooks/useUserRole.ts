import { useQuery } from "@tanstack/react-query";
import { authMe } from "@/services/api/auth";

export type UserRole = "ADMIN" | "PRODUTOR" | "CLIENTE" | null;

export const useUserRole = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return useQuery({
    queryKey: ["user-role"],
    enabled: !!token,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      const data = await authMe();
      const raw = (data?.role ?? "").toString().toUpperCase();
      const role: UserRole = raw === "ADMIN" || raw === "PRODUTOR" || raw === "CLIENTE" ? (raw as UserRole) : null;
      return { role } as { role: UserRole };
    },
  });
};
