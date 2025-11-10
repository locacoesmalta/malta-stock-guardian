import { supabase } from "@/integrations/supabase/client";

/**
 * Normaliza texto removendo espaços extras e convertendo para maiúsculas
 */
export const normalizeText = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.trim().toUpperCase();
};

/**
 * Detecta duplicatas potenciais em um campo específico de uma tabela
 */
export const detectDuplicates = async (
  value: string,
  tableName: 'assets' | 'products',
  fieldName: string
): Promise<string[]> => {
  if (!value || value.trim() === "") return [];
  
  const normalized = normalizeText(value);
  
  try {
    const result = await (supabase as any)
      .from(tableName)
      .select(fieldName)
      .is('deleted_at', null)
      .neq(fieldName, value);
    
    if (result.error) {
      console.error('Error detecting duplicates:', result.error);
      return [];
    }

    if (!result.data || !Array.isArray(result.data)) return [];

    const duplicates: string[] = [];
    
    for (const item of result.data) {
      const itemValue = item[fieldName];
      if (itemValue && typeof itemValue === 'string') {
        if (normalizeText(itemValue) === normalized && itemValue !== value) {
          duplicates.push(itemValue);
        }
      }
    }

    return Array.from(new Set(duplicates));
  } catch (error) {
    console.error('Error in detectDuplicates:', error);
    return [];
  }
};

/**
 * Valida se um texto precisa ser normalizado
 */
export const needsNormalization = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const normalized = normalizeText(text);
  return text !== normalized;
};

/**
 * Sugere correção para texto que precisa normalização
 */
export const suggestCorrection = (text: string | null | undefined): string | null => {
  if (!text) return null;
  const normalized = normalizeText(text);
  if (text === normalized) return null;
  return normalized;
};
