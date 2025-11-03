import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HourmeterInput } from "./HourmeterInput";
import { ProductSearchCombobox } from "./ProductSearchCombobox";
import { Plus, Save } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { MaintenanceData, MaintenancePart } from "@/hooks/useAssetMaintenances";

const maintenanceSchema = z.object({
  maintenance_date: z.string().min(1, "Data é obrigatória"),
  maintenance_type: z.enum(["preventiva", "corretiva"]),
  previous_hourmeter: z.number().min(0, "Horímetro anterior inválido"),
  current_hourmeter: z.number().min(0, "Horímetro atual inválido"),
  services_performed: z.string().min(10, "Descreva os serviços realizados (mínimo 10 caracteres)"),
  observations: z.string().optional(),
  technician_name: z.string().optional(),
  labor_cost: z.number().min(0).optional(),
}).refine((data) => data.current_hourmeter > data.previous_hourmeter, {
  message: "Horímetro atual deve ser maior que o anterior",
  path: ["current_hourmeter"],
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface AssetMaintenanceFormProps {
  assetId: string;
  lastHourmeter?: number;
  onSubmit: (data: MaintenanceData) => void;
  isLoading?: boolean;
}

export function AssetMaintenanceForm({
  assetId,
  lastHourmeter = 0,
  onSubmit,
  isLoading,
}: AssetMaintenanceFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedParts, setSelectedParts] = useState<MaintenancePart[]>([]);
  const [previousHourmeter, setPreviousHourmeter] = useState(lastHourmeter);
  const [currentHourmeter, setCurrentHourmeter] = useState(lastHourmeter);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [partQuantity, setPartQuantity] = useState(1);
  const [partCost, setPartCost] = useState(0);
  
  const { products } = useProducts();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenance_date: new Date().toISOString().split("T")[0],
      maintenance_type: "preventiva",
      previous_hourmeter: lastHourmeter,
      current_hourmeter: lastHourmeter,
      labor_cost: 0,
    },
  });

  const maintenanceType = watch("maintenance_type");

  const handleFormSubmit = (data: MaintenanceFormData) => {
    const maintenanceData: MaintenanceData = {
      asset_id: assetId,
      maintenance_date: data.maintenance_date,
      maintenance_type: data.maintenance_type,
      previous_hourmeter: data.previous_hourmeter,
      current_hourmeter: data.current_hourmeter,
      services_performed: data.services_performed,
      observations: data.observations,
      technician_name: data.technician_name,
      labor_cost: data.labor_cost,
      parts: selectedParts,
    };
    
    onSubmit(maintenanceData);
    
    setOpen(false);
    reset();
    setSelectedParts([]);
  };

  const addPart = () => {
    if (!selectedProductId || partQuantity <= 0) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    const newPart: MaintenancePart = {
      product_id: selectedProductId,
      quantity: partQuantity,
      unit_cost: partCost,
    };
    
    setSelectedParts([...selectedParts, newPart]);
    setSelectedProductId("");
    setPartQuantity(1);
    setPartCost(0);
  };

  const removePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const totalPartsCost = selectedParts.reduce(
    (sum, part) => sum + part.quantity * part.unit_cost,
    0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Manutenção
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Manutenção</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance_date">Data da Manutenção</Label>
              <Input
                id="maintenance_date"
                type="date"
                {...register("maintenance_date")}
              />
              {errors.maintenance_date && (
                <p className="text-sm text-destructive">
                  {errors.maintenance_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type">Tipo de Manutenção</Label>
              <Select
                defaultValue="preventiva"
                onValueChange={(value) =>
                  setValue("maintenance_type", value as "preventiva" | "corretiva")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <HourmeterInput
              label="Horímetro Anterior"
              value={previousHourmeter}
              onChange={(value) => {
                setPreviousHourmeter(value);
                setValue("previous_hourmeter", value);
              }}
              error={errors.previous_hourmeter?.message}
            />

            <HourmeterInput
              label="Horímetro Atual"
              value={currentHourmeter}
              onChange={(value) => {
                setCurrentHourmeter(value);
                setValue("current_hourmeter", value);
              }}
              error={errors.current_hourmeter?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="services_performed">Serviços Realizados *</Label>
            <Textarea
              id="services_performed"
              {...register("services_performed")}
              placeholder="Descreva os serviços realizados na manutenção..."
              rows={3}
            />
            {errors.services_performed && (
              <p className="text-sm text-destructive">
                {errors.services_performed.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              {...register("observations")}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="technician_name">Nome do Técnico</Label>
              <Input
                id="technician_name"
                {...register("technician_name")}
                placeholder="Nome do técnico responsável"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor_cost">Custo de Mão de Obra (R$)</Label>
              <Input
                id="labor_cost"
                type="number"
                step="0.01"
                {...register("labor_cost", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Peças Utilizadas</Label>
            
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Label htmlFor="product">Produto</Label>
                <ProductSearchCombobox
                  products={products}
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                  placeholder="Selecione um produto"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="quantity">Qtd</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={partQuantity}
                  onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="col-span-3">
                <Label htmlFor="unit_cost">Custo Unitário</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={partCost}
                  onChange={(e) => setPartCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="col-span-2">
                <Button
                  type="button"
                  onClick={addPart}
                  disabled={!selectedProductId || partQuantity <= 0}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedParts.length > 0 && (
              <div className="border rounded-md p-4 space-y-2">
                {selectedParts.map((part, index) => {
                  const product = products.find(p => p.id === part.product_id);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex-1">{product?.name || 'Produto não encontrado'}</span>
                      <span className="w-16 text-center">Qtd: {part.quantity}</span>
                      <span className="w-24 text-right">R$ {(part.quantity * part.unit_cost).toFixed(2)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePart(index)}
                      >
                        Remover
                      </Button>
                    </div>
                  );
                })}
                <div className="border-t pt-2 font-semibold text-right">
                  Total Peças: R$ {totalPartsCost.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Manutenção
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
