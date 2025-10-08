import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AssetFinancialData {
  manufacturer: string;
  totalValue: number;
  assetCount: number;
  averageValue: number;
  percentage: number;
}

export const useFinancialAssets = (selectedManufacturer?: string) => {
  return useQuery({
    queryKey: ["financial-assets", selectedManufacturer],
    queryFn: async (): Promise<{
      summary: {
        totalValue: number;
        totalAssets: number;
        averageValue: number;
      };
      byManufacturer: AssetFinancialData[];
      manufacturers: string[];
    }> => {
      const { data: assets, error } = await supabase
        .from("assets")
        .select("manufacturer, unit_value")
        .gt("unit_value", 10) // Filtrar valores simbólicos
        .order("manufacturer");

      if (error) throw error;

      // Filtrar por fabricante se selecionado
      const filteredAssets = selectedManufacturer && selectedManufacturer !== "all"
        ? assets?.filter(a => a.manufacturer === selectedManufacturer)
        : assets;

      // Agrupar por fabricante
      const groupedData = new Map<string, Omit<AssetFinancialData, "percentage">>();

      filteredAssets?.forEach(asset => {
        const manufacturer = asset.manufacturer || "Não especificado";
        const value = Number(asset.unit_value) || 0;

        if (!groupedData.has(manufacturer)) {
          groupedData.set(manufacturer, {
            manufacturer,
            totalValue: 0,
            assetCount: 0,
            averageValue: 0,
          });
        }

        const data = groupedData.get(manufacturer)!;
        data.totalValue += value;
        data.assetCount += 1;
      });

      // Calcular média e percentual
      const totalValue = Array.from(groupedData.values()).reduce(
        (sum, item) => sum + item.totalValue,
        0
      );

      const byManufacturer: AssetFinancialData[] = Array.from(groupedData.values())
        .map(item => ({
          ...item,
          averageValue: item.totalValue / item.assetCount,
          percentage: totalValue > 0 ? (item.totalValue / totalValue) * 100 : 0,
        }))
        .sort((a, b) => b.totalValue - a.totalValue);

      // Calcular totais gerais
      const summary = {
        totalValue,
        totalAssets: byManufacturer.reduce((sum, item) => sum + item.assetCount, 0),
        averageValue: totalValue > 0 
          ? totalValue / byManufacturer.reduce((sum, item) => sum + item.assetCount, 0) 
          : 0,
      };

      // Lista de fabricantes únicos para o filtro
      const manufacturers = Array.from(new Set(
        assets?.map(a => a.manufacturer).filter(Boolean) as string[]
      )).sort();

      return { summary, byManufacturer, manufacturers };
    },
  });
};
