import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPAT } from "@/lib/patUtils";

/**
 * Hook para buscar quantidade de peças disponíveis (pendentes) por PAT
 * Retorna número de retiradas não arquivadas e não usadas em relatórios
 * 
 * IMPORTANTE: O PAT é SEMPRE formatado para 6 dígitos internamente
 */
export const useAvailablePartsByPAT = (equipmentCode: string | null) => {
  return useQuery({
    queryKey: ["available-parts-by-pat", equipmentCode],
    queryFn: async () => {
      if (!equipmentCode) return 0;

      // CRÍTICO: Formatar PAT para 6 dígitos ANTES da query
      const formattedCode = formatPAT(equipmentCode);
      if (!formattedCode) {
        console.error("PAT inválido:", equipmentCode);
        return 0;
      }

      const { count, error } = await supabase
        .from("v_withdrawals_with_remaining")
        .select("*", { count: "exact", head: true })
        .eq("equipment_code", formattedCode)
        .eq("is_archived", false)
        .gt("remaining_quantity", 0);

      if (error) {
        console.error("Erro ao buscar peças disponíveis:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!equipmentCode,
    staleTime: 30000, // Cache por 30 segundos
  });
};
