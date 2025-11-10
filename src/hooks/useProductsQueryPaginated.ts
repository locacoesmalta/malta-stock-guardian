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

interface UseProductsQueryOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

const fetchProducts = async ({ 
  page = 0, 
  pageSize = 50,
  searchTerm = "" 
}: UseProductsQueryOptions = {}): Promise<{ data: Product[], count: number }> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*", { count: 'exact' })
    .is("deleted_at", null)
    .order("name");

  // Filtro de busca
  if (searchTerm) {
    query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const useProductsQueryPaginated = (options?: UseProductsQueryOptions) => {
  return useQuery({
    queryKey: ["products-paginated", options?.page, options?.pageSize, options?.searchTerm],
    queryFn: () => fetchProducts(options),
  });
};
