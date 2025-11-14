import { useQuery } from "@tanstack/react-query";
import { authMe } from "@/services/api/auth";

export const useAdminRole = () => {
  return useQuery({
    queryKey: ["admin-role"],
    queryFn: async () => {
      try {
        const me = await authMe();
        const role = (me?.role || "").toString().toUpperCase();
        return { isAdmin: role === "ADMIN" };
      } catch {
        return { isAdmin: false };
      }
    },
  });
};
