import { useMutation } from "@tanstack/react-query";
import { authLogin, authLogout } from "@/services/api/auth";

export const useAuth = () => {
  const login = useMutation({ mutationFn: ({ username, password }: { username: string; password: string }) => authLogin(username, password) });
  const logout = () => authLogout();
  return { login, logout };
};

