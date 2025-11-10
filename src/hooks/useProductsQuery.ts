import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  code: string;
  name: string;
  manufacturer: string | null;
  quantity: number;
  min_quantity: number;
  purchase_price: number | null;
  sale_price: number | null;
  comments: string | null;
  last_purchase_date: string | null;
  payment_type: string | null;
  equipment_brand: string | null;
  equipment_type: string | null;
  equipment_model: string | null;
}

const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .is("deleted_at", null) // Apenas produtos ativos
    .order("name");

  if (error) throw error;
  return data || [];
};

export const useProductsQuery = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
};
