import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
  // Debounce: só validar após 3 caracteres
  const debouncedValue = useMemo(() => {
    if (!value || value.length < 3) return "";
    return value;
  }, [value]);

  return useQuery<DuplicateDetectionResult>({
    queryKey: ['realtime-duplicate', tableName, fieldName, debouncedValue],
    queryFn: async () => {
      if (!debouncedValue || debouncedValue.trim() === "") {
        return { duplicates: [], needsNormalization: false, suggestedValue: null };
      }
      
      const duplicates = await detectDuplicates(debouncedValue, tableName, fieldName);
      const suggestedValue = suggestCorrection(debouncedValue);
      const needsNormalization = suggestedValue !== null;
      
      return {
        duplicates,
        needsNormalization,
        suggestedValue,
      };
    },
    enabled: enabled && !!debouncedValue && debouncedValue.length >= 3,
    staleTime: 5000,
    retry: false,
  });
};
