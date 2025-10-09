import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RentalCompany {
  id: string;
  company_name: string;
  cnpj: string;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  contract_number: string;
  contract_type: "15" | "30";
  contract_start_date: string;
  contract_end_date: string;
  is_renewed: boolean;
  rental_start_date?: string;
  rental_end_date?: string;
  daily_rental_price?: number;
  equipment_description?: string;
  documents: any[];
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useRentalCompanies = () => {
  return useQuery({
    queryKey: ["rental-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RentalCompany[];
    },
  });
};

export const useRentalCompany = (id: string) => {
  return useQuery({
    queryKey: ["rental-company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rental_companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as RentalCompany;
    },
    enabled: !!id,
  });
};

export const useCreateRentalCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (company: Omit<RentalCompany, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("rental_companies")
        .insert([{ ...company, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa de locação cadastrada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar empresa de locação.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateRentalCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...company }: Partial<RentalCompany> & { id: string }) => {
      const { data, error } = await supabase
        .from("rental_companies")
        .update(company)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa de locação atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar empresa de locação.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteRentalCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rental_companies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rental-companies"] });
      toast({
        title: "Sucesso",
        description: "Empresa de locação excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir empresa de locação.",
        variant: "destructive",
      });
    },
  });
};
