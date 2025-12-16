import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getNowInBelem, getTodayLocalDate, parseLocalDate } from "@/lib/dateUtils";

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
  // Novos campos para cálculo proporcional
  monthly_price?: number;
  unit_quantity?: number;
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
  daily_rate_15: number | null;
  daily_rate_30: number | null;
  rental_period: string | null;
  work_site: string | null;
  days_count: number;
  dias_cobrados: number;
  valor_diaria: number;
  total_price: number;
  dias_reais: number;
  // Novos campos para cálculo proporcional
  monthly_price: number;
  unit_quantity: number;
}

// Calcula dias dentro do período da medição
function calculateDaysInPeriod(
  pickupDate: Date,
  returnDate: Date | null,
  periodStart: Date,
  periodEnd: Date
): number {
  // Data efetiva de início no período (maior entre pickup e início do período)
  const effectiveStart = pickupDate < periodStart ? periodStart : pickupDate;
  
  // Data efetiva de fim no período (menor entre return/periodEnd)
  let effectiveEnd = periodEnd;
  if (returnDate && returnDate < periodEnd) {
    effectiveEnd = returnDate;
  }
  
  // Se o equipamento foi devolvido antes do período, não entra
  if (returnDate && returnDate < periodStart) {
    return 0;
  }
  
  // Se o equipamento foi retirado depois do período, não entra
  if (pickupDate > periodEnd) {
    return 0;
  }
  
  // Calcular diferença em dias
  const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return Math.max(days, 0);
}

// Hook para buscar equipamentos do contrato com cálculo de dias dentro do período
export function useRentalEquipmentForMeasurement(
  companyId: string, 
  periodStart?: Date, 
  periodEnd?: Date
) {
  return useQuery({
    queryKey: ['rental-equipment-measurement', companyId, periodStart?.toISOString(), periodEnd?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_equipment')
        .select('*')
        .eq('rental_company_id', companyId);

      if (error) throw error;

      // Se não tiver período definido, usar hoje como referência
      const today = parseLocalDate(getTodayLocalDate());
      const pEnd = periodEnd || today;
      const pStart = periodStart || new Date(pEnd.getFullYear(), pEnd.getMonth() - 1, pEnd.getDate());
      
      return (data || [])
        .map(eq => {
          // CRÍTICO: usar parseLocalDate para interpretar datas no timezone correto (Belém UTC-3)
          const pickupDate = parseLocalDate(eq.pickup_date);
          const returnDate = eq.return_date ? parseLocalDate(eq.return_date) : null;
          
          // Calcular dias dentro do período da medição
          const dias_reais = calculateDaysInPeriod(pickupDate, returnDate, pStart, pEnd);
          
          // Se não tem dias no período, pular
          if (dias_reais === 0) {
            return null;
          }
          
          // Aplicar regras de cobrança
          const diaria15 = eq.daily_rate_15 || 0;
          const diaria30 = eq.daily_rate_30 || 0;
          
          let dias_cobrados = dias_reais;
          let valor_diaria = diaria30;
          let total_price = 0;
          let monthly_price = 0;
          
          // Calcular dias totais do período para cálculo proporcional
          const totalDays = Math.ceil((pEnd.getTime() - pStart.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dias_reais <= 15) {
            // Até 15 dias = cobra 15 dias com valor maior (quinzena)
            dias_cobrados = 15;
            valor_diaria = diaria15;
            monthly_price = diaria15 * 15; // Valor da quinzena
            total_price = 1 * monthly_price * (dias_reais / totalDays);
          } else {
            // Mais de 15 dias = cobra proporcionalmente com valor mensal
            dias_cobrados = dias_reais;
            valor_diaria = diaria30;
            monthly_price = diaria30 * 30; // Valor mensal completo
            total_price = 1 * monthly_price * (dias_reais / totalDays);
          }

          return {
            ...eq,
            days_count: dias_reais,
            dias_reais,
            dias_cobrados,
            valor_diaria,
            total_price,
            monthly_price,
            unit_quantity: 1
          } as RentalEquipmentWithDays;
        })
        .filter((eq): eq is RentalEquipmentWithDays => eq !== null);
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
