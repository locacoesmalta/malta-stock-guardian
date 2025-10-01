import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AssetsStats {
  liberadosLocacao: number;
  locados: number;
  emManutencao: number;
  total: number;
}

const fetchAssetsStats = async (): Promise<AssetsStats> => {
  const { data, error } = await supabase
    .from("assets")
    .select("location_type");

  if (error) throw error;

  const stats = {
    liberadosLocacao: 0,
    locados: 0,
    emManutencao: 0,
    total: data?.length || 0,
  };

  data?.forEach((asset) => {
    if (asset.location_type === "deposito_malta" || asset.location_type === "liberado_locacao") {
      stats.liberadosLocacao++;
    } else if (asset.location_type === "locacao") {
      stats.locados++;
    } else if (asset.location_type === "em_manutencao") {
      stats.emManutencao++;
    }
  });

  return stats;
};

export const useAssetsStats = () => {
  return useQuery({
    queryKey: ["assets-stats"],
    queryFn: fetchAssetsStats,
  });
};
