import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, parse } from "date-fns";

export interface AssetReturn {
  id: string;
  codigo_pat: string;
  equipment_name: string | null;
  asset_id: string | null;
  empresa: string | null;
  obra: string | null;
  data_inicio_locacao: string | null;
  data_devolucao: string;
  duracao_dias: number | null;
  usuario_nome: string | null;
  detalhes_evento: string | null;
}

interface UseAssetReturnsParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/**
 * Extrai a data de início da locação do campo detalhes_evento
 * Formato esperado: "Locação encerrada em DD/MM/YYYY. Início: DD/MM/YYYY. Empresa: X. Obra: Y"
 */
function extractStartDateFromDetails(detalhes: string | null): string | null {
  if (!detalhes) return null;
  
  const match = detalhes.match(/Início[:\s]+(\d{2}\/\d{2}\/\d{4})/i);
  if (match) {
    // Converter DD/MM/YYYY para YYYY-MM-DD
    const [dia, mes, ano] = match[1].split('/');
    return `${ano}-${mes}-${dia}`;
  }
  return null;
}

/**
 * Calcula a duração em dias entre duas datas
 */
function calculateDuration(startDate: string | null, endDate: string | null): number | null {
  if (!startDate || !endDate) return null;
  
  try {
    const start = parse(startDate, 'yyyy-MM-dd', new Date());
    const end = parse(endDate.split('T')[0], 'yyyy-MM-dd', new Date());
    return differenceInDays(end, start);
  } catch {
    return null;
  }
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
        .order("data_evento_real", { ascending: true, nullsFirst: false });

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

      // Buscar informações dos assets relacionados (para fallback do rental_start_date)
      const patIds = [...new Set(historico.map((h) => h.pat_id).filter(Boolean))];
      
      let assetsMap: Record<string, { 
        equipment_name: string; 
        id: string;
        rental_start_date: string | null;
      }> = {};
      
      if (patIds.length > 0) {
        const { data: assets } = await supabase
          .from("assets")
          .select("id, equipment_name, rental_start_date")
          .in("id", patIds);

        if (assets) {
          assetsMap = assets.reduce((acc, asset) => {
            acc[asset.id] = { 
              equipment_name: asset.equipment_name, 
              id: asset.id,
              rental_start_date: asset.rental_start_date 
            };
            return acc;
          }, {} as Record<string, { equipment_name: string; id: string; rental_start_date: string | null }>);
        }
      }

      // Processar e extrair empresa/obra/início dos detalhes
      const returns: AssetReturn[] = historico.map((item) => {
        const assetInfo = item.pat_id ? assetsMap[item.pat_id] : null;
        
        // Extrair empresa e obra do detalhes_evento
        let empresa: string | null = null;
        let obra: string | null = null;
        
        if (item.detalhes_evento) {
          const empresaMatch = item.detalhes_evento.match(/Empresa[:\s]+([^.]+)/i);
          const obraMatch = item.detalhes_evento.match(/Obra[:\s]+([^.]+)/i);
          
          if (empresaMatch) empresa = empresaMatch[1].trim();
          if (obraMatch) obra = obraMatch[1].trim();
        }

        // Extrair data de início do detalhes_evento (prioridade)
        // Fallback: usar rental_start_date do asset (apenas se não encontrar no detalhes)
        const dataInicioDoDetalhes = extractStartDateFromDetails(item.detalhes_evento);
        const dataInicio = dataInicioDoDetalhes || assetInfo?.rental_start_date || null;
        
        const dataDevolucao = item.data_evento_real || item.data_modificacao;
        const duracaoDias = calculateDuration(dataInicio, dataDevolucao);

        return {
          id: item.historico_id,
          codigo_pat: item.codigo_pat,
          equipment_name: assetInfo?.equipment_name || null,
          asset_id: assetInfo?.id || item.pat_id,
          empresa,
          obra,
          data_inicio_locacao: dataInicio,
          data_devolucao: dataDevolucao,
          duracao_dias: duracaoDias,
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
