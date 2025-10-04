import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { assetEditSchema, type AssetEditFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

// Tipos para o asset do banco de dados
interface AssetData {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  voltage_combustion: "110V" | "220V" | "GASOLINA" | "DIESEL" | "GÁS" | null;
  supplier: string | null;
  purchase_date: string | null;
  unit_value: number | null;
  equipment_condition: "NOVO" | "USADO" | null;
  manual_attachment: string | null;
  exploded_drawing_attachment: string | null;
  comments: string | null;
  location_type: string;
  rental_company: string | null;
  rental_work_site: string | null;
  rental_start_date: string | null;
  rental_end_date: string | null;
  deposito_description: string | null;
  available_for_rental: boolean | null;
  maintenance_company: string | null;
  maintenance_work_site: string | null;
  maintenance_description: string | null;
  maintenance_arrival_date: string | null;
  maintenance_departure_date: string | null;
  maintenance_delay_observations: string | null;
  returns_to_work_site: boolean | null;
  was_replaced: boolean | null;
  replaced_by_asset_id: string | null;
  replacement_reason: string | null;
  is_new_equipment: boolean | null;
  destination_after_maintenance: string | null;
  equipment_observations: string | null;
  malta_collaborator: string | null;
  inspection_start_date: string | null;
  created_at: string;
}

export default function AssetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ["asset", id],
    queryFn: async (): Promise<AssetData> => {
      if (!id) throw new Error("ID do asset não fornecido");
      
      const { data, error } = await supabase
        .from("assets")
        .select(`
          id,
          asset_code,
          equipment_name,
          manufacturer,
          model,
          serial_number,
          voltage_combustion,
          supplier,
          purchase_date,
          unit_value,
          equipment_condition,
          manual_attachment,
          exploded_drawing_attachment,
          comments,
          location_type,
          rental_company,
          rental_work_site,
          rental_start_date,
          rental_end_date,
          deposito_description,
          available_for_rental,
          maintenance_company,
          maintenance_work_site,
          maintenance_description,
          maintenance_arrival_date,
          maintenance_departure_date,
          maintenance_delay_observations,
          returns_to_work_site,
          was_replaced,
          replaced_by_asset_id,
          replacement_reason,
          is_new_equipment,
          destination_after_maintenance,
          equipment_observations,
          malta_collaborator,
          inspection_start_date,
          created_at
        `)
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Erro ao buscar asset:", error);
        throw new Error(`Erro ao carregar dados do equipamento: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Equipamento não encontrado");
      }
      
      return data as AssetData;
    },
    enabled: !!id,
    retry: 1,
  });

  const form = useForm<AssetEditFormData>({
    resolver: zodResolver(assetEditSchema),
    defaultValues: {
      manufacturer: "",
      model: "",
      serial_number: "",
      voltage_combustion: undefined,
      supplier: "",
      purchase_date: "",
      unit_value: undefined,
      equipment_condition: undefined,
      manual_attachment: "",
      exploded_drawing_attachment: "",
      comments: "",
    },
  });

  // Função para resetar o formulário com dados do asset
  const resetFormWithAssetData = useCallback((assetData: AssetData) => {
    form.reset({
      manufacturer: assetData.manufacturer || "",
      model: assetData.model || "",
      serial_number: assetData.serial_number || "",
      voltage_combustion: assetData.voltage_combustion || undefined,
      supplier: assetData.supplier || "",
      purchase_date: assetData.purchase_date || "",
      unit_value: assetData.unit_value || undefined,
      equipment_condition: assetData.equipment_condition || undefined,
      manual_attachment: assetData.manual_attachment || "",
      exploded_drawing_attachment: assetData.exploded_drawing_attachment || "",
      comments: assetData.comments || "",
    });
  }, [form]);

  useEffect(() => {
    if (asset) {
      resetFormWithAssetData(asset);
    }
  }, [asset, resetFormWithAssetData]);

  // Função para comparar valores de forma segura
  const compareValues = (oldValue: any, newValue: any): boolean => {
    // Tratar valores null/undefined como strings vazias para comparação
    const normalizeValue = (value: any): string => {
      if (value === null || value === undefined) return "";
      return String(value);
    };

    return normalizeValue(oldValue) !== normalizeValue(newValue);
  };

  const onSubmit = async (data: AssetEditFormData) => {
    if (!asset || !user || !id) {
      toast.error("Dados necessários não disponíveis");
      return;
    }

    try {
      const changes: Record<string, { old: any; new: any }> = {};

      // Detectar mudanças de forma mais robusta
      (Object.keys(data) as Array<keyof AssetEditFormData>).forEach((key) => {
        const oldValue = asset[key];
        const newValue = data[key];
        
        if (compareValues(oldValue, newValue)) {
          changes[key] = { old: oldValue, new: newValue };
        }
      });

      // Se não há mudanças, não fazer nada
      if (Object.keys(changes).length === 0) {
        toast.info("Nenhuma alteração detectada");
        return;
      }

      // Atualizar asset
      const { error: updateError } = await supabase
        .from("assets")
        .update(data)
        .eq("id", id);

      if (updateError) {
        console.error("Erro ao atualizar asset:", updateError);
        throw new Error(`Erro ao atualizar equipamento: ${updateError.message}`);
      }

      // Registrar cada alteração no histórico
      const fieldLabels: Record<string, string> = {
        manufacturer: "Fabricante",
        model: "Modelo",
        serial_number: "Número de Série",
        voltage_combustion: "Voltagem/Combustível",
        supplier: "Fornecedor",
        purchase_date: "Data de Compra",
        unit_value: "Valor Unitário",
        equipment_condition: "Condição do Equipamento",
        manual_attachment: "Manual",
        exploded_drawing_attachment: "Desenho Explodido",
        comments: "Comentários",
      };

      // Registrar eventos de forma sequencial para evitar problemas de concorrência
      for (const [fieldName, { old: oldValue, new: newValue }] of Object.entries(changes)) {
        try {
          await registrarEvento({
            patId: asset.id,
            codigoPat: asset.asset_code,
            tipoEvento: "ALTERAÇÃO DE DADO",
            detalhesEvento: `Campo ${fieldLabels[fieldName] || fieldName} alterado`,
            campoAlterado: fieldLabels[fieldName] || fieldName,
            valorAntigo: String(oldValue || ""),
            valorNovo: String(newValue || ""),
          });
        } catch (historyError) {
          console.error(`Erro ao registrar histórico para campo ${fieldName}:`, historyError);
          // Continuar mesmo se houver erro no histórico
        }
      }

      // Invalidar queries para atualizar dados
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["asset", id] }),
        queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] }),
      ]);
      
      toast.success("Cadastro atualizado com sucesso");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao atualizar cadastro:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(`Erro ao atualizar cadastro: ${errorMessage}`);
    }
  };

  // Tratamento de estados de loading e erro
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-lg">Carregando dados do equipamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <p className="text-lg text-destructive">
            {error instanceof Error ? error.message : "Erro ao carregar equipamento"}
          </p>
          <Button onClick={() => navigate("/assets")} variant="outline">
            Voltar para Lista de Equipamentos
          </Button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
          <p className="text-lg">Equipamento não encontrado</p>
          <Button onClick={() => navigate("/assets")} variant="outline">
            Voltar para Lista de Equipamentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/assets/view/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Editar Cadastro</h1>
          <p className="text-muted-foreground">{asset.equipment_name} - PAT: {asset.asset_code}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados Cadastrais</CardTitle>
          <p className="text-sm text-muted-foreground">
            Edite apenas os dados técnicos e cadastrais do equipamento
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante *</Label>
                <Input
                  id="manufacturer"
                  {...form.register("manufacturer")}
                  placeholder="Ex: Bosch"
                />
                {form.formState.errors.manufacturer && (
                  <p className="text-sm text-destructive">{form.formState.errors.manufacturer.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  {...form.register("model")}
                  placeholder="Ex: GSR 12V-15"
                />
                {form.formState.errors.model && (
                  <p className="text-sm text-destructive">{form.formState.errors.model.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Número de Série</Label>
                <Input
                  id="serial_number"
                  {...form.register("serial_number")}
                  placeholder="Ex: 123456789"
                />
                {form.formState.errors.serial_number && (
                  <p className="text-sm text-destructive">{form.formState.errors.serial_number.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="voltage_combustion">Voltagem/Combustível</Label>
                <Select
                  value={form.watch("voltage_combustion") || ""}
                  onValueChange={(value) => {
                    if (value === "") {
                      form.setValue("voltage_combustion", undefined);
                    } else {
                      form.setValue("voltage_combustion", value as "110V" | "220V" | "GASOLINA" | "DIESEL" | "GÁS");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    <SelectItem value="110V">110V</SelectItem>
                    <SelectItem value="220V">220V</SelectItem>
                    <SelectItem value="GASOLINA">Gasolina</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="GÁS">Gás</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.voltage_combustion && (
                  <p className="text-sm text-destructive">{form.formState.errors.voltage_combustion.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  {...form.register("supplier")}
                  placeholder="Ex: Fornecedor ABC"
                />
                {form.formState.errors.supplier && (
                  <p className="text-sm text-destructive">{form.formState.errors.supplier.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Data de Compra</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...form.register("purchase_date")}
                />
                {form.formState.errors.purchase_date && (
                  <p className="text-sm text-destructive">{form.formState.errors.purchase_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_value">Valor Unitário</Label>
                <Input
                  id="unit_value"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("unit_value", { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === "" ? undefined : Number(value)
                  })}
                  placeholder="0,00"
                />
                {form.formState.errors.unit_value && (
                  <p className="text-sm text-destructive">{form.formState.errors.unit_value.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_condition">Condição</Label>
                <Select
                  value={form.watch("equipment_condition") || ""}
                  onValueChange={(value) => {
                    if (value === "") {
                      form.setValue("equipment_condition", undefined);
                    } else {
                      form.setValue("equipment_condition", value as "NOVO" | "USADO");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    <SelectItem value="NOVO">Novo</SelectItem>
                    <SelectItem value="USADO">Usado</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.equipment_condition && (
                  <p className="text-sm text-destructive">{form.formState.errors.equipment_condition.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comentários</Label>
              <Textarea
                id="comments"
                {...form.register("comments")}
                placeholder="Observações adicionais..."
                rows={3}
              />
              {form.formState.errors.comments && (
                <p className="text-sm text-destructive">{form.formState.errors.comments.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="min-w-[120px]"
              >
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/assets/view/${id}`)}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
