import { useEffect } from "react";
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

export default function AssetEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();

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
      });
    }
  }, [asset, form]);

  const onSubmit = async (data: AssetEditFormData) => {
    console.log("=== FORM SUBMIT DEBUG ===");
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Is valid:", form.formState.isValid);
    
    if (!asset || !user) return;

    try {
      const changes: Record<string, { old: any; new: any }> = {};

      // Detectar mudanças
      Object.keys(data).forEach((key) => {
        const oldValue = asset[key as keyof typeof asset];
        const newValue = data[key as keyof AssetEditFormData];
        
        if (oldValue !== newValue) {
          changes[key] = { old: oldValue, new: newValue };
        }
      });

      // Preparar dados para atualização, convertendo strings vazias em null
      const updateData: any = { ...data };
      if (updateData.purchase_date === "") {
        updateData.purchase_date = null;
      }

      // Atualizar asset
      const { error: updateError } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      // Registrar cada alteração no histórico
      for (const [fieldName, { old: oldValue, new: newValue }] of Object.entries(changes)) {
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

        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "ALTERAÇÃO DE DADO",
          detalhesEvento: `Campo ${fieldLabels[fieldName] || fieldName} alterado`,
          campoAlterado: fieldLabels[fieldName] || fieldName,
          valorAntigo: String(oldValue || ""),
          valorNovo: String(newValue || ""),
        });
      }

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
          <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("=== VALIDATION ERRORS ===");
            console.log("Errors:", errors);
            console.log("Form values:", form.getValues());
          })} className="space-y-4">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Número de Série</Label>
                <Input
                  id="serial_number"
                  {...form.register("serial_number")}
                  placeholder="Ex: 123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voltage_combustion">Voltagem/Combustível</Label>
                <Select
                  value={form.watch("voltage_combustion") || ""}
                  onValueChange={(value) => form.setValue("voltage_combustion", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="110V">110V</SelectItem>
                    <SelectItem value="220V">220V</SelectItem>
                    <SelectItem value="GASOLINA">Gasolina</SelectItem>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="GÁS">Gás</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input
                  id="supplier"
                  {...form.register("supplier")}
                  placeholder="Ex: Fornecedor ABC"
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
                  value={form.watch("equipment_condition") || ""}
                  onValueChange={(value) => form.setValue("equipment_condition", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
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
