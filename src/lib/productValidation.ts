import { z } from "zod";

// Schema para código de produto
export const productCodeSchema = z
  .string()
  .min(1, "Código do produto é obrigatório")
  .max(50, "Código deve ter no máximo 50 caracteres");

// Schema para quantidade
export const quantitySchema = z
  .number()
  .int("Quantidade deve ser um número inteiro")
  .min(0, "Quantidade não pode ser negativa");

// Schema para valores monetários
export const priceSchema = z
  .number()
  .min(0, "Preço não pode ser negativo")
  .optional();

// Schema principal do produto
export const productFormSchema = z.object({
  code: productCodeSchema,
  name: z.string().min(3, "Nome do produto deve ter no mínimo 3 caracteres"),
  manufacturer: z.string().optional(),
  quantity: quantitySchema,
  minQuantity: quantitySchema,
  purchasePrice: priceSchema,
  salePrice: priceSchema,
  equipmentBrand: z.string().optional(),
  equipmentType: z.string().optional(),
  equipmentModel: z.string().optional(),
  comments: z.string().optional(),
});

// Schema para retirada de material
export const withdrawalFormSchema = z.object({
  productId: z.string().uuid("Selecione um produto válido"),
  quantity: z.number().min(1, "Quantidade deve ser no mínimo 1"),
  equipmentCode: z.string().min(1, "Código do equipamento é obrigatório"),
  workSite: z.string().min(3, "Nome da obra deve ter no mínimo 3 caracteres"),
  company: z.string().min(3, "Nome da empresa deve ter no mínimo 3 caracteres"),
  withdrawalReason: z.string().optional(),
  collaborators: z.array(
    z.object({
      name: z.string().min(3, "Nome do colaborador deve ter no mínimo 3 caracteres"),
      isPrincipal: z.boolean(),
    })
  ).min(1, "Adicione pelo menos 1 colaborador"),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
export type WithdrawalFormData = z.infer<typeof withdrawalFormSchema>;
