import { z } from "zod";

// Schema para validação de CPF
export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido. Use o formato: 000.000.000-00")
  .refine(
    (cpf) => {
      // Remove pontos e traços
      const numbers = cpf.replace(/\D/g, "");
      
      // Valida se tem 11 dígitos
      if (numbers.length !== 11) return false;
      
      // Valida se não são todos dígitos iguais
      if (/^(\d)\1+$/.test(numbers)) return false;
      
      // Validação do primeiro dígito verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers[i]) * (10 - i);
      }
      let remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(numbers[9])) return false;
      
      // Validação do segundo dígito verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(numbers[i]) * (11 - i);
      }
      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(numbers[10])) return false;
      
      return true;
    },
    { message: "CPF inválido" }
  );

// Schema para validação de telefone/WhatsApp
export const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inválido. Use o formato: (00) 00000-0000")
  .optional();

// Schema para item de recibo
export const receiptItemSchema = z.object({
  quantity: z.number().min(1, "Quantidade deve ser no mínimo 1"),
  specification: z.string().min(3, "Especificação deve ter no mínimo 3 caracteres"),
  photos: z.array(z.string()).min(1, "Adicione pelo menos 1 foto do equipamento"),
  patCode: z.string().optional(),
});

// Schema principal do recibo
export const receiptFormSchema = z.object({
  clientName: z.string().min(3, "Nome do cliente deve ter no mínimo 3 caracteres"),
  workSite: z.string().min(3, "Nome da obra deve ter no mínimo 3 caracteres"),
  operationNature: z.string().optional(),
  receivedBy: z.string().min(3, "Nome do responsável deve ter no mínimo 3 caracteres"),
  receivedByCpf: cpfSchema,
  whatsapp: phoneSchema,
  maltaOperator: z.string().min(3, "Nome do operador Malta deve ter no mínimo 3 caracteres"),
  receiptDate: z.date(),
  items: z.array(receiptItemSchema).min(1, "Adicione pelo menos 1 item ao recibo"),
  signature: z.string().min(1, "Assinatura é obrigatória"),
});

export type ReceiptFormData = z.infer<typeof receiptFormSchema>;
export type ReceiptItem = z.infer<typeof receiptItemSchema>;
