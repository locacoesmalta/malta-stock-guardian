/**
 * Utilitários centralizados para Location Types de equipamentos
 * 
 * Este arquivo centraliza as funções de label e variant para evitar
 * duplicação em múltiplos componentes do sistema.
 */

export type LocationType = "deposito_malta" | "em_manutencao" | "locacao" | "aguardando_laudo";

export interface LocationConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

/**
 * Configuração centralizada de tipos de localização
 */
export const LOCATION_TYPES: Record<LocationType, LocationConfig> = {
  deposito_malta: {
    label: "Depósito Malta",
    variant: "secondary",
  },
  em_manutencao: {
    label: "Em Manutenção",
    variant: "destructive",
  },
  locacao: {
    label: "Locação",
    variant: "default",
  },
  aguardando_laudo: {
    label: "Aguardando Laudo",
    variant: "outline",
  },
} as const;

/**
 * Retorna o label amigável para um tipo de localização
 * 
 * @param locationType - Tipo de localização do equipamento
 * @returns Label em português para exibição
 * 
 * @example
 * getLocationLabel("deposito_malta") // "Depósito Malta"
 * getLocationLabel("em_manutencao") // "Em Manutenção"
 */
export function getLocationLabel(locationType: string): string {
  const config = LOCATION_TYPES[locationType as LocationType];
  return config?.label ?? locationType;
}

/**
 * Retorna a variant de Badge para um tipo de localização
 * 
 * @param locationType - Tipo de localização do equipamento
 * @returns Variant para uso com componente Badge
 * 
 * @example
 * getLocationVariant("deposito_malta") // "secondary"
 * getLocationVariant("em_manutencao") // "destructive"
 */
export function getLocationVariant(locationType: string): "default" | "secondary" | "destructive" | "outline" {
  const config = LOCATION_TYPES[locationType as LocationType];
  return config?.variant ?? "outline";
}

/**
 * Verifica se um valor é um LocationType válido
 * 
 * @param value - Valor a ser verificado
 * @returns true se for um LocationType válido
 */
export function isValidLocationType(value: string): value is LocationType {
  return value in LOCATION_TYPES;
}
