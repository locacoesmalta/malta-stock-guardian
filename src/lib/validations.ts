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

export type ProductFormData = z.infer<typeof productSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
