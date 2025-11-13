import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { getTodayLocalDate } from "@/lib/dateUtils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const substitutionSchema = z.object({
  substitution_date: z.string().min(1, "Data de substituição é obrigatória"),
  replacement_reason: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres"),
  decision_notes: z.string().optional(),
  replaced_by_asset_id: z.string().uuid().optional(),
});

type SubstitutionFormData = z.infer<typeof substitutionSchema>;

export default function AssetSubstitution() {
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

  const form = useForm<SubstitutionFormData>({
    resolver: zodResolver(substitutionSchema),
    defaultValues: {
      substitution_date: getTodayLocalDate(),
    },
  });

  const handleSearchSubstitute = async () => {
    if (!substituteAssetCode.trim()) {
      toast.error("Digite o PAT do equipamento substituto");
      return;
    }

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
        toast.error(`Equipamento ${formattedPAT} não encontrado no sistema.`);
        return;
      }

      // Validar se é o mesmo equipamento
      if (data.id === asset?.id) {
        setSubstituteNotFound(true);
        toast.error("O equipamento substituto não pode ser o mesmo que está sendo substituído.");
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
        toast.error(`PAT ${formattedPAT} está em "${currentStatus}". Para substituir, deve estar no Depósito Malta.`);
        return;
      }

      // Recomendação (não bloqueia): mesmo tipo de equipamento
      if (asset && data.equipment_name !== asset.equipment_name) {
        toast.warning(`Atenção: Você está substituindo "${asset.equipment_name}" por "${data.equipment_name}". Recomendamos substituir por equipamento do mesmo tipo.`);
      }

      setSubstituteAsset(data);
      form.setValue("replaced_by_asset_id", data.id);
      toast.success(`Equipamento ${formattedPAT} encontrado e disponível! Dados serão herdados automaticamente.`);
    } catch (error) {
      console.error("Erro ao buscar equipamento:", error);
      toast.error("Erro ao buscar equipamento no banco de dados");
      setSubstituteNotFound(true);
    } finally {
      setLoadingSubstitute(false);
    }
  };

  const handleNavigateToCadastro = () => {
    localStorage.setItem('substitution_context', JSON.stringify({
      original_asset_id: asset?.id,
      original_asset_code: asset?.asset_code,
      return_to: `/assets/substitution/${asset?.id}`,
    }));
    navigate('/assets/register');
  };

  const onSubmit = async (data: SubstitutionFormData) => {
    if (!asset) return;

    if (!substituteAsset) {
      toast.error("Busque e valide o equipamento substituto antes de continuar");
      return;
    }

    const substitutionDate = data.substitution_date;
    const substituteCreatedAt = new Date(substituteAsset.created_at).toISOString().split('T')[0];
    const substituteEffectiveDate = substituteAsset.effective_registration_date || substituteCreatedAt;
    
    if (substitutionDate < substituteEffectiveDate) {
      toast.error(`Data de substituição não pode ser anterior ao cadastro do equipamento substituto`);
      return;
    }

    const today = getTodayLocalDate();
    if (substitutionDate > today) {
      toast.error("Data de substituição não pode ser futura");
      return;
    }

    try {
      console.log("🔄 Iniciando substituição...");
      console.log("📦 Equipamento ANTIGO:", { id: asset.id, code: asset.asset_code });
      console.log("📦 Equipamento NOVO:", { id: substituteAsset.id, code: substituteAsset.asset_code });
      
      const inheritedData = {
        location_type: asset.location_type,
        substitution_date: substitutionDate,
        rental_company: asset.rental_company,
        rental_work_site: asset.rental_work_site,
        rental_start_date: asset.location_type === 'locacao' ? substitutionDate : null,
        rental_end_date: asset.rental_end_date,
        rental_contract_number: asset.rental_contract_number,
        maintenance_company: asset.maintenance_company,
        maintenance_work_site: asset.maintenance_work_site,
        maintenance_arrival_date: asset.location_type === 'em_manutencao' ? substitutionDate : null,
      };
      
      console.log("📋 Dados a serem herdados:", inheritedData);

      // 1. Atualizar equipamento ANTIGO → Aguardando Laudo
      console.log("⏳ Atualizando equipamento ANTIGO para aguardando_laudo...");
      const { error: oldAssetError } = await supabase
        .from("assets")
        .update({
          location_type: "aguardando_laudo",
          was_replaced: true,
          replaced_by_asset_id: substituteAsset.id,
          replacement_reason: data.replacement_reason,
          available_for_rental: false,
        })
        .eq("id", id);

      if (oldAssetError) {
        console.error("❌ Erro ao atualizar equipamento ANTIGO:", oldAssetError);
        throw oldAssetError;
      }
      console.log("✅ Equipamento ANTIGO atualizado com sucesso!");

      // 2. Atualizar equipamento NOVO → Herda localização e dados
      console.log("⏳ Atualizando equipamento NOVO com dados herdados...");
      console.log("🔑 ID do equipamento novo:", substituteAsset.id);
      
      const updateData = {
        location_type: inheritedData.location_type,
        substitution_date: inheritedData.substitution_date,
        rental_company: inheritedData.rental_company,
        rental_work_site: inheritedData.rental_work_site,
        rental_start_date: inheritedData.rental_start_date,
        rental_end_date: inheritedData.rental_end_date,
        rental_contract_number: inheritedData.rental_contract_number,
        maintenance_company: inheritedData.maintenance_company,
        maintenance_work_site: inheritedData.maintenance_work_site,
        maintenance_arrival_date: inheritedData.maintenance_arrival_date,
        available_for_rental: true,
      };
      
      console.log("📝 Dados do UPDATE:", updateData);
      
      const { data: updateResult, error: newAssetError } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", substituteAsset.id)
        .select();

      if (newAssetError) {
        console.error("❌ Erro ao atualizar equipamento NOVO:", newAssetError);
        throw newAssetError;
      }
      
      console.log("✅ Equipamento NOVO atualizado:", updateResult);
      
      if (!updateResult || updateResult.length === 0) {
        throw new Error("Nenhum equipamento foi atualizado! Verifique se o ID está correto.");
      }

      // 3. Registrar eventos no histórico
      console.log("⏳ Registrando eventos no histórico...");
      const locationInfo = inheritedData.location_type === 'locacao' 
        ? `${inheritedData.rental_company} / ${inheritedData.rental_work_site}`
        : `${inheritedData.maintenance_company} / ${inheritedData.maintenance_work_site}`;

      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "MOVIMENTAÇÃO",
        campoAlterado: "location_type",
        valorAntigo: inheritedData.location_type,
        valorNovo: "aguardando_laudo",
        detalhesEvento: `Substituído pelo PAT ${substituteAsset.asset_code} em ${format(new Date(), 'dd/MM/yyyy')} e enviado para Aguardando Laudo. Estava em ${inheritedData.location_type === 'locacao' ? 'Locação' : 'Manutenção'} - ${locationInfo}. Motivo: ${data.replacement_reason}${data.decision_notes ? `. Obs: ${data.decision_notes}` : ""}`,
      });

      await registrarEvento({
        patId: substituteAsset.id,
        codigoPat: substituteAsset.asset_code,
        tipoEvento: "MOVIMENTAÇÃO",
        campoAlterado: "location_type",
        valorAntigo: "deposito_malta",
        valorNovo: inheritedData.location_type,
        detalhesEvento: `Substituiu o PAT ${asset.asset_code} em ${format(new Date(), 'dd/MM/yyyy')} e assumiu posição em ${inheritedData.location_type === 'locacao' ? 'Locação' : 'Manutenção'} - ${locationInfo}. Data de início ajustada para hoje (${format(new Date(), 'dd/MM/yyyy')}). Equipamento anterior foi para Aguardando Laudo. Motivo: ${data.replacement_reason}${data.decision_notes ? `. Obs: ${data.decision_notes}` : ""}`,
      });
      
      console.log("✅ Eventos registrados com sucesso!");

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", substituteAsset.id] });

      toast.success(`Substituição concluída! ${asset.asset_code} → Laudo | ${substituteAsset.asset_code} → ${inheritedData.location_type === 'locacao' ? 'Locação' : 'Manutenção'}`);
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("❌ Erro ao registrar substituição:", error);
      toast.error(`Erro ao registrar substituição: ${error.message || 'Erro desconhecido'}`);
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
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate(`/assets/view/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Substituição Integrada de Equipamento</h1>
          <p className="text-muted-foreground">
            PAT Antigo: {asset.asset_code} - {asset.equipment_name}
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
          Substituição
        </Badge>
      </div>

      {/* Alerta informativo do equipamento antigo */}
      <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-700">Equipamento será enviado para Aguardando Laudo</AlertTitle>
        <AlertDescription className="text-yellow-600">
          Após a substituição, o PAT {asset.asset_code} será movido para "Aguardando Laudo" e seu histórico será preservado.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-purple-500" />
            Buscar Equipamento Substituto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Buscar PAT Substituto */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-base font-semibold">Digite o PAT do Substituto</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Digite o PAT (ex: 1812 ou 001812)"
                    value={substituteAssetCode}
                    onChange={(e) => {
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
                    Sistema formatará automaticamente com 6 dígitos
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
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Equipamento não disponível</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      Equipamento não encontrado ou não está disponível para substituição.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNavigateToCadastro}
                      className="mt-2"
                    >
                      Cadastrar novo equipamento →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {substituteAsset && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">✓ Equipamento encontrado e validado</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-1 text-sm text-green-600 mt-2">
                      <p><span className="font-medium">PAT:</span> {substituteAsset.asset_code}</p>
                      <p><span className="font-medium">Nome:</span> {substituteAsset.equipment_name}</p>
                      <p><span className="font-medium">Fabricante:</span> {substituteAsset.manufacturer}</p>
                      {substituteAsset.model && (
                        <p><span className="font-medium">Modelo:</span> {substituteAsset.model}</p>
                      )}
                      <p><span className="font-medium">Status:</span> Depósito Malta ✓</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Pré-visualização dos dados herdados */}
            {substituteAsset && (
              <Card className="border-blue-300 bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Info className="h-5 w-5" />
                    Dados que serão herdados automaticamente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Localização:</span>
                      <span className="font-medium text-blue-700">
                        {asset.location_type === 'locacao' ? 'Locação' : 'Manutenção'}
                      </span>
                    </div>
                    {asset.rental_company && (
                      <div className="flex justify-between">
                        <span className="text-blue-600">Empresa:</span>
                        <span className="font-medium text-blue-700">{asset.rental_company}</span>
                      </div>
                    )}
                    {asset.rental_work_site && (
                      <div className="flex justify-between">
                        <span className="text-blue-600">Obra:</span>
                        <span className="font-medium text-blue-700">{asset.rental_work_site}</span>
                      </div>
                    )}
                    {asset.maintenance_company && (
                      <div className="flex justify-between">
                        <span className="text-blue-600">Empresa Manutenção:</span>
                        <span className="font-medium text-blue-700">{asset.maintenance_company}</span>
                      </div>
                    )}
                    {asset.maintenance_work_site && (
                      <div className="flex justify-between">
                        <span className="text-blue-600">Obra Manutenção:</span>
                        <span className="font-medium text-blue-700">{asset.maintenance_work_site}</span>
                      </div>
                    )}
                    {asset.rental_start_date && (
                      <div className="flex justify-between">
                        <span className="text-blue-600">Data Início:</span>
                        <span className="font-medium text-blue-700">
                          {format(parseISO(asset.rental_start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    {asset.rental_end_date && (
                      <div className="flex justify-between">
                        <span className="text-blue-600">Data Fim:</span>
                        <span className="font-medium text-blue-700">
                          {format(parseISO(asset.rental_end_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formulário de motivo */}
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
