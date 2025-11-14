import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

type Props = {
  children: React.ReactNode;
  allow: Array<"ADMIN" | "PRODUTOR" | "CLIENTE">;
  redirectTo?: string;
};

const ProtectedByRole = ({ children, allow, redirectTo = "/" }: Props) => {
  const { data, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const currentRole = data?.role ?? null;
  if (!currentRole || !allow.includes(currentRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedByRole;
