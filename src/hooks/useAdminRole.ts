import { useQuery } from "@tanstack/react-query";
import { authMe } from "@/services/api/auth";

export const useAdminRole = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return useQuery({
    queryKey: ["admin-role"],
    enabled: !!token,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () => {
      const me = await authMe();
      const role = (me?.role || "").toString().toUpperCase();
      return { isAdmin: role === "ADMIN" };
    },
  });
};
