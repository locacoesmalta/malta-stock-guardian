import { useQuery } from "@tanstack/react-query";
import { detectDuplicates, normalizeText } from "@/lib/textNormalization";

interface RealtimeDuplicateResult {
  duplicates: string[];
  needsNormalization: boolean;
  suggestedValue: string;
}

/**
 * Hook para detecção de duplicatas em tempo real
 * Verifica enquanto o usuário digita nos formulários
 */
export const useRealtimeDuplicateDetection = (
  value: string,
  tableName: 'assets' | 'products',
  fieldName: string,
  enabled: boolean = true
) => {
  return useQuery<RealtimeDuplicateResult>({
    queryKey: ['realtime-duplicate', tableName, fieldName, value],
    queryFn: async () => {
      if (!value || value.trim() === "") {
        return { 
          duplicates: [], 
          needsNormalization: false,
          suggestedValue: ""
        };
      }
      
      const duplicates = await detectDuplicates(value, tableName, fieldName);
      const normalized = normalizeText(value);
      const needsNormalization = value !== normalized;
      
      return {
        duplicates,
        needsNormalization,
        suggestedValue: normalized,
      };
    },
    enabled: enabled && !!value && value.trim() !== "",
    staleTime: 5000, // 5 segundos
    gcTime: 10000, // 10 segundos
  });
};
