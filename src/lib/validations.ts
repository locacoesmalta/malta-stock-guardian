import { z } from "zod";

// Validação de CPF brasileiro
export const validateCPF = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleanCPF.charAt(10))) return false;
  
  return true;
};

// Product validation
export const productSchema = z.object({
  code: z.string()
    .trim()
    .min(1, "Código é obrigatório")
    .max(50, "Código deve ter no máximo 50 caracteres"),
  name: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  manufacturer: z.string()
    .trim()
    .max(200, "Fabricante deve ter no máximo 200 caracteres")
    .nullable()
    .optional()
    .or(z.literal("")),
  quantity: z.number()
    .int("Quantidade deve ser um número inteiro")
    .min(0, "Quantidade não pode ser negativa"),
  min_quantity: z.number()
    .int("Quantidade mínima deve ser um número inteiro")
    .min(0, "Quantidade mínima não pode ser negativa"),
  purchase_price: z.number()
    .min(0, "Preço de compra não pode ser negativo")
    .nullable()
    .optional(),
  sale_price: z.number()
    .min(0, "Preço de venda não pode ser negativo")
    .nullable()
    .optional(),
  comments: z.string()
    .trim()
    .max(1000, "Comentários devem ter no máximo 1000 caracteres")
    .nullable()
    .optional()
    .or(z.literal("")),
});

// Add Stock validation (para compras adicionais)
export const addStockSchema = z.object({
  purchase_date: z.string()
    .min(1, "Data da compra é obrigatória"),
  quantity: z.number()
    .int("Quantidade deve ser um número inteiro")
    .min(1, "Quantidade deve ser maior que 0"),
  purchase_price: z.number()
    .min(0, "Preço de compra não pode ser negativo")
    .nullable()
    .optional(),
  sale_price: z.number()
    .min(0, "Preço de venda não pode ser negativo")
    .nullable()
    .optional(),
  payment_type: z.enum(["Faturado", "Caixa", "Nivaldo", "Sabrina"], {
    required_error: "Tipo de pagamento é obrigatório"
  }),
  notes: z.string()
    .trim()
    .max(500, "Notas devem ter no máximo 500 caracteres")
    .nullable()
    .optional(),
});

// Report validation
export const reportSchema = z.object({
  equipment_code: z.string()
    .trim()
    .min(1, "Código do equipamento é obrigatório")
    .max(100, "Código deve ter no máximo 100 caracteres"),
  equipment_name: z.string()
    .trim()
    .max(200, "Nome do equipamento deve ter no máximo 200 caracteres")
    .optional(),
  work_site: z.string()
    .trim()
    .min(1, "Obra é obrigatória")
    .max(200, "Obra deve ter no máximo 200 caracteres"),
  company: z.string()
    .trim()
    .min(1, "Empresa é obrigatória")
    .max(200, "Empresa deve ter no máximo 200 caracteres"),
  technician_name: z.string()
    .trim()
    .min(1, "Nome do funcionário é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  report_date: z.string()
    .min(1, "Data é obrigatória"),
  service_comments: z.string()
    .trim()
    .min(1, "Comentários são obrigatórios")
    .max(5000, "Comentários devem ter no máximo 5000 caracteres"),
  considerations: z.string()
    .trim()
    .max(5000, "Considerações devem ter no máximo 5000 caracteres")
    .optional(),
  observations: z.string()
    .trim()
    .max(5000, "Observações devem ter no máximo 5000 caracteres")
    .optional(),
  receiver: z.string()
    .trim()
    .max(200, "Nome do recebedor deve ter no máximo 200 caracteres")
    .optional(),
  responsible: z.string()
    .trim()
    .max(200, "Nome do responsável deve ter no máximo 200 caracteres")
    .optional(),
});

// Material withdrawal validation
export const withdrawalSchema = z.object({
  product_id: z.string()
    .uuid("Produto inválido"),
  quantity: z.number()
    .int("Quantidade deve ser um número inteiro")
    .min(1, "Quantidade deve ser no mínimo 1"),
  withdrawal_date: z.string()
    .min(1, "Data é obrigatória"),
  withdrawal_reason: z.string()
    .trim()
    .max(1000, "Motivo deve ter no máximo 1000 caracteres")
    .optional(),
});

// Auth validation
export const authSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido")
    .max(255, "E-mail deve ter no máximo 255 caracteres"),
  password: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres")
    .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
  fullName: z.string()
    .trim()
    .min(1, "Nome é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres")
    .optional(),
});

// Asset validation
export const assetSchema = z.object({
  asset_code: z.string()
    .trim()
    .min(1, "Código do patrimônio é obrigatório")
    .max(100, "Código deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "Código deve conter apenas letras, números, hífens e underscores"),
  equipment_name: z.string()
    .trim()
    .min(1, "Nome do equipamento é obrigatório")
    .max(200, "Nome deve ter no máximo 200 caracteres"),
  manufacturer: z.string()
    .trim()
    .min(1, "Marca/Fabricante é obrigatório")
    .max(200, "Marca deve ter no máximo 200 caracteres"),
  model: z.string()
    .trim()
    .max(200, "Modelo deve ter no máximo 200 caracteres")
    .optional(),
  serial_number: z.string()
    .trim()
    .max(100, "Número de série deve ter no máximo 100 caracteres")
    .optional(),
  voltage_combustion: z.string()
    .trim()
    .max(100, "Voltagem/Combustão deve ter no máximo 100 caracteres")
    .optional(),
  supplier: z.string()
    .trim()
    .max(200, "Fornecedor deve ter no máximo 200 caracteres")
    .optional(),
  purchase_date: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  unit_value: z.number()
    .min(0, "Valor deve ser positivo")
    .optional(),
  equipment_condition: z.enum(["NOVO", "USADO"]).optional(),
  manual_attachment: z.string().optional(),
  exploded_drawing_attachment: z.string().optional(),
  comments: z.string()
    .trim()
    .max(1000, "Comentários devem ter no máximo 1000 caracteres")
    .optional(),
  location_type: z.enum(["deposito_malta", "em_manutencao", "locacao", "aguardando_laudo"], {
    required_error: "Local do equipamento é obrigatório",
  }),
  // Campos para Depósito Malta
  deposito_description: z.string()
    .trim()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  // Campos para Liberado para Locação
  available_for_rental: z.boolean().optional(),
  // Campos para Em Manutenção
  maintenance_company: z.string()
    .trim()
    .max(200, "Empresa deve ter no máximo 200 caracteres")
    .optional(),
  maintenance_work_site: z.string()
    .trim()
    .max(200, "Obra deve ter no máximo 200 caracteres")
    .optional(),
  maintenance_description: z.string()
    .trim()
    .max(1000, "Descrição deve ter no máximo 1000 caracteres")
    .optional(),
  maintenance_arrival_date: z.string().optional(),
  maintenance_departure_date: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  maintenance_delay_observations: z.string()
    .trim()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional(),
  returns_to_work_site: z.boolean().optional(),
  was_replaced: z.boolean().optional(),
  replaced_by_asset_id: z.string().optional(),
  replacement_reason: z.string()
    .trim()
    .max(500, "Motivo deve ter no máximo 500 caracteres")
    .optional(),
  is_new_equipment: z.boolean().optional(),
  destination_after_maintenance: z.string().optional(),
  // Campos para Locação
  rental_company: z.string()
    .trim()
    .max(200, "Empresa deve ter no máximo 200 caracteres")
    .optional(),
  rental_work_site: z.string()
    .trim()
    .max(200, "Obra deve ter no máximo 200 caracteres")
    .optional(),
  rental_start_date: z.string().optional(),
  rental_end_date: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  rental_contract_number: z.string()
    .trim()
    .max(200, "Número do contrato deve ter no máximo 200 caracteres")
    .optional(),
  qr_code_data: z.string()
    .max(500, "Dados do QR Code devem ter no máximo 500 caracteres")
    .optional(),
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
  malta_collaborator: z.string()
    .trim()
    .max(200, "Nome do colaborador deve ter no máximo 200 caracteres")
    .optional(),
}).refine(
  (data) => {
    if (data.location_type === "em_manutencao") {
      return !!data.maintenance_company && !!data.maintenance_work_site && !!data.maintenance_description && !!data.maintenance_arrival_date;
    }
    return true;
  },
  {
    message: "Empresa, obra, descrição e data de chegada são obrigatórios para manutenção",
    path: ["maintenance_arrival_date"],
  }
).refine(
  (data) => {
    if (data.location_type === "locacao") {
      return !!data.rental_company && !!data.rental_work_site && !!data.rental_start_date && !!data.rental_contract_number;
    }
    return true;
  },
  {
    message: "Empresa, obra, data inicial e número do contrato são obrigatórios para locação",
    path: ["rental_contract_number"],
  }
);

// Asset Edit Schema - apenas campos cadastrais/técnicos
export const assetEditSchema = z.object({
  manufacturer: z.string()
    .min(1, "Fabricante é obrigatório"),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  voltage_combustion: z.string()
    .trim()
    .max(100, "Voltagem/Combustão deve ter no máximo 100 caracteres")
    .optional(),
  supplier: z.string().optional(),
  purchase_date: z.string().optional(),
  unit_value: z.number().optional(),
  equipment_condition: z.string()
    .transform(val => val === "" ? undefined : val)
    .pipe(z.enum(["NOVO", "USADO"]).optional()),
  manual_attachment: z.string().optional(),
  exploded_drawing_attachment: z.string().optional(),
  comments: z.string().optional(),
});

// Movement Depósito Schema
export const movementDepositoSchema = z.object({
  deposito_description: z.string()
    .trim()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
  malta_collaborator: z.string()
    .trim()
    .max(200, "Nome do colaborador deve ter no máximo 200 caracteres")
    .optional(),
  was_washed: z.boolean().optional(),
  was_painted: z.boolean().optional(),
});

// Movement Manutenção Schema
export const movementManutencaoSchema = z.object({
  maintenance_company: z.string()
    .trim()
    .min(1, "Empresa de manutenção é obrigatória")
    .max(200, "Empresa deve ter no máximo 200 caracteres"),
  maintenance_work_site: z.string()
    .trim()
    .min(1, "Obra é obrigatória")
    .max(200, "Obra deve ter no máximo 200 caracteres"),
  maintenance_description: z.string()
    .trim()
    .min(1, "Descrição é obrigatória")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  maintenance_arrival_date: z.string()
    .min(1, "Data de chegada é obrigatória"),
  maintenance_departure_date: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  maintenance_delay_observations: z.string()
    .trim()
    .max(1000, "Observações devem ter no máximo 1000 caracteres")
    .optional(),
  returns_to_work_site: z.boolean().optional(),
  destination_after_maintenance: z.string().optional(),
  was_replaced: z.boolean().optional(),
  replacement_reason: z.string()
    .trim()
    .max(500, "Motivo deve ter no máximo 500 caracteres")
    .optional(),
  is_new_equipment: z.boolean().optional(),
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
  malta_collaborator: z.string()
    .trim()
    .max(200, "Nome do colaborador deve ter no máximo 200 caracteres")
    .optional(),
});

// Movement Locação Schema
export const movementLocacaoSchema = z.object({
  rental_company: z.string()
    .trim()
    .min(1, "Empresa é obrigatória")
    .max(200, "Empresa deve ter no máximo 200 caracteres"),
  rental_work_site: z.string()
    .trim()
    .min(1, "Obra é obrigatória")
    .max(200, "Obra deve ter no máximo 200 caracteres"),
  rental_start_date: z.string()
    .min(1, "Data de locação é obrigatória"),
  rental_end_date: z.string()
    .transform(val => val === "" ? undefined : val)
    .optional(),
  rental_contract_number: z.string()
    .trim()
    .max(200, "Número do contrato deve ter no máximo 200 caracteres")
    .optional(),
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
  malta_collaborator: z.string()
    .trim()
    .max(200, "Nome do colaborador deve ter no máximo 200 caracteres")
    .optional(),
});

// Movement Aguardando Laudo Schema
export const movementAguardandoLaudoSchema = z.object({
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
  malta_collaborator: z.string()
    .trim()
    .max(200, "Nome do colaborador deve ter no máximo 200 caracteres")
    .optional(),
});

// Movement Retorno para Obra Schema
export const movementRetornoObraSchema = z.object({
  rental_company: z.string()
    .trim()
    .min(1, "Empresa é obrigatória")
    .max(200, "Empresa deve ter no máximo 200 caracteres"),
  rental_work_site: z.string()
    .trim()
    .min(1, "Obra é obrigatória")
    .max(200, "Obra deve ter no máximo 200 caracteres"),
  parts_replaced: z.boolean({
    required_error: "Selecione se foram trocadas peças",
    invalid_type_error: "Selecione se foram trocadas peças",
  }),
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
  malta_collaborator: z.string()
    .trim()
    .max(200, "Nome do colaborador deve ter no máximo 200 caracteres")
    .optional(),
}).refine(
  (data) => {
    // Se não trocou peças, observações são obrigatórias
    if (data.parts_replaced === false) {
      return !!data.equipment_observations && data.equipment_observations.trim().length > 0;
    }
    return true;
  },
  {
    message: "Observações são obrigatórias quando não foram trocadas peças",
    path: ["equipment_observations"],
  }
);

// Movement Substituição Schema
export const movementSubstituicaoSchema = z.object({
  substitute_asset_code: z.string()
    .trim()
    .min(1, "Informe o PAT do equipamento substituto")
    .max(100, "PAT deve ter no máximo 100 caracteres"),
  rental_company: z.string()
    .trim()
    .min(1, "Empresa é obrigatória para o equipamento substituto")
    .max(200, "Empresa deve ter no máximo 200 caracteres"),
  rental_work_site: z.string()
    .trim()
    .min(1, "Obra é obrigatória para o equipamento substituto")
    .max(200, "Obra deve ter no máximo 200 caracteres"),
  old_asset_destination: z.enum(["aguardando_laudo", "em_manutencao", "deposito_malta"], {
    required_error: "Selecione o destino do equipamento antigo",
  }),
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
  malta_collaborator: z.string()
    .trim()
    .max(200, "Nome do colaborador deve ter no máximo 200 caracteres")
    .optional(),
});

// Post Inspection Schemas
export const postInspectionApproveSchema = z.object({
  decision_notes: z.string()
    .trim()
    .max(500, "Notas devem ter no máximo 500 caracteres")
    .optional(),
});

// Asset Replacement Schema
export const assetReplacementSchema = z.object({
  replaced_by_asset_id: z.string()
    .uuid("Selecione um equipamento válido"),
  replacement_reason: z.string()
    .trim()
    .min(10, "Descreva o motivo da substituição (mínimo 10 caracteres)")
    .max(500, "Motivo deve ter no máximo 500 caracteres"),
  decision_notes: z.string()
    .trim()
    .max(500, "Notas devem ter no máximo 500 caracteres")
    .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type AddStockFormData = z.infer<typeof addStockSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
export type AssetFormData = z.infer<typeof assetSchema>;
export type AssetEditFormData = z.infer<typeof assetEditSchema>;
export type MovementDepositoFormData = z.infer<typeof movementDepositoSchema>;
export type MovementManutencaoFormData = z.infer<typeof movementManutencaoSchema>;
export type MovementLocacaoFormData = z.infer<typeof movementLocacaoSchema>;
export type MovementAguardandoLaudoFormData = z.infer<typeof movementAguardandoLaudoSchema>;
export type MovementRetornoObraFormData = z.infer<typeof movementRetornoObraSchema>;
export type MovementSubstituicaoFormData = z.infer<typeof movementSubstituicaoSchema>;
export type PostInspectionApproveFormData = z.infer<typeof postInspectionApproveSchema>;
export type AssetReplacementFormData = z.infer<typeof assetReplacementSchema>;
