import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ArchivedHistoryItem {
  historico_id: string;
  pat_id: string;
  codigo_pat: string;
  tipo_evento: string;
  detalhes_evento: string | null;
  usuario_modificacao: string | null;
  usuario_nome: string | null;
  data_modificacao: string;
}

/**
 * Hook para buscar histórico arquivado de um equipamento
 * Retorna apenas eventos do tipo "ARQUIVAMENTO"
 */
export const useArchivedAssetHistory = (patId?: string) => {
  return useQuery({
    queryKey: ["archived-history", patId],
    queryFn: async (): Promise<ArchivedHistoryItem[]> => {
      if (!patId) return [];

      const { data, error } = await supabase
        .from("patrimonio_historico")
        .select("*")
        .eq("pat_id", patId)
        .eq("tipo_evento", "ARQUIVAMENTO")
        .order("data_modificacao", { ascending: false });

      if (error) {
        console.error("Erro ao buscar histórico arquivado:", error);
        throw error;
      }

      return data as ArchivedHistoryItem[];
    },
    enabled: !!patId,
  });
};
