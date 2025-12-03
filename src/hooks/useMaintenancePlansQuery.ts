import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MaintenancePlansFilters {
  startDate?: string;
  endDate?: string;
  equipmentCode?: string;
  planType?: "preventiva" | "corretiva" | "";
  searchTerm?: string;
}

export const useMaintenancePlansQuery = (filters: MaintenancePlansFilters = {}) => {
  return useQuery({
    queryKey: ["maintenance-plans-list", filters],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_plans")
        .select("*")
        .order("plan_date", { ascending: false });

      if (filters.startDate) {
        query = query.gte("plan_date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("plan_date", filters.endDate);
      }
      if (filters.equipmentCode) {
        query = query.ilike("equipment_code", `%${filters.equipmentCode}%`);
      }
      if (filters.planType) {
        query = query.eq("plan_type", filters.planType);
      }
      if (filters.searchTerm) {
        query = query.or(
          `equipment_name.ilike.%${filters.searchTerm}%,` +
          `technician_name.ilike.%${filters.searchTerm}%,` +
          `client_company.ilike.%${filters.searchTerm}%,` +
          `client_work_site.ilike.%${filters.searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
