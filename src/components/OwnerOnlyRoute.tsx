import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface OwnerOnlyRouteProps {
  children: ReactNode;
}

export const OwnerOnlyRoute = ({ children }: OwnerOnlyRouteProps) => {
  const { isSystemOwner, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSystemOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Acesso Restrito</h2>
          <p className="text-muted-foreground mt-2">
            Esta área é exclusiva para o proprietário do sistema.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Apenas o proprietário do sistema tem permissão para acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
