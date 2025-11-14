import { useQuery } from "@tanstack/react-query";
import { authMe } from "@/services/api/auth";

export type UserRole = "ADMIN" | "PRODUTOR" | "CLIENTE" | null;

export const useUserRole = () => {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      try {
        const data = await authMe();
        const raw = (data?.role ?? "").toString().toUpperCase();
        const role: UserRole = raw === "ADMIN" || raw === "PRODUTOR" || raw === "CLIENTE" ? (raw as UserRole) : null;
        return { role } as { role: UserRole };
      } catch {
        return { role: null } as { role: UserRole };
      }
    },
  });
};
