import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getNowInBelem, getTodayLocalDate } from "@/lib/dateUtils";

export interface MeasurementItem {
  id?: string;
  measurement_id?: string;
  rental_equipment_id?: string | null;
  category: 'rentals' | 'demobilization' | 'maintenance';
  item_order: number;
  equipment_code?: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  period_start?: string;
  period_end?: string;
  days_count?: number;
}

export interface Measurement {
  id?: string;
  rental_company_id: string;
  measurement_number: number;
  measurement_date: string;
  period_start: string;
  period_end: string;
  total_days: number;
  subtotal_rentals: number;
  subtotal_demobilization: number;
  subtotal_maintenance: number;
  total_value: number;
  notes?: string;
  created_by?: string;
  items?: MeasurementItem[];
}

export interface RentalEquipmentWithDays {
  id: string;
  equipment_name: string;
  asset_code: string;
  pickup_date: string;
  return_date: string | null;
  daily_rate: number | null;
  work_site: string | null;
  days_count: number;
  total_price: number;
}

// Hook para buscar equipamentos do contrato com cálculo de dias
export function useRentalEquipmentForMeasurement(companyId: string) {
  return useQuery({
    queryKey: ['rental-equipment-measurement', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_equipment')
        .select('*')
        .eq('rental_company_id', companyId)
        .is('return_date', null);

      if (error) throw error;

      const today = getTodayLocalDate();
      
      return (data || []).map(eq => {
        const pickupDate = new Date(eq.pickup_date);
        const endDate = new Date(today);
        const diffTime = Math.abs(endDate.getTime() - pickupDate.getTime());
        const days_count = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const total_price = (eq.daily_rate || 0) * days_count;

        return {
          ...eq,
          days_count,
          total_price
        } as RentalEquipmentWithDays;
      });
    },
    enabled: !!companyId
  });
}

// Hook para buscar próximo número de medição
export function useNextMeasurementNumber(companyId: string) {
  return useQuery({
    queryKey: ['next-measurement-number', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_next_measurement_number', { p_company_id: companyId });

      if (error) throw error;
      return data as number;
    },
    enabled: !!companyId
  });
}

// Hook para buscar medições de uma empresa
export function useRentalMeasurements(companyId: string) {
  return useQuery({
    queryKey: ['rental-measurements', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_measurements')
        .select('*')
        .eq('rental_company_id', companyId)
        .order('measurement_number', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });
}

// Hook para buscar uma medição específica com itens
export function useMeasurementDetails(measurementId: string | undefined) {
  return useQuery({
    queryKey: ['measurement-details', measurementId],
    queryFn: async () => {
      if (!measurementId) return null;

      const { data: measurement, error: measurementError } = await supabase
        .from('rental_measurements')
        .select('*')
        .eq('id', measurementId)
        .single();

      if (measurementError) throw measurementError;

      const { data: items, error: itemsError } = await supabase
        .from('rental_measurement_items')
        .select('*')
        .eq('measurement_id', measurementId)
        .order('item_order');

      if (itemsError) throw itemsError;

      return {
        ...measurement,
        items: items || []
      };
    },
    enabled: !!measurementId
  });
}

// Hook para criar medição
export function useCreateMeasurement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (measurement: Measurement & { items: MeasurementItem[] }) => {
      const { items, ...measurementData } = measurement;

      // Inserir medição
      const { data: newMeasurement, error: measurementError } = await supabase
        .from('rental_measurements')
        .insert({
          rental_company_id: measurementData.rental_company_id,
          measurement_number: measurementData.measurement_number,
          measurement_date: measurementData.measurement_date,
          period_start: measurementData.period_start,
          period_end: measurementData.period_end,
          total_days: measurementData.total_days,
          subtotal_rentals: measurementData.subtotal_rentals,
          subtotal_demobilization: measurementData.subtotal_demobilization,
          subtotal_maintenance: measurementData.subtotal_maintenance,
          total_value: measurementData.total_value,
          notes: measurementData.notes,
          created_by: measurementData.created_by
        })
        .select()
        .single();

      if (measurementError) throw measurementError;

      // Inserir itens
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          measurement_id: newMeasurement.id,
          rental_equipment_id: item.rental_equipment_id || null,
          category: item.category,
          item_order: item.item_order,
          equipment_code: item.equipment_code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          period_start: item.period_start,
          period_end: item.period_end,
          days_count: item.days_count
        }));

        const { error: itemsError } = await supabase
          .from('rental_measurement_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return newMeasurement;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rental-measurements', variables.rental_company_id] });
      queryClient.invalidateQueries({ queryKey: ['next-measurement-number', variables.rental_company_id] });
      toast({
        title: "Medição salva",
        description: "A medição foi salva com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar medição",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Hook para atualizar medição
export function useUpdateMeasurement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (measurement: Measurement & { items: MeasurementItem[] }) => {
      const { items, id, ...measurementData } = measurement;

      if (!id) throw new Error("ID da medição não fornecido");

      // Atualizar medição
      const { error: measurementError } = await supabase
        .from('rental_measurements')
        .update({
          period_start: measurementData.period_start,
          period_end: measurementData.period_end,
          total_days: measurementData.total_days,
          subtotal_rentals: measurementData.subtotal_rentals,
          subtotal_demobilization: measurementData.subtotal_demobilization,
          subtotal_maintenance: measurementData.subtotal_maintenance,
          total_value: measurementData.total_value,
          notes: measurementData.notes,
          updated_at: getNowInBelem().toISOString()
        })
        .eq('id', id);

      if (measurementError) throw measurementError;

      // Deletar itens antigos
      const { error: deleteError } = await supabase
        .from('rental_measurement_items')
        .delete()
        .eq('measurement_id', id);

      if (deleteError) throw deleteError;

      // Inserir novos itens
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          measurement_id: id,
          rental_equipment_id: item.rental_equipment_id || null,
          category: item.category,
          item_order: item.item_order,
          equipment_code: item.equipment_code,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          period_start: item.period_start,
          period_end: item.period_end,
          days_count: item.days_count
        }));

        const { error: itemsError } = await supabase
          .from('rental_measurement_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rental-measurements', variables.rental_company_id] });
      queryClient.invalidateQueries({ queryKey: ['measurement-details', variables.id] });
      toast({
        title: "Medição atualizada",
        description: "A medição foi atualizada com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar medição",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

// Hook para deletar medição
export function useDeleteMeasurement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ measurementId, companyId }: { measurementId: string; companyId: string }) => {
      const { error } = await supabase
        .from('rental_measurements')
        .delete()
        .eq('id', measurementId);

      if (error) throw error;
      return { companyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rental-measurements', data.companyId] });
      toast({
        title: "Medição excluída",
        description: "A medição foi excluída com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir medição",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
