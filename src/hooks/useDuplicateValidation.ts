import { supabase } from "@/integrations/supabase/client";
import { normalizeText } from "@/lib/textNormalization";
import { formatPAT } from "@/lib/patUtils";

export interface DuplicateValidationResult {
  isValid: boolean;
  message?: string;
  status: "valid" | "invalid" | "warning";
}

/**
 * Valida se um valor já existe no banco (duplicata)
 */
export async function validateDuplicate(
  value: string,
  tableName: "assets" | "products",
  fieldName: string,
  excludeId?: string
): Promise<DuplicateValidationResult> {
  if (!value || value.trim() === "") {
    return { isValid: true, status: "valid" };
  }

  try {
    // Buscar duplicatas de forma simplificada
    if (tableName === "assets") {
      // CRÍTICO: Para assets, SEMPRE usar formatPAT para garantir 6 dígitos
      const normalizedPAT = formatPAT(value);
      
      if (!normalizedPAT) {
        return { 
          isValid: false, 
          message: "PAT inválido - deve conter apenas números (máx 6 dígitos)", 
          status: "invalid" 
        };
      }

      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_code")
        .eq("asset_code", normalizedPAT)
        .is("deleted_at", null)
        .neq("id", excludeId || "00000000-0000-0000-0000-000000000000")
        .limit(1);

      if (error) {
        console.error("Validation error:", error);
        return { isValid: true, status: "valid" };
      }

      if (data && data.length > 0) {
        return {
          isValid: false,
          message: `⚠️ Já existe um equipamento com esse PAT: "${data[0].asset_code}"`,
          status: "invalid",
        };
      }
    } else {
      // Para produtos, usar normalizeText (não é PAT)
      const normalized = normalizeText(value);
      
      const { data, error } = await supabase
        .from("products")
        .select("id, name, code")
        .or(`name.ilike.${normalized},code.ilike.${normalized}`)
        .is("deleted_at", null)
        .neq("id", excludeId || "00000000-0000-0000-0000-000000000000")
        .limit(1);

      if (error) {
        console.error("Validation error:", error);
        return { isValid: true, status: "valid" };
      }

      if (data && data.length > 0) {
        const field = fieldName === "name" ? data[0].name : data[0].code;
        return {
          isValid: false,
          message: `⚠️ Já existe um produto: "${field}"`,
          status: "invalid",
        };
      }
    }

    return {
      isValid: true,
      message: "✓ Disponível",
      status: "valid",
    };
  } catch (error) {
    console.error("Validation error:", error);
    return { isValid: true, status: "valid" };
  }
}

/**
 * Valida se precisa normalização (espaços extras, minúsculas)
 */
export function validateNormalization(value: string): DuplicateValidationResult {
  if (!value || value.trim() === "") {
    return { isValid: true, status: "valid" };
  }

  const normalized = normalizeText(value);
  
  if (value !== normalized) {
    return {
      isValid: true,
      message: `💡 Sugestão: "${normalized}"`,
      status: "warning",
    };
  }

  return { isValid: true, status: "valid" };
}

/**
 * Valida formato de PAT (SEMPRE 6 dígitos)
 */
export function validatePATFormat(value: string): DuplicateValidationResult {
  if (!value) {
    return { isValid: true, status: "valid" };
  }

  // Remover espaços
  const cleaned = value.trim();
  
  // Validar apenas números
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      message: "PAT deve conter apenas números",
      status: "invalid",
    };
  }

  // Validar tamanho (máximo 6 dígitos)
  if (cleaned.length > 6) {
    return {
      isValid: false,
      message: "PAT não pode ter mais de 6 dígitos",
      status: "invalid",
    };
  }

  // PAT válido - será formatado automaticamente com zeros à esquerda
  return {
    isValid: true,
    message: cleaned.length < 6 ? "✓ Será formatado com zeros à esquerda" : "✓ Formato válido",
    status: "valid",
  };
}
