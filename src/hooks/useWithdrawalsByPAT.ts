import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalWithProduct {
  id: string;
  product_id: string;
  quantity: number;
  withdrawal_date: string;
  withdrawal_reason: string | null;
  equipment_code: string;
  work_site: string;
  company: string;
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

      const { data, error } = await supabase
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
          products(code, name, purchase_price)
        `)
        .eq("equipment_code", equipmentCode)
        .is("used_in_report_id", null) // Apenas retiradas não usadas em relatórios
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
