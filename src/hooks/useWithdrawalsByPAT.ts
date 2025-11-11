import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  remaining_quantity: number; // Quantidade ainda disponível após descontar uso em relatórios
  withdrawal_date: string;
  withdrawal_reason: string | null;
  equipment_code: string;
  work_site: string;
  company: string;
  lifecycle_cycle: number;
  is_archived: boolean;
  products: {
    code: string;
    name: string;
    purchase_price: number | null;
  };
}

/**
 * Hook para buscar retiradas de material vinculadas a um PAT específico
 * que ainda não foram usadas em nenhum relatório.
 */
export const useWithdrawalsByPAT = (equipmentCode: string) => {
  return useQuery({
    queryKey: ["withdrawals-by-pat", equipmentCode],
    queryFn: async (): Promise<WithdrawalWithProduct[]> => {
      if (!equipmentCode) return [];

      // Buscar retiradas não arquivadas (sem filtrar por used_in_report_id)
      const { data: withdrawals, error } = await supabase
        .from("material_withdrawals")
        .select(`
          id,
          product_id,
          quantity,
          withdrawal_date,
          withdrawal_reason,
          equipment_code,
          work_site,
          company,
          lifecycle_cycle,
          is_archived,
          products(code, name, purchase_price)
        `)
        .eq("equipment_code", equipmentCode)
        .eq("is_archived", false)
        .order("withdrawal_date", { ascending: false });

      if (error) {
        console.error("Erro ao buscar retiradas:", error);
        throw error;
      }

      if (!withdrawals) return [];

      // Para cada retirada, calcular quantidade já usada em relatórios
      const withdrawalsWithRemaining = await Promise.all(
        withdrawals.map(async (w) => {
          const { data: usedParts } = await supabase
            .from("report_parts")
            .select("quantity_used")
            .eq("withdrawal_id", w.id);

          const totalUsed = usedParts?.reduce((sum, p) => sum + p.quantity_used, 0) || 0;
          const remaining = w.quantity - totalUsed;

          return {
            ...w,
            remaining_quantity: remaining,
          };
        })
      );

      // Filtrar apenas retiradas com quantidade restante disponível
      return withdrawalsWithRemaining.filter(w => w.remaining_quantity > 0);
    },
    enabled: !!equipmentCode && equipmentCode.length > 0,
  });
};
