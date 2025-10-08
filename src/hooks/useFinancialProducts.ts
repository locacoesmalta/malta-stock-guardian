import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductFinancialData {
  manufacturer: string;
  totalQuantity: number;
  stockValue: number;
  saleValue: number;
  margin: number;
  productCount: number;
}

export const useFinancialProducts = (selectedManufacturer?: string) => {
  return useQuery({
    queryKey: ["financial-products", selectedManufacturer],
    queryFn: async (): Promise<{
      summary: {
        totalStockValue: number;
        totalSaleValue: number;
        totalMargin: number;
      };
      byManufacturer: ProductFinancialData[];
      manufacturers: string[];
    }> => {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("manufacturer");

      if (error) throw error;

      // Filtrar por fabricante se selecionado
      const filteredProducts = selectedManufacturer && selectedManufacturer !== "all"
        ? products?.filter(p => p.manufacturer === selectedManufacturer)
        : products;

      // Agrupar por fabricante
      const groupedData = new Map<string, ProductFinancialData>();

      filteredProducts?.forEach(product => {
        const manufacturer = product.manufacturer || "Não especificado";
        const stockValue = (product.quantity || 0) * (product.purchase_price || 0);
        const saleValue = (product.quantity || 0) * (product.sale_price || 0);
        const margin = saleValue - stockValue;

        if (!groupedData.has(manufacturer)) {
          groupedData.set(manufacturer, {
            manufacturer,
            totalQuantity: 0,
            stockValue: 0,
            saleValue: 0,
            margin: 0,
            productCount: 0,
          });
        }

        const data = groupedData.get(manufacturer)!;
        data.totalQuantity += product.quantity || 0;
        data.stockValue += stockValue;
        data.saleValue += saleValue;
        data.margin += margin;
        data.productCount += 1;
      });

      const byManufacturer = Array.from(groupedData.values()).sort(
        (a, b) => b.stockValue - a.stockValue
      );

      // Calcular totais gerais
      const summary = {
        totalStockValue: byManufacturer.reduce((sum, item) => sum + item.stockValue, 0),
        totalSaleValue: byManufacturer.reduce((sum, item) => sum + item.saleValue, 0),
        totalMargin: byManufacturer.reduce((sum, item) => sum + item.margin, 0),
      };

      // Lista de fabricantes únicos para o filtro
      const manufacturers = Array.from(new Set(
        products?.map(p => p.manufacturer).filter(Boolean) as string[]
      )).sort();

      return { summary, byManufacturer, manufacturers };
    },
  });
};
