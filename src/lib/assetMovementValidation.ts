/**
 * Validações adicionais para movimentação de ativos
 * Estas validações verificam datas contra a data de criação do ativo
 */

interface AssetCreationInfo {
  created_at: string;
  effective_registration_date?: string | null;
}

/**
 * Valida se uma data de movimentação não é anterior à criação do ativo
 * @param movementDate - Data da movimentação (ISO string ou Date)
 * @param asset - Informações do ativo (created_at e effective_registration_date)
 * @returns true se válido, string com mensagem de erro se inválido
 */
export const validateMovementDateAgainstCreation = (
  movementDate: string | Date,
  asset: AssetCreationInfo
): true | string => {
  try {
    // Verificar se a data é válida
    if (!movementDate) {
      console.warn("[Validação] Data de movimentação não fornecida");
      return true; // Permitir se não houver data (será validado por outros schemas)
    }

    const movement = new Date(movementDate);
    
    // Verificar se a conversão foi bem-sucedida
    if (isNaN(movement.getTime())) {
      console.error("[Validação] Data de movimentação inválida:", movementDate);
      return "Data de movimentação inválida";
    }
    
    // Usar effective_registration_date se disponível, senão usar created_at
    const assetCreationDateString = asset.effective_registration_date || asset.created_at;
    const assetCreationDate = new Date(assetCreationDateString);
    
    // Verificar se a data de criação é válida
    if (isNaN(assetCreationDate.getTime())) {
      console.error("[Validação] Data de criação do ativo inválida:", assetCreationDateString);
      return true; // Permitir prosseguir se data de criação for inválida (não bloquear usuário)
    }
    
    // Normalizar para comparar apenas datas (sem horas)
    movement.setHours(0, 0, 0, 0);
    assetCreationDate.setHours(0, 0, 0, 0);
    
    console.log("[Validação] Comparando datas:", {
      movementDate: movement.toISOString(),
      assetCreationDate: assetCreationDate.toISOString(),
      isValid: movement >= assetCreationDate
    });
    
    if (movement < assetCreationDate) {
      const formattedCreationDate = assetCreationDate.toLocaleDateString('pt-BR');
      return `Data de movimentação não pode ser anterior à entrada do equipamento no sistema (${formattedCreationDate})`;
    }
    
    return true;
  } catch (error) {
    console.error("[Validação] Erro ao validar data:", error);
    return true; // Em caso de erro, permitir prosseguir (não bloquear usuário)
  }
};

/**
 * Valida data de início de locação contra criação do ativo
 */
export const validateRentalStartDate = (
  rentalStartDate: string,
  asset: AssetCreationInfo
): true | string => {
  return validateMovementDateAgainstCreation(rentalStartDate, asset);
};

/**
 * Valida data de entrada em manutenção contra criação do ativo
 */
export const validateMaintenanceArrivalDate = (
  maintenanceArrivalDate: string,
  asset: AssetCreationInfo
): true | string => {
  return validateMovementDateAgainstCreation(maintenanceArrivalDate, asset);
};

/**
 * Valida data de movimentação genérica contra criação do ativo
 */
export const validateGenericMovementDate = (
  movementDate: string,
  asset: AssetCreationInfo
): true | string => {
  return validateMovementDateAgainstCreation(movementDate, asset);
};

/**
 * Valida data de compra do equipamento (não pode ser futura)
 */
export const validatePurchaseDate = (
  purchaseDate: string,
  asset: AssetCreationInfo
): true | string => {
  const purchase = new Date(purchaseDate);
  const assetCreation = asset.effective_registration_date 
    ? new Date(asset.effective_registration_date)
    : new Date(asset.created_at);
  
  // Normalizar
  purchase.setHours(0, 0, 0, 0);
  assetCreation.setHours(0, 0, 0, 0);
  
  if (purchase > assetCreation) {
    return "Data de compra não pode ser posterior à entrada do equipamento no sistema";
  }
  
  return true;
};

/**
 * Valida intervalo de datas (início e fim) contra criação do ativo
 */
export const validateDateRange = (
  startDate: string,
  endDate: string | null | undefined,
  asset: AssetCreationInfo,
  fieldLabel: string = "operação"
): true | string => {
  try {
    console.log("[Validação Range] Iniciando validação de intervalo:", { startDate, endDate, fieldLabel });

    // Validar data de início
    const startValidation = validateMovementDateAgainstCreation(startDate, asset);
    if (startValidation !== true) {
      console.warn("[Validação Range] Data de início inválida:", startValidation);
      return startValidation;
    }
    
    // Se houver data de fim, validar também
    if (endDate && endDate !== "") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Verificar se as datas são válidas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error("[Validação Range] Datas inválidas no intervalo");
        return true; // Permitir prosseguir (será validado por outros schemas)
      }
      
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      if (end < start) {
        console.warn("[Validação Range] Data de fim anterior à data de início");
        return `Data de fim da ${fieldLabel} não pode ser anterior à data de início`;
      }
      
      // Validar data de fim contra criação do ativo
      const endValidation = validateMovementDateAgainstCreation(endDate, asset);
      if (endValidation !== true) {
        console.warn("[Validação Range] Data de fim inválida contra criação:", endValidation);
        return endValidation;
      }
    }
    
    console.log("[Validação Range] ✓ Intervalo válido");
    return true;
  } catch (error) {
    console.error("[Validação Range] Erro ao validar intervalo:", error);
    return true; // Em caso de erro, permitir prosseguir
  }
};

/**
 * Formata mensagem de erro com contexto do equipamento
 */
export const formatValidationError = (
  error: string,
  assetCode: string
): string => {
  return `[PAT ${assetCode}] ${error}`;
};
