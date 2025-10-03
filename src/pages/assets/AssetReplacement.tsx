import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import {
  assetReplacementSchema,
  type AssetReplacementFormData,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function AssetReplacement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();

  const { data: asset, isLoading: assetLoading } = useQuery({
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

  const { data: availableAssets, isLoading: assetsLoading } = useQuery({
    queryKey: ["available-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_code, equipment_name, location_type")
        .eq("location_type", "deposito_malta")
        .neq("id", id)
        .order("asset_code");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<AssetReplacementFormData>({
    resolver: zodResolver(assetReplacementSchema),
  });

  const onSubmit = async (data: AssetReplacementFormData) => {
    if (!asset) return;

    try {
      // Buscar dados do equipamento substituto
      const { data: newAsset, error: newAssetError } = await supabase
        .from("assets")
        .select("asset_code")
        .eq("id", data.replaced_by_asset_id)
        .single();

      if (newAssetError) throw newAssetError;

      // Atualizar equipamento ANTIGO
      const { error: oldAssetError } = await supabase
        .from("assets")
        .update({
          was_replaced: true,
          replaced_by_asset_id: data.replaced_by_asset_id,
          replacement_reason: data.replacement_reason,
          available_for_rental: false,
          location_type: "deposito_malta",
          inspection_start_date: null,
        })
        .eq("id", id);

      if (oldAssetError) throw oldAssetError;

      // Registrar evento no ANTIGO
      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "SUBSTITUIÇÃO",
        detalhesEvento: `Substituído pelo PAT ${newAsset.asset_code}. Motivo: ${data.replacement_reason}${data.decision_notes ? `. Observação: ${data.decision_notes}` : ""}`,
      });

      // Registrar evento no NOVO
      await registrarEvento({
        patId: data.replaced_by_asset_id,
        codigoPat: newAsset.asset_code,
        tipoEvento: "SUBSTITUIÇÃO",
        detalhesEvento: `Substituiu o PAT ${asset.asset_code}. Motivo: ${data.replacement_reason}${data.decision_notes ? `. Observação: ${data.decision_notes}` : ""}`,
      });

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", data.replaced_by_asset_id] });

      toast.success("Substituição registrada com sucesso");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao registrar substituição:", error);
      toast.error("Erro ao registrar substituição");
    }
  };

  if (assetLoading || assetsLoading) {
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
        <Button variant="ghost" size="icon" onClick={() => navigate(`/assets/post-inspection/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Substituição de Equipamento</h1>
          <p className="text-muted-foreground">
            PAT Antigo: {asset.asset_code} - {asset.equipment_name}
          </p>
        </div>
        <Badge variant="outline">Substituição</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple-500" />
            Selecionar Equipamento Substituto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="replaced_by_asset_id">Equipamento Substituto *</Label>
              <Select
                onValueChange={(value) => form.setValue("replaced_by_asset_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento substituto" />
                </SelectTrigger>
                <SelectContent>
                  {availableAssets && availableAssets.length > 0 ? (
                    availableAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.asset_code} - {asset.equipment_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      Nenhum equipamento disponível no depósito
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.replaced_by_asset_id && (
                <p className="text-sm text-destructive">{form.formState.errors.replaced_by_asset_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="replacement_reason">Motivo da Substituição *</Label>
              <Textarea
                id="replacement_reason"
                {...form.register("replacement_reason")}
                placeholder="Descreva o motivo da substituição (mínimo 10 caracteres)..."
                rows={4}
              />
              {form.formState.errors.replacement_reason && (
                <p className="text-sm text-destructive">{form.formState.errors.replacement_reason.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="decision_notes">Observações Adicionais</Label>
              <Textarea
                id="decision_notes"
                {...form.register("decision_notes")}
                placeholder="Observações adicionais sobre a substituição..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting || !availableAssets || availableAssets.length === 0}>
                {form.formState.isSubmitting ? "Registrando..." : "Confirmar Substituição"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/assets/post-inspection/${id}`)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {(!availableAssets || availableAssets.length === 0) && (
        <Card className="mt-4 bg-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Não há equipamentos disponíveis no depósito para substituição. 
              Para realizar uma substituição, é necessário ter pelo menos um equipamento no Depósito Malta.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
