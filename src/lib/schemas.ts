import { z } from "zod";
import { sanitizeText, sanitizeHTML, containsXSSPatterns } from "./inputSanitization";

// Schema de validação para retiradas de material
export const withdrawalSchema = z.object({
  product_id: z.string().uuid({ message: "Produto é obrigatório" }),
  quantity: z.number().min(1, { message: "Quantidade deve ser maior que zero" }),
  withdrawal_date: z.string().min(1, { message: "Data de retirada é obrigatória" }),
  withdrawal_reason: z.string().optional(),
});

// Schema de validação para relatórios
export const reportSchema = z.object({
  equipment_code: z.string()
    .min(1, { message: "PAT é obrigatório" })
    .transform(val => sanitizeText(val))
    .refine(val => !containsXSSPatterns(val), "Entrada contém código malicioso"),
  equipment_name: z.string()
    .min(1, { message: "Nome do equipamento é obrigatório" })
    .transform(val => sanitizeText(val))
    .refine(val => !containsXSSPatterns(val), "Entrada contém código malicioso"),
  work_site: z.string()
    .min(1, { message: "Obra é obrigatória" })
    .transform(val => sanitizeText(val)),
  company: z.string()
    .min(1, { message: "Cliente é obrigatório" })
    .transform(val => sanitizeText(val)),
  technician_name: z.string()
    .min(1, { message: "Técnico responsável é obrigatório" })
    .transform(val => sanitizeText(val)),
  report_date: z.string().min(1, { message: "Data do relatório é obrigatória" }),
  service_comments: z.string()
    .min(1, { message: "Comentários de serviço são obrigatórios" })
    .max(5000, { message: "Comentários muito longos (máx 5000 caracteres)" })
    .transform(val => sanitizeHTML(val)),
  considerations: z.string()
    .max(2000, { message: "Considerações muito longas (máx 2000 caracteres)" })
    .transform(val => sanitizeHTML(val || ''))
    .optional(),
  observations: z.string()
    .max(2000, { message: "Observações muito longas (máx 2000 caracteres)" })
    .transform(val => sanitizeHTML(val || ''))
    .optional(),
  receiver: z.string()
    .transform(val => sanitizeText(val || ''))
    .optional(),
  responsible: z.string()
    .transform(val => sanitizeText(val || ''))
    .optional(),
});

// Schema de validação para peças do relatório
export const reportPartSchema = z.object({
  withdrawal_id: z.string().uuid({ message: "ID de retirada é obrigatório" }),
  product_id: z.string().uuid({ message: "Produto é obrigatório" }),
  quantity_used: z.number().min(1, { message: "Quantidade deve ser maior que zero" }),
  quantity_withdrawn: z.number().min(1, { message: "Quantidade retirada é obrigatória" }),
});
