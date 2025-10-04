import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LogActionParams {
  action: string;
  tableName?: string;
  recordId?: string;
  oldData?: any;
  newData?: any;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = async ({
    action,
    tableName,
    recordId,
    oldData,
    newData,
  }: LogActionParams) => {
    if (!user) return;

    try {
      // Note: Audit logs are now handled automatically by database triggers
      // This hook is kept for backward compatibility but doesn't insert directly
      console.log("Audit log would be created:", { action, tableName, recordId });
    } catch (error) {
      console.error("Erro ao registrar log de auditoria:", error);
    }
  };

  return { logAction };
};
