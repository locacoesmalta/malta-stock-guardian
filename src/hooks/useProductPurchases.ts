import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductPurchase {
  id: string;
  product_id: string;
  purchase_date: string;
  quantity: number;
  purchase_price: number | null;
  sale_price: number | null;
  payment_type: string;
  operator_id: string | null;
  operator_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useProductPurchases = (productId?: string) => {
  return useQuery({
    queryKey: ["product-purchases", productId],
    queryFn: async () => {
      let query = supabase
        .from("product_purchases")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductPurchase[] || [];
    },
    enabled: !!productId,
  });
};
