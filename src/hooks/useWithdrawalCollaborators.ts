import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalCollaborator {
  id: string;
  withdrawal_id: string;
  collaborator_name: string;
  is_principal: boolean;
  created_at: string;
}

export const useWithdrawalCollaborators = (withdrawalId: string | undefined) => {
  return useQuery({
    queryKey: ["withdrawal-collaborators", withdrawalId],
    queryFn: async () => {
      if (!withdrawalId) return [];

      const { data, error } = await supabase
        .from("material_withdrawal_collaborators")
        .select("*")
        .eq("withdrawal_id", withdrawalId)
        .order("is_principal", { ascending: false })
        .order("collaborator_name");

      if (error) throw error;
      return (data || []) as WithdrawalCollaborator[];
    },
    enabled: !!withdrawalId,
  });
};
