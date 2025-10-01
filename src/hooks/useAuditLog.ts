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
      // Buscar informações do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      await supabase.from("audit_logs").insert({
        user_id: user.id,
        user_email: profile?.email || user.email || "unknown",
        user_name: profile?.full_name,
        action,
        table_name: tableName,
        record_id: recordId,
        old_data: oldData,
        new_data: newData,
      });
    } catch (error) {
      console.error("Erro ao registrar log de auditoria:", error);
    }
  };

  return { logAction };
};
