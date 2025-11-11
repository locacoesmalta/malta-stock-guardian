import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedHistoryEvent {
  id: string;
  date: string;
  type: "withdrawal" | "report" | "maintenance" | "movement";
  title: string;
  description: string;
  details: any;
  user?: string;
}

interface UseAssetUnifiedHistoryParams {
  assetCode: string;
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
}

/**
 * Hook para buscar histórico unificado de um equipamento (PAT)
 * Combina retiradas, relatórios, manutenções e movimentações
 */
export const useAssetUnifiedHistory = ({
  assetCode,
  startDate,
  endDate,
  eventTypes = ["withdrawal", "report", "maintenance", "movement"],
}: UseAssetUnifiedHistoryParams) => {
  return useQuery({
    queryKey: ["asset-unified-history", assetCode, startDate, endDate, eventTypes],
    queryFn: async () => {
      if (!assetCode) return [];

      const events: UnifiedHistoryEvent[] = [];

      // 1. Buscar retiradas de material
      if (eventTypes.includes("withdrawal")) {
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from("material_withdrawals")
          .select(`
            id,
            withdrawal_date,
            quantity,
            withdrawal_reason,
            work_site,
            company,
            lifecycle_cycle,
            is_archived,
            products:product_id (name, code),
            profiles:withdrawn_by (full_name, email)
          `)
          .eq("equipment_code", assetCode)
          .order("withdrawal_date", { ascending: false });

        if (!withdrawalsError && withdrawals) {
          withdrawals.forEach((w: any) => {
            const date = w.withdrawal_date;
            if (startDate && date < startDate) return;
            if (endDate && date > endDate) return;

            events.push({
              id: w.id,
              date,
              type: "withdrawal",
              title: `Retirada de Material${w.is_archived ? " (Arquivada)" : ""}`,
              description: `${w.products?.name || "Produto"} - Qtd: ${w.quantity}`,
              details: {
                product: w.products,
                quantity: w.quantity,
                reason: w.withdrawal_reason,
                workSite: w.work_site,
                company: w.company,
                cycle: w.lifecycle_cycle,
                isArchived: w.is_archived,
              },
              user: w.profiles?.full_name || w.profiles?.email,
            });
          });
        }
      }

      // 2. Buscar relatórios
      if (eventTypes.includes("report")) {
        const { data: reports, error: reportsError } = await supabase
          .from("reports")
          .select(`
            id,
            report_date,
            technician_name,
            service_comments,
            work_site,
            company,
            profiles:created_by (full_name, email),
            report_parts (
              quantity_used,
              products:product_id (name, code)
            )
          `)
          .eq("equipment_code", assetCode)
          .is("deleted_at", null)
          .order("report_date", { ascending: false });

        if (!reportsError && reports) {
          reports.forEach((r: any) => {
            const date = r.report_date;
            if (startDate && date < startDate) return;
            if (endDate && date > endDate) return;

            const partsCount = r.report_parts?.length || 0;
            events.push({
              id: r.id,
              date,
              type: "report",
              title: "Relatório de Avarias",
              description: `${partsCount} ${partsCount === 1 ? "peça usada" : "peças usadas"} - ${r.technician_name}`,
              details: {
                technician: r.technician_name,
                comments: r.service_comments,
                workSite: r.work_site,
                company: r.company,
                parts: r.report_parts,
              },
              user: r.profiles?.full_name || r.profiles?.email,
            });
          });
        }
      }

      // 3. Buscar manutenções
      if (eventTypes.includes("maintenance")) {
        const { data: asset } = await supabase
          .from("assets")
          .select("id")
          .eq("asset_code", assetCode)
          .maybeSingle();

        if (asset) {
          const { data: maintenances, error: maintenancesError } = await supabase
            .from("asset_maintenances")
            .select(`
              id,
              maintenance_date,
              maintenance_type,
              services_performed,
              technician_name,
              current_hourmeter,
              previous_hourmeter,
              total_cost,
              profiles:registered_by (full_name, email)
            `)
            .eq("asset_id", asset.id)
            .order("maintenance_date", { ascending: false });

          if (!maintenancesError && maintenances) {
            maintenances.forEach((m: any) => {
              const date = m.maintenance_date;
              if (startDate && date < startDate) return;
              if (endDate && date > endDate) return;

              events.push({
                id: m.id,
                date,
                type: "maintenance",
                title: `Manutenção - ${m.maintenance_type}`,
                description: m.services_performed,
                details: {
                  type: m.maintenance_type,
                  services: m.services_performed,
                  technician: m.technician_name,
                  hourmeter: {
                    previous: m.previous_hourmeter,
                    current: m.current_hourmeter,
                  },
                  cost: m.total_cost,
                },
                user: m.profiles?.full_name || m.profiles?.email,
              });
            });
          }
        }
      }

      // 4. Buscar histórico de movimentações
      if (eventTypes.includes("movement")) {
        const { data: history, error: historyError } = await supabase
          .from("patrimonio_historico")
          .select("*")
          .eq("codigo_pat", assetCode)
          .order("data_modificacao", { ascending: false });

        if (!historyError && history) {
          history.forEach((h: any) => {
            const date = h.data_modificacao.split("T")[0];
            if (startDate && date < startDate) return;
            if (endDate && date > endDate) return;

            events.push({
              id: h.historico_id,
              date,
              type: "movement",
              title: h.tipo_evento,
              description: h.detalhes_evento || `${h.campo_alterado}: ${h.valor_antigo} → ${h.valor_novo}`,
              details: {
                eventType: h.tipo_evento,
                field: h.campo_alterado,
                oldValue: h.valor_antigo,
                newValue: h.valor_novo,
                details: h.detalhes_evento,
              },
              user: h.usuario_nome,
            });
          });
        }
      }

      // Ordenar todos os eventos por data (mais recente primeiro)
      return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!assetCode,
  });
};
