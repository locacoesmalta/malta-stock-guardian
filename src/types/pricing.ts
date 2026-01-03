/**
 * Tipos TypeScript para o Módulo de Precificação e Análise de Viabilidade
 * 
 * IMPORTANTE: Todos os tipos usam asset_code (PAT de 6 dígitos) como identificador
 * do equipamento, não UUID.
 */

// ============================================
// TIPOS PARA TABELAS DE PRECIFICAÇÃO
// ============================================

/**
 * Configurações fiscais por localização
 * Tabela: pricing_tax_config
 */
export interface PricingTaxConfig {
  id: string;
  location_type: 'belem' | 'interior_para' | 'outros_estados';
  iss_rate: number;
  pis_rate: number;
  cofins_rate: number;
  csll_rate: number;
  irpj_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Custos operacionais por equipamento
 * Tabela: pricing_asset_costs
 */
export interface PricingAssetCosts {
  id: string;
  asset_code: string; // PAT de 6 dígitos (ex: "001258")
  depreciation_months: number;
  monthly_maintenance_cost: number;
  operational_cost_per_hour: number;
  transport_cost_per_km: number;
  employee_cost_per_day: number;
  profit_margin_percentage: number;
  corrective_maintenance_margin: number;
  created_at: string;
  updated_at: string;
}

/**
 * Histórico de cálculos de precificação
 * Tabela: pricing_calculations
 */
export interface PricingCalculation {
  id: string;
  asset_code: string; // PAT de 6 dígitos
  calculation_date: string;
  location_type: string;
  distance_km: number;
  rental_days: number;
  profit_margin: number;
  employee_cost: number;
  depreciation_cost: number;
  maintenance_cost: number;
  transport_cost: number;
  tax_total: number;
  total_cost: number;
  suggested_price: number;
  created_by: string;
  created_at: string;
}

// ============================================
// TIPOS PARA MANUTENÇÃO ESTENDIDA
// ============================================

/**
 * Manutenção com campos novos (alinhado com tabela asset_maintenances)
 * Inclui os novos campos adicionados na Etapa 1
 */
export interface MaintenanceEntryExtended {
  id: string;
  asset_id: string;
  asset_code?: string; // Via JOIN com assets
  maintenance_date: string;
  maintenance_type: 'preventiva' | 'corretiva';
  services_performed: string;
  problem_description?: string;
  is_recurring_problem: boolean;
  recurrence_count: number;
  is_client_misuse: boolean;
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  observations?: string;
  registered_by: string;
  created_at: string;
}

/**
 * Peças de manutenção (alinhado com tabela asset_maintenance_parts)
 */
export interface MaintenancePartDetail {
  id: string;
  maintenance_id: string;
  product_id: string;
  product_name?: string; // Via JOIN com products
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

// ============================================
// TIPOS PARA ANÁLISE DE VIABILIDADE
// ============================================

/**
 * Resultado da análise de viabilidade de um equipamento
 * Tipo calculado (não é tabela no banco)
 */
export interface ViabilityAnalysis {
  asset_code: string; // PAT de 6 dígitos
  equipment_name: string;
  unit_value: number;
  total_maintenance_cost: number;
  maintenance_percentage: number;
  status: 'saudavel' | 'atencao' | 'critico';
  recommendation: string;
  maintenance_count: number;
  recurring_problems: number;
  average_cost_per_maintenance: number;
}

/**
 * Limiares para classificação de viabilidade
 */
export interface ViabilityThresholds {
  attentionPercentage: number; // Ex: 40%
  criticalPercentage: number;  // Ex: 70%
}

// ============================================
// TIPOS AUXILIARES PARA FORMULÁRIOS
// ============================================

/**
 * Input para cálculo de precificação
 */
export interface PricingCalculationInput {
  asset_code: string;
  location_type: 'belem' | 'interior_para' | 'outros_estados';
  distance_km: number;
  rental_days: number;
  custom_profit_margin?: number;
}

/**
 * Resultado detalhado do cálculo de precificação
 */
export interface PricingCalculationResult {
  employee_cost: number;
  depreciation_cost: number;
  maintenance_cost: number;
  transport_cost: number;
  subtotal: number;
  tax_breakdown: {
    iss: number;
    pis: number;
    cofins: number;
    csll: number;
    irpj: number;
    total: number;
  };
  total_cost: number;
  suggested_price: number;
}

/**
 * Tipo para inserção de custos de equipamento
 */
export type PricingAssetCostsInsert = Omit<PricingAssetCosts, 'id' | 'created_at' | 'updated_at'>;

/**
 * Tipo para atualização de custos de equipamento
 */
export type PricingAssetCostsUpdate = Partial<PricingAssetCostsInsert>;

/**
 * Tipo para inserção de cálculo de precificação
 */
export type PricingCalculationInsert = Omit<PricingCalculation, 'id' | 'created_at'>;
