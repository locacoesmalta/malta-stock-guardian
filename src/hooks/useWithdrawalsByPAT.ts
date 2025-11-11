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

      // Usar view otimizada que calcula remaining_quantity no banco (1 única query)
      const { data, error } = await supabase
        .from("v_withdrawals_with_remaining")
        .select(`
          id,
          product_id,
          quantity,
          remaining_quantity,
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
        .gt("remaining_quantity", 0) // Filtrar no banco, não no JS
        .order("withdrawal_date", { ascending: false });

      if (error) {
        console.error("Erro ao buscar retiradas:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!equipmentCode && equipmentCode.length > 0,
  });
};
