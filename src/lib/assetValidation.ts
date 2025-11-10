import { z } from "zod";

// Schema para validação de código de patrimônio
export const assetCodeSchema = z
  .string()
  .min(1, "Código PAT é obrigatório")
  .regex(/^PAT-\d{4}$/, "Código deve estar no formato PAT-0000");

// Schema para datas de manutenção
export const maintenanceDatesSchema = z.object({
  maintenanceArrivalDate: z.date().optional(),
  maintenanceDepartureDate: z.date().optional(),
}).refine(
  (data) => {
    if (data.maintenanceArrivalDate && data.maintenanceDepartureDate) {
      return data.maintenanceDepartureDate >= data.maintenanceArrivalDate;
    }
    return true;
  },
  {
    message: "Data de saída não pode ser anterior à data de entrada",
    path: ["maintenanceDepartureDate"],
  }
);

// Schema para datas de locação
export const rentalDatesSchema = z.object({
  rentalStartDate: z.date().optional(),
  rentalEndDate: z.date().optional(),
}).refine(
  (data) => {
    if (data.rentalStartDate && data.rentalEndDate) {
      return data.rentalEndDate >= data.rentalStartDate;
    }
    return true;
  },
  {
    message: "Data final não pode ser anterior à data inicial",
    path: ["rentalEndDate"],
  }
);

// Schema para horímetro
export const hourmeterSchema = z.object({
  previousHourmeter: z.number().min(0, "Horímetro anterior não pode ser negativo"),
  currentHourmeter: z.number().min(0, "Horímetro atual não pode ser negativo"),
}).refine(
  (data) => data.currentHourmeter >= data.previousHourmeter,
  {
    message: "Horímetro atual não pode ser menor que o anterior",
    path: ["currentHourmeter"],
  }
);

// Schema para valores monetários
export const moneySchema = z.number().min(0, "Valor não pode ser negativo");

// Schema principal do asset
export const assetFormSchema = z.object({
  assetCode: assetCodeSchema,
  equipmentName: z.string().min(3, "Nome do equipamento deve ter no mínimo 3 caracteres"),
  manufacturer: z.string().min(2, "Fabricante deve ter no mínimo 2 caracteres"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  locationType: z.enum([
    "deposito_malta",
    "liberado_locacao",
    "locacao",
    "em_manutencao",
    "aguardando_laudo",
  ]),
  purchaseDate: z.date().optional(),
  unitValue: moneySchema.optional(),
});

export type AssetFormData = z.infer<typeof assetFormSchema>;
