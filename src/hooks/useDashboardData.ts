import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  code: string;
  name: string;
  quantity: number;
  min_quantity: number;
}

interface DashboardData {
  products: Product[];
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  totalProducts: number;
}

const fetchDashboardData = async (): Promise<DashboardData> => {
  // Uma única query otimizada - apenas campos necessários
  const { data, error } = await supabase
    .from("products")
    .select("id, code, name, quantity, min_quantity")
    .is("deleted_at", null)
    .order("name");

  if (error) throw error;

  const products = data || [];
  
  return {
    products,
    lowStockProducts: products.filter(p => p.quantity <= p.min_quantity && p.quantity > 0),
    outOfStockProducts: products.filter(p => p.quantity <= 0),
    totalProducts: products.length,
  };
};

export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};
