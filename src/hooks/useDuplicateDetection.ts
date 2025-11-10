import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DuplicateManufacturerAssets {
  fabricante_normalizado: string;
  variacoes: string[];
  qtd_variacoes: number;
  total_equipamentos: number;
  exemplos_pat: string[];
}

interface DuplicateEquipmentNames {
  equipamento_normalizado: string;
  variacoes: string[];
  qtd_variacoes: number;
  total_registros: number;
  exemplos_pat: string[];
}

interface DuplicateProducts {
  produto_normalizado: string;
  variacoes: string[];
  qtd_variacoes: number;
  total_produtos: number;
  exemplos_codigo: string[];
}

interface DuplicateManufacturerProducts {
  fabricante_normalizado: string;
  variacoes: string[];
  qtd_variacoes: number;
  total_produtos: number;
  exemplos_codigo: string[];
}

interface DuplicateModels {
  modelo_normalizado: string;
  variacoes: string[];
  qtd_variacoes: number;
  total_equipamentos: number;
  exemplos_pat: string[];
}

interface DuplicateEquipmentTypes {
  tipo_normalizado: string;
  variacoes: string[];
  qtd_variacoes: number;
  total_produtos: number;
  exemplos_codigo: string[];
}

interface DuplicateDetectionResult {
  manufacturersAssets: DuplicateManufacturerAssets[];
  equipmentNames: DuplicateEquipmentNames[];
  models: DuplicateModels[];
  equipmentTypes: DuplicateEquipmentTypes[];
  products: DuplicateProducts[];
  manufacturersProducts: DuplicateManufacturerProducts[];
  totalDuplicates: number;
  totalAffectedRecords: number;
}

/**
 * Hook para detectar duplicatas em diferentes tabelas
 */
export const useDuplicateDetection = () => {
  return useQuery({
    queryKey: ['duplicate-detection'],
    queryFn: async (): Promise<DuplicateDetectionResult> => {
      const [
        manufacturersAssetsResult,
        equipmentNamesResult,
        modelsResult,
        equipmentTypesResult,
        productsResult,
        manufacturersProductsResult
      ] = await Promise.all([
        supabase.from('v_duplicate_manufacturers_assets').select('*'),
        supabase.from('v_duplicate_equipment_names').select('*'),
        supabase.from('v_duplicate_models').select('*'),
        supabase.from('v_duplicate_equipment_types').select('*'),
        supabase.from('v_duplicate_products').select('*'),
        supabase.from('v_duplicate_manufacturers_products').select('*')
      ]);

      const manufacturersAssets = (manufacturersAssetsResult.data || []) as DuplicateManufacturerAssets[];
      const equipmentNames = (equipmentNamesResult.data || []) as DuplicateEquipmentNames[];
      const models = (modelsResult.data || []) as DuplicateModels[];
      const equipmentTypes = (equipmentTypesResult.data || []) as DuplicateEquipmentTypes[];
      const products = (productsResult.data || []) as DuplicateProducts[];
      const manufacturersProducts = (manufacturersProductsResult.data || []) as DuplicateManufacturerProducts[];

      // Calcular totais
      const totalDuplicates = 
        manufacturersAssets.length + 
        equipmentNames.length + 
        models.length +
        equipmentTypes.length +
        products.length + 
        manufacturersProducts.length;

      const totalAffectedRecords = 
        manufacturersAssets.reduce((sum, item) => sum + item.total_equipamentos, 0) +
        equipmentNames.reduce((sum, item) => sum + item.total_registros, 0) +
        models.reduce((sum, item) => sum + item.total_equipamentos, 0) +
        equipmentTypes.reduce((sum, item) => sum + item.total_produtos, 0) +
        products.reduce((sum, item) => sum + item.total_produtos, 0) +
        manufacturersProducts.reduce((sum, item) => sum + item.total_produtos, 0);

      return {
        manufacturersAssets,
        equipmentNames,
        models,
        equipmentTypes,
        products,
        manufacturersProducts,
        totalDuplicates,
        totalAffectedRecords
      };
    },
    staleTime: 30000, // 30 segundos
  });
};

/**
 * Hook para normalizar fabricantes de assets
 */
export const useFixDuplicateManufacturersAssets = () => {
  return async (correctName: string, variations: string[]) => {
    const { data, error } = await supabase.rpc('fix_duplicate_manufacturers_assets', {
      p_correct_name: correctName,
      p_variations: variations
    });

    if (error) throw error;
    return data;
  };
};

/**
 * Hook para normalizar fabricantes de produtos
 */
export const useFixDuplicateManufacturersProducts = () => {
  return async (correctName: string, variations: string[]) => {
    const { data, error } = await supabase.rpc('fix_duplicate_manufacturers_products', {
      p_correct_name: correctName,
      p_variations: variations
    });

    if (error) throw error;
    return data;
  };
};

/**
 * Hook para normalizar nomes de equipamentos
 */
export const useFixDuplicateEquipmentNames = () => {
  return async (correctName: string, variations: string[]) => {
    const { data, error } = await supabase.rpc('fix_duplicate_equipment_names', {
      p_correct_name: correctName,
      p_variations: variations
    });

    if (error) throw error;
    return data;
  };
};

/**
 * Hook para normalizar nomes de produtos
 */
export const useFixDuplicateProductNames = () => {
  return async (correctName: string, variations: string[]) => {
    const { data, error } = await supabase.rpc('fix_duplicate_product_names', {
      p_correct_name: correctName,
      p_variations: variations
    });

    if (error) throw error;
    return data;
  };
};

/**
 * Hook para normalizar modelos de equipamentos
 */
export const useFixDuplicateModels = () => {
  return async (correctName: string, variations: string[]) => {
    const { data, error } = await supabase.rpc('fix_duplicate_models', {
      p_correct_name: correctName,
      p_variations: variations
    });

    if (error) throw error;
    return data;
  };
};

/**
 * Hook para normalizar tipos de equipamentos
 */
export const useFixDuplicateEquipmentTypes = () => {
  return async (correctName: string, variations: string[]) => {
    const { data, error } = await supabase.rpc('fix_duplicate_equipment_types', {
      p_correct_name: correctName,
      p_variations: variations
    });

    if (error) throw error;
    return data;
  };
};
