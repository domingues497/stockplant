import { createContext, useContext, useEffect, useState } from "react";
import { authMe } from "@/services/api/auth";

type User = { id: number; username: string; email: string; role: string | null } | null;

const UserContext = createContext<User>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setUser(null); return; }
    authMe().then((me) => setUser({ id: me.id, username: me.username, email: me.email, role: me.role || null })).catch(() => setUser(null));
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);

