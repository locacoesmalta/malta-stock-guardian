import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistrarEventoPatrimonio } from "@/hooks/useRegistrarEventoPatrimonio";
import { getTodayLocalDate } from "@/lib/dateUtils";
import { formatPAT } from "@/lib/patUtils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 🎯 FASE 1: Schema com controle total do operador sobre destinos
const substitutionSchema = z.object({
  substitution_date: z.string().min(1, "Data de substituição é obrigatória"),
  replacement_reason: z.string().min(10, "Motivo deve ter pelo menos 10 caracteres"),
  
  // ✅ OPERADOR DECIDE: Para onde vai o equipamento ANTIGO?
  old_asset_destination: z.enum(["aguardando_laudo", "em_manutencao", "deposito_malta"], {
    required_error: "Escolha o destino do equipamento substituído"
  }),
  
  // ✅ OPERADOR DECIDE: Novo equipamento herda posição?
  new_asset_inherits_position: z.boolean(),
  
  // ✅ OPERADOR DECIDE: Se não herdar, para onde vai?
  new_asset_destination: z.enum(["locacao", "em_manutencao", "deposito_malta"]).optional(),
  
  // Campos condicionais baseados no destino escolhido
  maintenance_company: z.string().optional(),
  maintenance_work_site: z.string().optional(),
  maintenance_arrival_date: z.string().optional(),
}).refine((data) => {
  // Se NÃO herdar posição, destino é obrigatório
  if (!data.new_asset_inherits_position && !data.new_asset_destination) {
    return false;
  }
  return true;
}, {
  message: "Escolha o destino do novo equipamento ou marque para herdar posição",
  path: ["new_asset_destination"]
}).refine((data) => {
  // Se destino antigo é manutenção, campos são obrigatórios
  if (data.old_asset_destination === "em_manutencao") {
    return !!(data.maintenance_company && data.maintenance_work_site && data.maintenance_arrival_date);
  }
  return true;
}, {
  message: "Preencha empresa, local e data de chegada para manutenção",
  path: ["maintenance_company"]
});

type SubstitutionFormData = z.infer<typeof substitutionSchema>;

export default function AssetSubstitution() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assetId = searchParams.get("assetId");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registrarEvento } = useRegistrarEventoPatrimonio();

  const [substituteAssetCode, setSubstituteAssetCode] = useState("");
  const [substituteAsset, setSubstituteAsset] = useState<any>(null);
  const [loadingSubstitute, setLoadingSubstitute] = useState(false);
  const [substituteNotFound, setSubstituteNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: async () => {
      if (!assetId) throw new Error("Asset ID não fornecido");
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!assetId,
  });

  const form = useForm<SubstitutionFormData>({
    resolver: zodResolver(substitutionSchema),
    defaultValues: {
      substitution_date: getTodayLocalDate(),
      replacement_reason: "",
      old_asset_destination: "aguardando_laudo",
      new_asset_inherits_position: true,
      new_asset_destination: undefined,
      maintenance_company: "",
      maintenance_work_site: "",
      maintenance_arrival_date: "",
    },
  });

  // 🎯 FASE 4: Validações de data baseadas na escolha do operador
  const validateSubstitutionDate = (dateStr: string): boolean => {
    if (!asset) return false;

    const substitutionDate = new Date(dateStr);
    const today = new Date(getTodayLocalDate());

    // ✅ BLOQUEIO ÚNICO: Data não pode ser futura
    if (substitutionDate > today) {
      toast.error("❌ Data de substituição não pode ser futura");
      return false;
    }

    // ⚠️ AVISO: Substituição retroativa (NÃO bloqueia)
    const originalAssetDate = asset.effective_registration_date 
      ? new Date(asset.effective_registration_date) 
      : new Date(asset.created_at);

    if (substitutionDate < originalAssetDate) {
      const daysDiff = Math.floor((originalAssetDate.getTime() - substitutionDate.getTime()) / (1000 * 60 * 60 * 24));
      toast.info(
        `⚠️ Substituição retroativa: Data da substituição é ${daysDiff} dias anterior ao cadastro. ` +
        `Isso será registrado no histórico para rastreabilidade.`,
        { duration: 5000 }
      );
    }

    return true;
  };

  // Buscar equipamento substituto
  const handleSearchSubstitute = async () => {
    if (!substituteAssetCode.trim()) {
      toast.error("Digite o PAT do equipamento substituto");
      return;
    }

    const formattedPAT = formatPAT(substituteAssetCode.trim());
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
        toast.error(`Equipamento ${formattedPAT} não encontrado`);
        return;
      }

      if (data.location_type !== "deposito_malta") {
        const statusLabels: Record<string, string> = {
          locacao: "Locação",
          em_manutencao: "Manutenção",
          aguardando_laudo: "Aguardando Laudo",
        };
        const currentStatus = statusLabels[data.location_type] || data.location_type;
        setSubstituteNotFound(true);
        toast.error(`Equipamento ${formattedPAT} está em "${currentStatus}". Deve estar no Depósito Malta.`);
        return;
      }

      if (asset && data.equipment_name !== asset.equipment_name) {
        toast.warning(`Atenção: Substituindo "${asset.equipment_name}" por "${data.equipment_name}"`);
      }

      setSubstituteAsset(data);
      toast.success(`Equipamento ${formattedPAT} encontrado!`);
    } catch (error) {
      console.error("Erro ao buscar equipamento:", error);
      toast.error("Erro ao buscar equipamento");
    } finally {
      setLoadingSubstitute(false);
    }
  };

  const onSubmit = async (data: SubstitutionFormData) => {
    if (!asset || !substituteAsset || !user) {
      toast.error("Dados incompletos para realizar substituição");
      return;
    }

    // 🎯 FASE 4: Validar data escolhida pelo operador
    if (!validateSubstitutionDate(data.substitution_date)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // ============================================
      // 🎯 FASE 1: ATUALIZAR EQUIPAMENTO ANTIGO
      // Destino escolhido pelo OPERADOR
      // ============================================
      
      const oldAssetUpdateData: any = {
        was_replaced: true,
        replaced_by_asset_id: substituteAsset.id,
        substitution_date: data.substitution_date,
        replacement_reason: data.replacement_reason,
        locked_for_manual_edit: true,
        // ✅ OPERADOR DECIDE: Sistema obedece
        location_type: data.old_asset_destination,
        updated_at: new Date().toISOString(),
      };

      // Se operador escolheu manutenção para o equipamento antigo
      if (data.old_asset_destination === "em_manutencao") {
        oldAssetUpdateData.maintenance_company = data.maintenance_company;
        oldAssetUpdateData.maintenance_work_site = data.maintenance_work_site;
        oldAssetUpdateData.maintenance_arrival_date = data.maintenance_arrival_date;
      }

      const { error: oldAssetError } = await supabase
        .from("assets")
        .update(oldAssetUpdateData)
        .eq("id", asset.id);

      if (oldAssetError) throw oldAssetError;

      // ============================================
      // 🎯 FASE 1: ATUALIZAR EQUIPAMENTO NOVO
      // Herança ou destino escolhido pelo OPERADOR
      // ============================================

      const newAssetData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.new_asset_inherits_position) {
        // ✅ OPERADOR DECIDIU: Herdar posição do antigo
        newAssetData.location_type = asset.location_type;
        
        // Herdar dados específicos do local
        if (asset.location_type === "locacao") {
          newAssetData.rental_company = asset.rental_company;
          newAssetData.rental_work_site = asset.rental_work_site;
          newAssetData.rental_start_date = data.substitution_date;
        } else if (asset.location_type === "em_manutencao") {
          newAssetData.maintenance_company = asset.maintenance_company;
          newAssetData.maintenance_work_site = asset.maintenance_work_site;
          newAssetData.maintenance_arrival_date = data.substitution_date;
        }
      } else {
        // ✅ OPERADOR DECIDIU: Destino manual
        newAssetData.location_type = data.new_asset_destination;

        if (data.new_asset_destination === "em_manutencao") {
          newAssetData.maintenance_company = data.maintenance_company;
          newAssetData.maintenance_work_site = data.maintenance_work_site;
          newAssetData.maintenance_arrival_date = data.maintenance_arrival_date;
        }
      }

      const { error: newAssetError } = await supabase
        .from("assets")
        .update(newAssetData)
        .eq("id", substituteAsset.id);

      if (newAssetError) throw newAssetError;

      // ============================================
      // 🎯 FASE 5: REGISTRAR EVENTOS NO HISTÓRICO
      // Registrar decisões explícitas do operador
      // ============================================

      const getLocationLabel = (loc: string) => {
        const labels: Record<string, string> = {
          aguardando_laudo: "Aguardando Laudo",
          em_manutencao: "Manutenção",
          deposito_malta: "Depósito Malta",
          locacao: "Locação",
        };
        return labels[loc] || loc;
      };

      // Evento do equipamento ANTIGO
      const oldAssetDetails = 
        `Substituído pelo PAT ${substituteAsset.asset_code} em ${format(new Date(data.substitution_date), "dd/MM/yyyy")}. ` +
        `Equipamento movido para ${getLocationLabel(data.old_asset_destination)} conforme decisão do operador. ` +
        `Motivo: ${data.replacement_reason}`;

      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "SUBSTITUIÇÃO",
        campoAlterado: "was_replaced",
        valorAntigo: "false",
        valorNovo: "true",
        detalhesEvento: oldAssetDetails,
        dataEventoReal: data.substitution_date,
      });

      // Evento do equipamento NOVO
      const newAssetDetails = data.new_asset_inherits_position
        ? `Substituiu PAT ${asset.asset_code} em ${format(new Date(data.substitution_date), "dd/MM/yyyy")}. ` +
          `Herdou posição: ${getLocationLabel(asset.location_type)} conforme decisão do operador.`
        : `Substituiu PAT ${asset.asset_code} em ${format(new Date(data.substitution_date), "dd/MM/yyyy")}. ` +
          `Movido para ${getLocationLabel(data.new_asset_destination!)} conforme decisão do operador.`;

      await registrarEvento({
        patId: substituteAsset.id,
        codigoPat: substituteAsset.asset_code,
        tipoEvento: "SUBSTITUIÇÃO",
        campoAlterado: "location_type",
        valorAntigo: "deposito_malta",
        valorNovo: data.new_asset_inherits_position ? asset.location_type : data.new_asset_destination!,
        detalhesEvento: newAssetDetails,
        dataEventoReal: data.substitution_date,
      });

      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("✅ Substituição realizada com sucesso!");
      navigate("/assets");
    } catch (error) {
      console.error("Erro ao realizar substituição:", error);
      toast.error("Erro ao realizar substituição");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (assetLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="container mx-auto p-6">
        <p>Equipamento não encontrado</p>
      </div>
    );
  }

  const watchOldDestination = form.watch("old_asset_destination");
  const watchNewInherits = form.watch("new_asset_inherits_position");

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Substituição de Equipamento
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Equipamento Original */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Equipamento a ser substituído:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">PAT:</span>
                <Badge variant="outline" className="ml-2">{asset.asset_code}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <span className="ml-2">{asset.equipment_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Localização:</span>
                <span className="ml-2">{asset.location_type}</span>
              </div>
            </div>
          </div>

          {/* Buscar Substituto */}
          <div className="mb-6">
            <Label>PAT do Equipamento Substituto</Label>
            <div className="flex gap-2">
              <Input
                value={substituteAssetCode}
                onChange={(e) => setSubstituteAssetCode(e.target.value)}
                placeholder="Digite o PAT"
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubstitute()}
              />
              <Button
                type="button"
                onClick={handleSearchSubstitute}
                disabled={loadingSubstitute}
              >
                {loadingSubstitute ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>

          {substituteAsset && (
            <>
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2 text-green-700">Equipamento Substituto Encontrado:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">PAT:</span>
                    <Badge variant="outline" className="ml-2">{substituteAsset.asset_code}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="ml-2">{substituteAsset.equipment_name}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Data e Motivo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data da Substituição *</Label>
                    <Input
                      type="date"
                      {...form.register("substitution_date")}
                      max={getTodayLocalDate()}
                    />
                    {form.formState.errors.substitution_date && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.substitution_date.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Motivo da Substituição *</Label>
                  <Textarea
                    {...form.register("replacement_reason")}
                    placeholder="Descreva o motivo da substituição..."
                    rows={3}
                  />
                  {form.formState.errors.replacement_reason && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.replacement_reason.message}
                    </p>
                  )}
                </div>

                {/* 🎯 FASE 1: Escolha do OPERADOR - Destino Equipamento Antigo */}
                <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                  <AlertCircle className="h-4 w-4 text-purple-600" />
                  <AlertDescription>
                    <p className="font-semibold text-purple-700 mb-2">
                      Para onde vai o equipamento substituído?
                    </p>
                    <Select
                      value={watchOldDestination}
                      onValueChange={(value) => form.setValue("old_asset_destination", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aguardando_laudo">Aguardando Laudo</SelectItem>
                        <SelectItem value="em_manutencao">Manutenção</SelectItem>
                        <SelectItem value="deposito_malta">Depósito Malta</SelectItem>
                      </SelectContent>
                    </Select>
                  </AlertDescription>
                </Alert>

                {/* Campos condicionais para Manutenção do equipamento antigo */}
                {watchOldDestination === "em_manutencao" && (
                  <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold">Dados da Manutenção</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Empresa *</Label>
                        <Input {...form.register("maintenance_company")} />
                      </div>
                      <div>
                        <Label>Local *</Label>
                        <Input {...form.register("maintenance_work_site")} />
                      </div>
                      <div>
                        <Label>Data de Chegada *</Label>
                        <Input type="date" {...form.register("maintenance_arrival_date")} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎯 FASE 1: Escolha do OPERADOR - Destino Equipamento Novo */}
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-semibold text-blue-700">
                        O novo equipamento deve herdar a posição do antigo?
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="inherit"
                          checked={watchNewInherits}
                          onCheckedChange={(checked) => 
                            form.setValue("new_asset_inherits_position", checked as boolean)
                          }
                        />
                        <label htmlFor="inherit" className="text-sm">
                          Sim, herdar localização atual ({asset.location_type})
                        </label>
                      </div>

                      {!watchNewInherits && (
                        <div className="mt-3">
                          <Label>Para onde enviar o novo equipamento? *</Label>
                          <Select
                            value={form.watch("new_asset_destination")}
                            onValueChange={(value) => form.setValue("new_asset_destination", value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Escolha o destino" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="locacao">Locação</SelectItem>
                              <SelectItem value="em_manutencao">Manutenção</SelectItem>
                              <SelectItem value="deposito_malta">Depósito Malta</SelectItem>
                            </SelectContent>
                          </Select>
                          {form.formState.errors.new_asset_destination && (
                            <p className="text-sm text-destructive mt-1">
                              {form.formState.errors.new_asset_destination.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? "Processando..." : "Confirmar Substituição"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
