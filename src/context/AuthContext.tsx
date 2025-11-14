import { createContext, useContext, useMemo, useState } from "react";
import { authLogin, authLogout, authMe } from "@/services/api/auth";

type AuthState = {
  access: string | null;
  refresh: string | null;
  role: string | null;
};

const AuthContext = createContext<{ state: AuthState; login: (u: string, p: string) => Promise<void>; logout: () => void } | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ access: localStorage.getItem("access_token"), refresh: localStorage.getItem("refresh_token"), role: null });

  const login = async (username: string, password: string) => {
    await authLogin(username, password);
    const me = await authMe();
    const role = (me?.role || "").toString().toUpperCase() || null;
    setState({ access: localStorage.getItem("access_token"), refresh: localStorage.getItem("refresh_token"), role });
  };

  const logout = () => {
    authLogout();
    setState({ access: null, refresh: null, role: null });
  };

  const value = useMemo(() => ({ state, login, logout }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};

