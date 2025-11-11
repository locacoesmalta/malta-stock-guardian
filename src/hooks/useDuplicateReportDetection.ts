import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DuplicateReportDetectionParams {
  equipmentCode: string;
  reportDate: string;
  excludeReportId?: string; // Para excluir o próprio relatório ao editar
}

/**
 * Hook para detectar relatórios duplicados no mesmo equipamento e data
 * Útil para alertar usuários sobre possíveis duplicações acidentais
 */
export const useDuplicateReportDetection = ({
  equipmentCode,
  reportDate,
  excludeReportId,
}: DuplicateReportDetectionParams) => {
  return useQuery({
    queryKey: ["duplicate-report-detection", equipmentCode, reportDate, excludeReportId],
    queryFn: async () => {
      if (!equipmentCode || !reportDate) return null;

      let query = supabase
        .from("reports")
        .select("id, equipment_code, equipment_name, report_date, technician_name, company")
        .eq("equipment_code", equipmentCode)
        .eq("report_date", reportDate);

      // Excluir o próprio relatório se estiver editando
      if (excludeReportId) {
        query = query.neq("id", excludeReportId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao verificar relatórios duplicados:", error);
        return null;
      }

      return data && data.length > 0 ? data : null;
    },
    enabled: !!equipmentCode && !!reportDate,
    staleTime: 10000, // Cache por 10 segundos
  });
};
