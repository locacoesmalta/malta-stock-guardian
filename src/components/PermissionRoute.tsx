import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface PermissionRouteProps {
  children: ReactNode;
  permission: keyof NonNullable<ReturnType<typeof useAuth>["permissions"]>;
}

export const PermissionRoute = React.memo(({ children, permission }: PermissionRouteProps) => {
  const { isAdmin, permissions, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admins têm acesso a tudo
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar se tem a permissão específica
  if (!permissions || !permissions[permission]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Acesso Negado</h2>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
});
