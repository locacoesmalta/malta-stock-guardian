import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  type: "product" | "asset" | "report" | "receipt";
  title: string;
  subtitle: string;
  metadata?: Record<string, any>;
}

export const useFullTextSearch = (searchTerm: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  const search = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchPattern = `%${term}%`;

    try {
      // Buscar em paralelo em todas as tabelas
      const [productsData, assetsData, reportsData, receiptsData] = await Promise.all([
        supabase
          .from("products")
          .select("id, code, name, quantity")
          .is("deleted_at", null)
          .or(`name.ilike.${searchPattern},code.ilike.${searchPattern}`)
          .limit(5),
        
        supabase
          .from("assets")
          .select("id, asset_code, equipment_name, location_type")
          .is("deleted_at", null)
          .or(`asset_code.ilike.${searchPattern},equipment_name.ilike.${searchPattern}`)
          .limit(5),
        
        supabase
          .from("reports")
          .select("id, equipment_code, work_site, technician_name, report_date")
          .is("deleted_at", null)
          .or(`equipment_code.ilike.${searchPattern},technician_name.ilike.${searchPattern},work_site.ilike.${searchPattern}`)
          .limit(5),
        
        supabase
          .from("equipment_receipts")
          .select("id, receipt_number, client_name, work_site, receipt_type")
          .is("deleted_at", null)
          .or(`client_name.ilike.${searchPattern},work_site.ilike.${searchPattern}`)
          .limit(5),
      ]);

      const combinedResults: SearchResult[] = [];

      // Produtos
      productsData.data?.forEach((product) => {
        combinedResults.push({
          id: product.id,
          type: "product",
          title: product.name,
          subtitle: `Código: ${product.code} | Estoque: ${product.quantity}`,
          metadata: product,
        });
      });

      // Ativos
      assetsData.data?.forEach((asset) => {
        combinedResults.push({
          id: asset.id,
          type: "asset",
          title: asset.equipment_name,
          subtitle: `PAT: ${asset.asset_code} | ${asset.location_type}`,
          metadata: asset,
        });
      });

      // Relatórios
      reportsData.data?.forEach((report) => {
        combinedResults.push({
          id: report.id,
          type: "report",
          title: `Relatório - ${report.equipment_code}`,
          subtitle: `${report.technician_name} | ${report.work_site}`,
          metadata: report,
        });
      });

      // Recibos
      receiptsData.data?.forEach((receipt) => {
        combinedResults.push({
          id: receipt.id,
          type: "receipt",
          title: `Recibo #${receipt.receipt_number}`,
          subtitle: `${receipt.client_name} | ${receipt.work_site}`,
          metadata: receipt,
        });
      });

      setResults(combinedResults);
    } catch (error) {
      console.error("Erro na busca:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedSearch);
  }, [debouncedSearch, search]);

  return { results, isLoading };
};
