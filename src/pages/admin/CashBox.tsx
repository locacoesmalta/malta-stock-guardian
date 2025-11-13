import { CashBoxManager } from "@/components/CashBoxManager";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function CashBox() {
  const { user } = useAuth();
  const [hasFinancialAccess, setHasFinancialAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFinancialAccess = async () => {
      if (!user) {
        setHasFinancialAccess(false);
        return;
      }

      const { data, error } = await supabase.rpc('can_user_view_financial_data', {
        _user_id: user.id
      });

      if (!error) {
        setHasFinancialAccess(data);
      } else {
        setHasFinancialAccess(false);
      }
    };

    checkFinancialAccess();
  }, [user]);

  if (hasFinancialAccess === null) {
    return <div className="container mx-auto py-6">Carregando...</div>;
  }

  if (!hasFinancialAccess) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar dados financeiros. Contate um administrador para solicitar acesso.
          </AlertDescription>
        </Alert>
      </div>
    );
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
