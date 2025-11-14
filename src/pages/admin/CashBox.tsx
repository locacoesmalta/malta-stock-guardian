import { CashBoxManager } from "@/components/CashBoxManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function CashBox() {
  const { permissions, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // FASE 2: Bloquear acesso se não tiver permissão financeira
  if (!isAdmin && !permissions?.can_view_financial_data) {
    return <Navigate to="/welcome" replace />;
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa da Malta</h1>
          <p className="text-muted-foreground mt-2">
            Gestão do caixa diário da empresa
          </p>
        </div>
      </div>

      <CashBoxManager />
    </div>
  );
}
