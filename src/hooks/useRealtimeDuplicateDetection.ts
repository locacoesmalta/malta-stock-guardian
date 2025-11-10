import { useQuery } from "@tanstack/react-query";
import { detectDuplicates, normalizeText, suggestCorrection } from "@/lib/textNormalization";

interface DuplicateDetectionResult {
  duplicates: string[];
  needsNormalization: boolean;
  suggestedValue: string | null;
}

/**
 * Hook para detectar duplicatas em tempo real durante digitação
 */
export const useRealtimeDuplicateDetection = (
  value: string,
  tableName: 'assets' | 'products',
  fieldName: string,
  enabled: boolean = true
) => {
  return useQuery<DuplicateDetectionResult>({
    queryKey: ['realtime-duplicate', tableName, fieldName, value],
    queryFn: async () => {
      if (!value || value.trim() === "") {
        return { duplicates: [], needsNormalization: false, suggestedValue: null };
      }
      
      const duplicates = await detectDuplicates(value, tableName, fieldName);
      const suggestedValue = suggestCorrection(value);
      const needsNormalization = suggestedValue !== null;
      
      return {
        duplicates,
        needsNormalization,
        suggestedValue,
      };
    },
    enabled: enabled && !!value && value.length > 0,
    staleTime: 5000, // 5 segundos
    retry: false,
  });
};
