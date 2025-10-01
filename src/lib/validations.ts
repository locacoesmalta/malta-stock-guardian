import { z } from "zod";

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
    .min(6, "Senha deve ter no mínimo 6 caracteres")
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
  location_type: z.enum(["deposito_malta", "liberado_locacao", "em_manutencao", "locacao"], {
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
  is_new_equipment: z.boolean().optional(),
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
  rental_end_date: z.string().optional(),
  qr_code_data: z.string()
    .max(500, "Dados do QR Code devem ter no máximo 500 caracteres")
    .optional(),
  equipment_observations: z.string()
    .trim()
    .max(1000, "Observação deve ter no máximo 1000 caracteres")
    .optional(),
}).refine(
  (data) => {
    if (data.location_type === "em_manutencao") {
      return !!data.maintenance_company && !!data.maintenance_work_site && !!data.maintenance_description;
    }
    return true;
  },
  {
    message: "Empresa, obra e descrição são obrigatórios para manutenção",
    path: ["maintenance_company"],
  }
).refine(
  (data) => {
    if (data.location_type === "locacao") {
      return !!data.rental_company && !!data.rental_work_site && !!data.rental_start_date;
    }
    return true;
  },
  {
    message: "Empresa, obra e data inicial são obrigatórios para locação",
    path: ["rental_company"],
  }
);

export type ProductFormData = z.infer<typeof productSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
export type AssetFormData = z.infer<typeof assetSchema>;
