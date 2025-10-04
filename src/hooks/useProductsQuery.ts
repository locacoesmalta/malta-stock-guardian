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
}

interface PaginatedProductsResponse {
  data: Product[];
  count: number;
  hasMore: boolean;
}

interface ProductsQueryOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  lowStockOnly?: boolean;
}

const fetchProducts = async (options: ProductsQueryOptions = {}): Promise<PaginatedProductsResponse> => {
  const { page = 1, pageSize = 50, searchTerm, lowStockOnly } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("name")
    .range(from, to);

  // Add search functionality if searchTerm is provided
  if (searchTerm) {
    query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`);
  }

  // Filter for low stock products if requested
  if (lowStockOnly) {
    query = query.filter("quantity", "lte", "min_quantity");
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    hasMore: (count || 0) > to + 1,
  };
};

// Hook for paginated products
export const useProductsQuery = (options: ProductsQueryOptions = {}) => {
  return useQuery({
    queryKey: ["products", options],
    queryFn: () => fetchProducts(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for all products (backward compatibility)
export const useAllProductsQuery = () => {
  const fetchAllProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        code,
        name,
        manufacturer,
        quantity,
        min_quantity,
        purchase_price,
        sale_price,
        comments
      `)
      .order("name");

    if (error) throw error;
    return data || [];
  };

  return useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchAllProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
