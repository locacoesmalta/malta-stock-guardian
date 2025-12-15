import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { assetEditSchema, type AssetEditFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useRealtimeDuplicateDetection } from "@/hooks/useRealtimeDuplicateDetection";
import { RealtimeDuplicateAlert } from "@/components/RealtimeDuplicateAlert";
import { normalizeText } from "@/lib/textNormalization";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AssetEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const form = useForm<AssetEditFormData>({
    resolver: zodResolver(assetEditSchema),
    defaultValues: {
      manufacturer: "",
      model: "",
      serial_number: "",
      supplier: "",
      purchase_date: "",
      comments: "",
    },
  });

  // Validação em tempo real
  const manufacturerValidation = useRealtimeDuplicateDetection(
    form.watch('manufacturer') || '',
    'assets',
    'manufacturer'
  );

  const modelValidation = useRealtimeDuplicateDetection(
    form.watch('model') || '',
    'assets',
    'model'
  );

  useEffect(() => {
    if (asset) {
      form.reset({
        manufacturer: asset.manufacturer || "",
        model: asset.model || "",
        serial_number: asset.serial_number || "",
        voltage_combustion: asset.voltage_combustion as any,
        supplier: asset.supplier || "",
        purchase_date: asset.purchase_date || "",
        unit_value: asset.unit_value || undefined,
        equipment_condition: asset.equipment_condition as any,
        manual_attachment: asset.manual_attachment || "",
        exploded_drawing_attachment: asset.exploded_drawing_attachment || "",
        comments: asset.comments || "",
        physical_location: asset.physical_location || "",
      });
    }
  }, [asset, form]);

  const onSubmit = async (data: AssetEditFormData) => {
    if (!asset || !user) return;

    // 🔒 FASE 2.1: Bloquear edição se equipamento foi substituído
    if (asset.was_replaced || asset.locked_for_manual_edit) {
      toast.error(
        "❌ Este equipamento não pode ser editado porque foi substituído. " +
        "Edições de equipamentos substituídos são bloqueadas para manter a integridade do histórico."
      );
      return;
    }

    try {
      // Preparar dados para atualização, convertendo strings vazias em null
      const updateData: any = { ...data };
      
      // Converter strings vazias em null
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === "" || updateData[key] === undefined) {
          updateData[key] = null;
        }
      });

      // Atualizar asset
      const { error: updateError } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // O histórico é registrado automaticamente pelo trigger log_asset_changes
      
      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });
      
      toast.success("Cadastro atualizado com sucesso");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao atualizar cadastro:", error);
      toast.error("Erro ao atualizar cadastro");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!asset) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate(`/assets/view/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Editar Cadastro</h1>
          <p className="text-muted-foreground">{asset.equipment_name} - PAT: {asset.asset_code}</p>
        </div>
      </div>

      {/* 🔒 FASE 2.1: Aviso de bloqueio para equipamentos substituídos */}
      {(asset.was_replaced || asset.locked_for_manual_edit) && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Equipamento Bloqueado para Edição</AlertTitle>
          <AlertDescription>
            Este equipamento foi substituído e não pode mais ser editado. 
            Isso garante a integridade do histórico de movimentações e substituições.
            {asset.replaced_by_asset_id && (
              <p className="mt-2">
                Equipamento substituto: <strong>{asset.replaced_by_asset_id}</strong>
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

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
                  onChange={(e) => {
                    const normalized = e.target.value.toUpperCase();
                    form.setValue("manufacturer", normalized);
                  }}
                  value={form.watch("manufacturer")?.toUpperCase() || ""}
                />
                {form.formState.errors.manufacturer && (
                  <p className="text-sm text-destructive">{form.formState.errors.manufacturer.message}</p>
                )}
                <RealtimeDuplicateAlert
                  duplicates={manufacturerValidation.data?.duplicates}
                  suggestion={manufacturerValidation.data?.suggestedValue}
                  needsNormalization={manufacturerValidation.data?.needsNormalization}
                  onApply={(value) => form.setValue('manufacturer', value)}
                  fieldName="fabricante"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  {...form.register("model")}
                  placeholder="Ex: GSR 12V-15"
                  onChange={(e) => {
                    const normalized = e.target.value.toUpperCase();
                    form.setValue("model", normalized || undefined);
                  }}
                  value={form.watch("model")?.toUpperCase() || ""}
                />
                <RealtimeDuplicateAlert
                  duplicates={modelValidation.data?.duplicates}
                  suggestion={modelValidation.data?.suggestedValue}
                  needsNormalization={modelValidation.data?.needsNormalization}
                  onApply={(value) => form.setValue('model', value)}
                  fieldName="modelo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Número de Série</Label>
                <Input
                  id="serial_number"
                  {...form.register("serial_number")}
                  placeholder="Ex: 123456789"
                  onChange={(e) => {
                    const normalized = e.target.value.toUpperCase();
                    form.setValue("serial_number", normalized || undefined);
                  }}
                  value={form.watch("serial_number")?.toUpperCase() || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voltage_combustion">Voltagem/Combustível</Label>
                <Input
                  id="voltage_combustion"
                  placeholder="Ex: 110V, 220V, Gasolina, Diesel, Gás"
                  value={form.watch("voltage_combustion")?.toUpperCase() || ""}
                  onChange={(e) => form.setValue("voltage_combustion", e.target.value.toUpperCase() || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  {...form.register("supplier")}
                  placeholder="Ex: Fornecedor ABC"
                  onChange={(e) => {
                    const normalized = e.target.value.toUpperCase();
                    form.setValue("supplier", normalized || undefined);
                  }}
                  value={form.watch("supplier")?.toUpperCase() || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Data de Compra</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...form.register("purchase_date")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_value">Valor Unitário</Label>
                <Input
                  id="unit_value"
                  type="number"
                  step="0.01"
                  {...form.register("unit_value", { 
                    setValueAs: (v) => v === "" || isNaN(v) ? undefined : parseFloat(v)
                  })}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_condition">Condição</Label>
                <Select
                  value={form.watch("equipment_condition") || "_NONE_"}
                  onValueChange={(value) => form.setValue("equipment_condition", value === "_NONE_" ? undefined : value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_NONE_">Nenhum</SelectItem>
                    <SelectItem value="NOVO">Novo</SelectItem>
                    <SelectItem value="USADO">Usado</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="physical_location">Localização Física (Cidade)</Label>
              <Input
                id="physical_location"
                {...form.register("physical_location")}
                placeholder="Ex: Belém, Marabá, Tucuruí"
                onChange={(e) => {
                  const normalized = e.target.value.toUpperCase();
                  form.setValue("physical_location", normalized || undefined);
                }}
                value={form.watch("physical_location")?.toUpperCase() || ""}
              />
              <p className="text-xs text-muted-foreground">
                Cidade onde o equipamento está fisicamente localizado
              </p>
            </div>

            {/* Seção de Registro Retroativo */}
            <div className="space-y-4 border-t pt-4 mt-4">
              <div>
                <Label className="text-base font-semibold">Informações de Registro Retroativo</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Use estes campos se o equipamento foi registrado após sua entrada real no sistema
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effective_registration_date">Data Real de Entrada</Label>
                  <Input
                    id="effective_registration_date"
                    type="date"
                    defaultValue={asset.effective_registration_date || ""}
                    onChange={(e) => form.setValue("effective_registration_date" as any, e.target.value || undefined)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se deixar em branco, será considerada a data de criação do cadastro
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retroactive_registration_notes">Justificativa de Registro Retroativo</Label>
                  <Textarea
                    id="retroactive_registration_notes"
                    defaultValue={asset.retroactive_registration_notes || ""}
                    onChange={(e) => form.setValue("retroactive_registration_notes" as any, e.target.value || undefined)}
                    placeholder="Motivo do cadastro tardio..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/assets/view/${id}`)}
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
