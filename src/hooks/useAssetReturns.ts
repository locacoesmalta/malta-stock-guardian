import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AssetReturn {
  id: string;
  codigo_pat: string;
  equipment_name: string | null;
  asset_id: string | null;
  empresa: string | null;
  obra: string | null;
  data_devolucao: string;
  usuario_nome: string | null;
  detalhes_evento: string | null;
}

interface UseAssetReturnsParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/**
 * Hook para buscar histórico de devoluções de equipamentos
 * Busca eventos do tipo "FIM DE LOCAÇÃO" na tabela patrimonio_historico
 */
export const useAssetReturns = (params?: UseAssetReturnsParams) => {
  return useQuery({
    queryKey: ["asset-returns", params?.startDate, params?.endDate],
    queryFn: async () => {
      // Buscar eventos de FIM DE LOCAÇÃO
      let query = supabase
        .from("patrimonio_historico")
        .select(`
          historico_id,
          codigo_pat,
          pat_id,
          detalhes_evento,
          data_evento_real,
          data_modificacao,
          usuario_nome
        `)
        .eq("tipo_evento", "FIM DE LOCAÇÃO")
        .order("data_evento_real", { ascending: false, nullsFirst: false });

      // Filtrar por período se especificado
      if (params?.startDate) {
        query = query.gte("data_evento_real", params.startDate);
      }
      if (params?.endDate) {
        query = query.lte("data_evento_real", params.endDate);
      }

      const { data: historico, error: historicoError } = await query;

      if (historicoError) throw historicoError;
      if (!historico || historico.length === 0) return [];

      // Buscar informações dos assets relacionados
      const patIds = [...new Set(historico.map((h) => h.pat_id).filter(Boolean))];
      
      let assetsMap: Record<string, { equipment_name: string; id: string }> = {};
      
      if (patIds.length > 0) {
        const { data: assets } = await supabase
          .from("assets")
          .select("id, equipment_name")
          .in("id", patIds);

        if (assets) {
          assetsMap = assets.reduce((acc, asset) => {
            acc[asset.id] = { equipment_name: asset.equipment_name, id: asset.id };
            return acc;
          }, {} as Record<string, { equipment_name: string; id: string }>);
        }
      }

      // Processar e extrair empresa/obra dos detalhes
      const returns: AssetReturn[] = historico.map((item) => {
        const assetInfo = item.pat_id ? assetsMap[item.pat_id] : null;
        
        // Extrair empresa e obra do detalhes_evento
        // Formato típico: "Finalizada locação na empresa X, obra Y"
        let empresa: string | null = null;
        let obra: string | null = null;
        
        if (item.detalhes_evento) {
          const empresaMatch = item.detalhes_evento.match(/empresa[:\s]+([^,]+)/i);
          const obraMatch = item.detalhes_evento.match(/obra[:\s]+([^,.\n]+)/i);
          
          if (empresaMatch) empresa = empresaMatch[1].trim();
          if (obraMatch) obra = obraMatch[1].trim();
        }

        return {
          id: item.historico_id,
          codigo_pat: item.codigo_pat,
          equipment_name: assetInfo?.equipment_name || null,
          asset_id: assetInfo?.id || item.pat_id,
          empresa,
          obra,
          data_devolucao: item.data_evento_real || item.data_modificacao,
          usuario_nome: item.usuario_nome,
          detalhes_evento: item.detalhes_evento,
        };
      });

      return returns;
    },
  });
};

/**
 * Hook para contar devoluções do mês atual
 */
export const useAssetReturnsCount = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  return useQuery({
    queryKey: ["asset-returns-count", startOfMonth, endOfMonth],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patrimonio_historico")
        .select("*", { count: "exact", head: true })
        .eq("tipo_evento", "FIM DE LOCAÇÃO")
        .gte("data_evento_real", startOfMonth)
        .lte("data_evento_real", endOfMonth);

      if (error) throw error;
      return count || 0;
    },
  });
};
