import { z } from "zod";

// Schema de validação para retiradas de material
export const withdrawalSchema = z.object({
  product_id: z.string().uuid({ message: "Produto é obrigatório" }),
  quantity: z.number().min(1, { message: "Quantidade deve ser maior que zero" }),
  withdrawal_date: z.string().min(1, { message: "Data de retirada é obrigatória" }),
  withdrawal_reason: z.string().optional(),
});

// Schema de validação para relatórios
export const reportSchema = z.object({
  equipment_code: z.string().min(1, { message: "PAT é obrigatório" }),
  equipment_name: z.string().min(1, { message: "Nome do equipamento é obrigatório" }),
  work_site: z.string().min(1, { message: "Obra é obrigatória" }),
  company: z.string().min(1, { message: "Cliente é obrigatório" }),
  technician_name: z.string().min(1, { message: "Técnico responsável é obrigatório" }),
  report_date: z.string().min(1, { message: "Data do relatório é obrigatória" }),
  service_comments: z.string().min(1, { message: "Comentários de serviço são obrigatórios" }),
  considerations: z.string().optional(),
  observations: z.string().optional(),
  receiver: z.string().optional(),
  responsible: z.string().optional(),
});

// Schema de validação para peças do relatório
export const reportPartSchema = z.object({
  withdrawal_id: z.string().uuid({ message: "ID de retirada é obrigatório" }),
  product_id: z.string().uuid({ message: "Produto é obrigatório" }),
  quantity_used: z.number().min(1, { message: "Quantidade deve ser maior que zero" }),
  quantity_withdrawn: z.number().min(1, { message: "Quantidade retirada é obrigatória" }),
});
