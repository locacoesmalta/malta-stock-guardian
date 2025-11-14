/**
 * ⚠️ IMPORTANTE: VALIDAÇÕES DE DATA - PRINCÍPIO DE RETROATIVIDADE
 * 
 * Este módulo valida datas de movimentações de ativos.
 * 
 * REGRAS FUNDAMENTAIS:
 * 
 * 1. ✅ PERMITIR retroatividade:
 *    - Eventos físicos podem ocorrer ANTES do cadastro no sistema
 *    - Exemplo: Movimentação em 10/11, cadastro em 14/11 → VÁLIDO
 * 
 * 2. ❌ BLOQUEAR apenas datas FUTURAS:
 *    - Não podemos prever o futuro
 *    - Exemplo: Movimentação amanhã → INVÁLIDO
 * 
 * 3. ⚠️ AVISAR sobre retroatividade (mas não bloquear):
 *    - Confirmação do operador é suficiente
 *    - Sistema obedece ao operador
 * 
 * NÃO validar contra `created_at` ou `effective_registration_date`
 * porque essas são datas de SISTEMA, não de eventos FÍSICOS.
 */

interface AssetCreationInfo {
  created_at: string;
  effective_registration_date?: string | null;
}

/**
 * Valida se uma data de movimentação não é futura
 * @param movementDate - Data da movimentação (ISO string ou Date)
 * @param asset - Informações do ativo (usado para contexto, não para validação)
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
    
    // ✅ NOVA VALIDAÇÃO: Apenas bloquear datas FUTURAS
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    movement.setHours(0, 0, 0, 0);
    
    if (movement > today) {
      console.warn("[Validação] Data de movimentação futura bloqueada:", movement.toISOString());
      return "Data de movimentação não pode ser futura";
    }
    
    // ✅ PERMITIR retroatividade - sistema não deve bloquear
    // Eventos físicos podem ocorrer antes do cadastro no sistema
    console.log("[Validação] ✓ Data válida:", {
      movementDate: movement.toISOString(),
      today: today.toISOString(),
      isRetroactive: movement < today
    });
    
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
  const today = new Date();
  
  // Normalizar
  purchase.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // ✅ Apenas bloquear datas futuras
  if (purchase > today) {
    return "Data de compra não pode ser futura";
  }
  
  // ✅ Permitir qualquer data passada (retroatividade legítima)
  return true;
};

/**
 * Valida intervalo de datas (início e fim)
 * - Garante que data de fim não seja anterior à data de início
 * - Garante que ambas as datas não sejam futuras
 */
export const validateDateRange = (
  startDate: string,
  endDate: string | null | undefined,
  asset: AssetCreationInfo,
  fieldLabel: string = "operação"
): true | string => {
  try {
    console.log("[Validação Range] Iniciando validação de intervalo:", { startDate, endDate, fieldLabel });

    // Validar data de início (bloqueia apenas futuros)
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
      
      // ✅ Validar que fim não é anterior ao início
      if (end < start) {
        console.warn("[Validação Range] Data de fim anterior à data de início");
        return `Data de fim da ${fieldLabel} não pode ser anterior à data de início`;
      }
      
      // ✅ Validar data de fim (bloqueia apenas futuros)
      const endValidation = validateMovementDateAgainstCreation(endDate, asset);
      if (endValidation !== true) {
        console.warn("[Validação Range] Data de fim inválida:", endValidation);
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
