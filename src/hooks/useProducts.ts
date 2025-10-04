import { useState } from "react";
import { toast } from "sonner";
import { useProductsQuery } from "./useProductsQuery";

export const useProducts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading, error, refetch } = useProductsQuery();

  if (error) {
    toast.error("Erro ao carregar produtos");
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    products: filteredProducts,
    allProducts: products,
    loading: isLoading,
    searchTerm,
    setSearchTerm,
    refetch,
  };
};
