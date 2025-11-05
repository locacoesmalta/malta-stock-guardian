import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StockAdjustment {
  id: string;
  product_id: string;
  adjusted_by: string;
  adjustment_date: string;
  previous_quantity: number;
  new_quantity: number;
  quantity_change: number;
  reason: string | null;
  notes: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

export const useStockAdjustments = (productId: string) => {
  return useQuery({
    queryKey: ["stock-adjustments", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_stock_adjustments")
        .select("*")
        .eq("product_id", productId)
        .order("adjustment_date", { ascending: false });

      if (error) throw error;

      // Buscar informações dos usuários separadamente
      const adjustmentsWithProfiles = await Promise.all(
        (data || []).map(async (adjustment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", adjustment.adjusted_by)
            .single();

          return {
            ...adjustment,
            profiles: profile,
          };
        })
      );

      return adjustmentsWithProfiles as StockAdjustment[];
    },
    enabled: !!productId,
  });
};
