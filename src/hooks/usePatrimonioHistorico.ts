import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HistoricoItem {
  historico_id: string;
  pat_id: string;
  codigo_pat: string;
  tipo_evento: string;
  detalhes_evento: string | null;
  campo_alterado: string | null;
  valor_antigo: string | null;
  valor_novo: string | null;
  usuario_modificacao: string | null;
  usuario_nome: string | null;
  data_modificacao: string;
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

export const usePatrimonioHistoricoFiltered = (filters: HistoricoFilters) => {
  return useQuery({
    queryKey: ["patrimonio-historico-filtered", filters],
    queryFn: async () => {
      let query = supabase
        .from("patrimonio_historico")
        .select("*")
        .order("data_modificacao", { ascending: false });

      if (filters.codigo_pat) {
        query = query.eq("codigo_pat", filters.codigo_pat);
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
