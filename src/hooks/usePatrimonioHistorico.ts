import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPAT } from "@/lib/patUtils";

interface HistoricoItem {
  historico_id: string;
  pat_id: string;
  codigo_pat: string;
  tipo_evento: string;
  campo_alterado: string | null;
  valor_antigo: string | null;
  valor_novo: string | null;
  detalhes_evento: string | null;
  usuario_modificacao: string | null;
  usuario_nome: string | null;
  data_modificacao: string;
  data_evento_real: string | null;
  registro_retroativo: boolean | null;
}

interface HistoricoFilters {
  codigo_pat?: string;
  data_inicio?: string;
  data_fim?: string;
  usuario?: string;
  campo?: string;
  tipo_evento?: string;
}

export const usePatrimonioHistorico = (patId?: string) => {
  return useQuery({
    queryKey: ["patrimonio-historico", patId],
    queryFn: async () => {
      let query = supabase
        .from("patrimonio_historico")
        .select("*")
        .order("data_modificacao", { ascending: false });

      if (patId) {
        query = query.eq("pat_id", patId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HistoricoItem[];
    },
    enabled: !!patId,
  });
};

/**
 * Hook para buscar histórico filtrado por código PAT
 * 
 * IMPORTANTE: O PAT é SEMPRE formatado para 6 dígitos internamente
 */
export const usePatrimonioHistoricoFiltered = (filters: HistoricoFilters) => {
  return useQuery({
    queryKey: ["patrimonio-historico-filtered", filters],
    queryFn: async () => {
      let query = supabase
        .from("patrimonio_historico")
        .select("*")
        .order("data_modificacao", { ascending: false });

      // CRÍTICO: Formatar PAT para 6 dígitos ANTES da query
      if (filters.codigo_pat) {
        const formattedPAT = formatPAT(filters.codigo_pat);
        if (formattedPAT) {
          query = query.eq("codigo_pat", formattedPAT);
        }
      }

      if (filters.data_inicio) {
        query = query.gte("data_modificacao", filters.data_inicio);
      }

      if (filters.data_fim) {
        query = query.lte("data_modificacao", filters.data_fim);
      }

      if (filters.usuario) {
        query = query.eq("usuario_modificacao", filters.usuario);
      }

      if (filters.campo) {
        query = query.eq("campo_alterado", filters.campo);
      }

      if (filters.tipo_evento) {
        query = query.eq("tipo_evento", filters.tipo_evento);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HistoricoItem[];
    },
  });
};
