import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { getTodayLocalDate } from "@/lib/dateUtils";
import {
  assetReplacementSchema,
  type AssetReplacementFormData,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function AssetReplacement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();

  const [substituteAssetCode, setSubstituteAssetCode] = useState("");
  const [substituteAsset, setSubstituteAsset] = useState<any>(null);
  const [loadingSubstitute, setLoadingSubstitute] = useState(false);
  const [substituteNotFound, setSubstituteNotFound] = useState(false);

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

  const form = useForm<AssetReplacementFormData>({
    resolver: zodResolver(assetReplacementSchema),
  });

  // Buscar equipamento substituto quando digitar PAT
  const handleSearchSubstitute = async () => {
    if (!substituteAssetCode.trim()) {
      toast.error("Digite o PAT do equipamento substituto");
      return;
    }

    // Formatar PAT com 6 dígitos (adicionar zeros à esquerda)
    const formattedPAT = substituteAssetCode.trim().padStart(6, '0');
    setSubstituteAssetCode(formattedPAT);

    setLoadingSubstitute(true);
    setSubstituteNotFound(false);
    setSubstituteAsset(null);

    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_code", formattedPAT)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSubstituteNotFound(true);
        toast.error(`Equipamento ${formattedPAT} não encontrado no sistema. Cadastre o equipamento antes de continuar.`);
        return;
      }

      // Validar se equipamento está no Depósito Malta
      const statusLabels: Record<string, string> = {
        locacao: "Locação",
        em_manutencao: "Manutenção",
        aguardando_laudo: "Aguardando Laudo",
        deposito_malta: "Depósito Malta",
      };

      if (data.location_type !== "deposito_malta") {
        const currentStatus = statusLabels[data.location_type] || data.location_type;
        setSubstituteNotFound(true);
        toast.error(`Equipamento ${formattedPAT} está em "${currentStatus}". Para substituição, o equipamento deve estar no Depósito Malta.`);
        return;
      }

      // Validar se o nome do equipamento é o mesmo
      if (asset && data.equipment_name !== asset.equipment_name) {
        toast.error(`Atenção: Você está substituindo "${asset.equipment_name}" por "${data.equipment_name}". Recomendamos substituir por equipamento do mesmo tipo.`);
        setSubstituteNotFound(true);
        return;
      }

      setSubstituteAsset(data);
      form.setValue("replaced_by_asset_id", data.id);
      toast.success(`Equipamento ${formattedPAT} encontrado e disponível!`);
    } catch (error) {
      console.error("Erro ao buscar equipamento:", error);
      toast.error("Erro ao buscar equipamento no banco de dados");
      setSubstituteNotFound(true);
    } finally {
      setLoadingSubstitute(false);
    }
  };

  const onSubmit = async (data: AssetReplacementFormData) => {
    if (!asset) return;

    if (!substituteAsset) {
      toast.error("Busque e valide o equipamento substituto antes de continuar");
      return;
    }

    try {
      // Capturar dados do equipamento antigo ANTES de qualquer update
      const oldAssetData = {
        location_type: asset.location_type,
        rental_company: asset.rental_company,
        rental_work_site: asset.rental_work_site,
        rental_start_date: asset.rental_start_date,
        rental_end_date: asset.rental_end_date,
        rental_contract_number: asset.rental_contract_number,
        maintenance_company: asset.maintenance_company,
        maintenance_work_site: asset.maintenance_work_site,
        maintenance_arrival_date: asset.maintenance_arrival_date,
        maintenance_departure_date: asset.maintenance_departure_date,
        available_for_rental: asset.available_for_rental,
      };

      const today = getTodayLocalDate();

      // Atualizar equipamento ANTIGO - vai para AGUARDANDO LAUDO
      const { error: oldAssetError } = await supabase
        .from("assets")
        .update({
          was_replaced: true,
          replaced_by_asset_id: substituteAsset.id,
          replacement_reason: data.replacement_reason,
          available_for_rental: false,
          location_type: "aguardando_laudo",
          // MANTÉM dados de locação - não limpa o histórico
        })
        .eq("id", id);

      if (oldAssetError) throw oldAssetError;

      // Atualizar equipamento NOVO - HERDA o status do antigo
      const { error: newAssetError } = await supabase
        .from("assets")
        .update({
          location_type: oldAssetData.location_type, // HERDA do equipamento antigo
          rental_company: oldAssetData.rental_company,
          rental_work_site: oldAssetData.rental_work_site,
          rental_start_date: oldAssetData.location_type === 'locacao' ? today : null,
          rental_end_date: oldAssetData.rental_end_date,
          rental_contract_number: oldAssetData.rental_contract_number,
          maintenance_company: oldAssetData.maintenance_company,
          maintenance_work_site: oldAssetData.maintenance_work_site,
          maintenance_arrival_date: oldAssetData.location_type === 'em_manutencao' ? today : null,
          maintenance_departure_date: null,
          available_for_rental: true,
        })
        .eq("id", substituteAsset.id);

      if (newAssetError) throw newAssetError;

      // Determinar localização para os eventos
      const locationInfo = oldAssetData.location_type === 'locacao' 
        ? `Locação - ${oldAssetData.rental_company} / ${oldAssetData.rental_work_site}`
        : oldAssetData.location_type === 'em_manutencao'
        ? `Manutenção - ${oldAssetData.maintenance_company} / ${oldAssetData.maintenance_work_site}`
        : oldAssetData.location_type === 'deposito_malta'
        ? 'Depósito Malta'
        : 'Aguardando Laudo';

      const statusName = oldAssetData.location_type === 'locacao' 
        ? 'Locação'
        : oldAssetData.location_type === 'em_manutencao'
        ? 'Manutenção'
        : oldAssetData.location_type === 'deposito_malta'
        ? 'Depósito Malta'
        : 'Aguardando Laudo';

      // Registrar evento no ANTIGO
      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "SUBSTITUIÇÃO",
        detalhesEvento: `Substituído pelo PAT ${substituteAsset.asset_code} e enviado para Aguardando Laudo. Estava em ${locationInfo}. Motivo: ${data.replacement_reason}${data.decision_notes ? `. Obs: ${data.decision_notes}` : ""}`,
      });

      // Registrar evento no NOVO
      await registrarEvento({
        patId: substituteAsset.id,
        codigoPat: substituteAsset.asset_code,
        tipoEvento: "SUBSTITUIÇÃO",
        detalhesEvento: `Substituiu o PAT ${asset.asset_code} e assumiu sua posição em ${locationInfo}. Saiu do Depósito Malta para ${statusName}. Data de início ajustada para ${today.split('-').reverse().join('/')}. Equipamento anterior foi para Aguardando Laudo. Motivo: ${data.replacement_reason}${data.decision_notes ? `. Obs: ${data.decision_notes}` : ""}`,
      });

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", substituteAsset.id] });

      toast.success("Substituição registrada com sucesso");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao registrar substituição:", error);
      toast.error("Erro ao registrar substituição");
    }
  };

  if (assetLoading) {
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
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate(`/assets/post-inspection/${id}`)}>
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
            {/* Buscar PAT Substituto */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-base font-semibold">Equipamento Substituto</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Digite o PAT (ex: 1812 ou 001812)"
                    value={substituteAssetCode}
                    onChange={(e) => {
                      // Aceitar apenas números
                      const value = e.target.value.replace(/\D/g, '');
                      setSubstituteAssetCode(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubstitute();
                      }
                    }}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O sistema formatará automaticamente com 6 dígitos
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleSearchSubstitute}
                  disabled={loadingSubstitute}
                >
                  {loadingSubstitute ? "Buscando..." : "Buscar"}
                </Button>
              </div>

              {substituteNotFound && (
                <div className="p-3 border border-destructive bg-destructive/10 rounded-md">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Equipamento não disponível para substituição
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verifique o status do equipamento ou cadastre um novo
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 mt-2 text-sm"
                    onClick={() => navigate("/assets/register")}
                  >
                    Cadastrar novo equipamento →
                  </Button>
                </div>
              )}

              {substituteAsset && (
                <div className="p-4 bg-background border rounded-lg space-y-2">
                  <p className="font-medium text-green-600">✓ Equipamento encontrado</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">PAT:</span> {substituteAsset.asset_code}</p>
                    <p><span className="font-medium">Nome:</span> {substituteAsset.equipment_name}</p>
                    <p><span className="font-medium">Fabricante:</span> {substituteAsset.manufacturer}</p>
                    {substituteAsset.model && (
                      <p><span className="font-medium">Modelo:</span> {substituteAsset.model}</p>
                    )}
                  </div>
                </div>
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
              <Button type="submit" disabled={form.formState.isSubmitting || !substituteAsset}>
                {form.formState.isSubmitting ? "Registrando..." : "Confirmar Substituição"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/assets/post-inspection/${id}`);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!substituteAsset && (
        <Card className="mt-4 bg-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Para realizar a substituição, busque um equipamento disponível no Depósito Malta usando o campo acima.
              O sistema validará automaticamente se o equipamento é do mesmo tipo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
