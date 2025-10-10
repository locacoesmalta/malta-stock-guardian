import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductivityData {
  collaborator_name: string;
  equipment_count: number;
}

export interface CollaboratorDetails {
  id: string;
  asset_code: string;
  equipment_name: string;
  maintenance_company: string | null;
  maintenance_work_site: string | null;
  maintenance_arrival_date: string | null;
  maintenance_departure_date: string | null;
  maintenance_delay_observations: string | null;
  days_in_maintenance: number;
  all_collaborators: string[];
  service_type: 'manutencao_externa' | 'manutencao_interna';
}

export const useMonthlyProductivity = (year: number, month: number) => {
  return useQuery({
    queryKey: ["malta-productivity", year, month],
    queryFn: async () => {
      // @ts-ignore - RPC function types not yet regenerated
      const { data, error } = await supabase.rpc("get_monthly_productivity", {
        p_year: year,
        p_month: month,
      });

      if (error) throw error;
      return (data || []) as unknown as ProductivityData[];
    },
  });
};

export const useCollaboratorDetails = (
  collaboratorName: string | null,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ["collaborator-details", collaboratorName, startDate, endDate],
    queryFn: async () => {
      if (!collaboratorName) return [];

      // @ts-ignore - RPC function types not yet regenerated
      const { data, error } = await supabase.rpc("get_collaborator_details", {
        p_collaborator_name: collaboratorName,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });

      if (error) throw error;
      return (data || []) as unknown as CollaboratorDetails[];
    },
    enabled: !!collaboratorName,
  });
};

export const useAllCollaborators = () => {
  return useQuery({
    queryKey: ["all-collaborators"],
    queryFn: async () => {
      // Buscar colaboradores de manutenção externa
      const { data: assetCollabs, error: assetError } = await supabase
        .from("asset_collaborators")
        .select("collaborator_name")
        .order("collaborator_name");

      if (assetError) throw assetError;

      // Buscar colaboradores de manutenção interna (retiradas)
      const { data: withdrawalCollabs, error: withdrawalError } = await supabase
        .from("material_withdrawal_collaborators")
        .select("collaborator_name")
        .order("collaborator_name");

      if (withdrawalError) throw withdrawalError;

      // Combinar e remover duplicatas
      const allNames = [
        ...assetCollabs.map((item) => item.collaborator_name),
        ...withdrawalCollabs.map((item) => item.collaborator_name),
      ];

      const uniqueNames = Array.from(new Set(allNames)).sort();

      return uniqueNames;
    },
  });
};
