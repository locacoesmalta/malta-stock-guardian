import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, CheckCircle2, Database } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useConfirm } from "@/hooks/useConfirm";

interface PreviewData {
  count: number;
  samples: Array<{
    asset_code: string;
    issue: string;
    current_status: string;
    proposed_status: string;
  }>;
}

export function ManualDataMigration() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const analyzeDataIntegrity = async () => {
    setIsAnalyzing(true);
    try {
      console.log("🔍 Analisando integridade de dados...");

      // Buscar equipamentos que precisam correção
      // 1. Substitutos presos em aguardando_laudo
      const { data: substituteAssets, error: fetchError } = await supabase
        .from("assets")
        .select("id, asset_code, location_type, rental_company, was_replaced, substitution_date")
        .eq("location_type", "aguardando_laudo")
        .is("rental_company", null)
        .eq("was_replaced", false);

      if (fetchError) throw fetchError;

      console.log(`📊 Encontrados ${substituteAssets?.length || 0} equipamentos para análise`);

      if (!substituteAssets || substituteAssets.length === 0) {
        toast.success("✅ Nenhuma correção necessária!", {
          description: "Todos os equipamentos estão com dados consistentes",
        });
        setPreview(null);
        return;
      }

      // Preparar preview com detalhes
      const samples = [];
      for (const substitute of substituteAssets.slice(0, 5)) {
        // Buscar o equipamento antigo
        const { data: oldAsset } = await supabase
          .from("assets")
          .select("asset_code, rental_company, rental_work_site")
          .eq("replaced_by_asset_id", substitute.id)
          .eq("was_replaced", true)
          .maybeSingle();

        if (oldAsset && oldAsset.rental_company) {
          samples.push({
            asset_code: substitute.asset_code,
            issue: `Substituiu PAT ${oldAsset.asset_code} que estava em locação`,
            current_status: "aguardando_laudo",
            proposed_status: `locacao (${oldAsset.rental_company})`,
          });
        }
      }

      setPreview({
        count: samples.length, // Apenas equipamentos que efetivamente serão corrigidos
        samples,
      });

      if (samples.length === 0) {
        toast.info("Nenhuma correção aplicável", {
          description: "Os equipamentos encontrados não possuem dados de locação para herdar",
        });
      }
    } catch (error) {
      console.error("❌ Erro ao analisar:", error);
      toast.error("Erro ao analisar dados", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeMigration = async () => {
    const confirmed = await confirm({
      title: "Confirmar Correção de Dados?",
      description: `Esta ação irá corrigir ${preview?.count || 0} equipamento(s). Esta operação é segura e registra todas as alterações no histórico.`,
    });

    if (!confirmed) return;

    setIsMigrating(true);
    try {
      console.log("🚀 Iniciando correção de dados...");

      // Buscar equipamentos novamente para garantir dados atualizados
      const { data: substituteAssets, error: fetchError } = await supabase
        .from("assets")
        .select("id, asset_code, location_type, rental_company, was_replaced, substitution_date")
        .eq("location_type", "aguardando_laudo")
        .is("rental_company", null)
        .eq("was_replaced", false);

      if (fetchError) throw fetchError;

      let corrected = 0;
      let failed = 0;

      for (const substitute of substituteAssets || []) {
        try {
          // Buscar equipamento antigo
          const { data: oldAsset, error: oldError } = await supabase
            .from("assets")
            .select("asset_code, rental_company, rental_work_site, rental_start_date, rental_end_date, rental_contract_number, substitution_date")
            .eq("replaced_by_asset_id", substitute.id)
            .eq("was_replaced", true)
            .maybeSingle();

          if (oldError) throw oldError;
          if (!oldAsset || !oldAsset.rental_company || !oldAsset.rental_work_site) {
            continue; // Pular equipamentos sem dados de locação
          }

          const rentalStartDate = substitute.substitution_date || oldAsset.substitution_date || oldAsset.rental_start_date;

          // Atualizar equipamento
          const { error: updateError } = await supabase
            .from("assets")
            .update({
              location_type: "locacao",
              rental_company: oldAsset.rental_company,
              rental_work_site: oldAsset.rental_work_site,
              rental_start_date: rentalStartDate,
              rental_end_date: oldAsset.rental_end_date,
              rental_contract_number: oldAsset.rental_contract_number,
              updated_at: new Date().toISOString(),
            })
            .eq("id", substitute.id);

          if (updateError) throw updateError;

          // Registrar no histórico
          await supabase.rpc("registrar_evento_patrimonio", {
            p_pat_id: substitute.id,
            p_codigo_pat: substitute.asset_code,
            p_tipo_evento: "CORREÇÃO MANUAL",
            p_detalhes_evento: `Status corrigido manualmente via Admin: equipamento substituiu PAT ${oldAsset.asset_code} que estava em locação (${oldAsset.rental_company} - ${oldAsset.rental_work_site}). O substituto deveria ter herdado automaticamente o status de locação.`,
            p_campo_alterado: "location_type",
            p_valor_antigo: "aguardando_laudo",
            p_valor_novo: "locacao",
            p_data_evento_real: rentalStartDate,
          });

          corrected++;
          console.log(`✅ PAT ${substitute.asset_code}: Corrigido com sucesso`);
        } catch (error) {
          failed++;
          console.error(`❌ Erro ao corrigir PAT ${substitute.asset_code}:`, error);
        }
      }

      if (corrected > 0) {
        toast.success(`✅ Correção concluída!`, {
          description: `${corrected} equipamento(s) corrigido(s) com sucesso`,
        });
      }

      if (failed > 0) {
        toast.warning(`⚠️ ${failed} equipamento(s) falharam`, {
          description: "Verifique os logs no console para mais detalhes",
        });
      }

      // Limpar preview após execução
      setPreview(null);
    } catch (error) {
      console.error("❌ Erro ao executar correção:", error);
      toast.error("Erro ao executar correção", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Correção Manual de Dados
        </CardTitle>
        <CardDescription>
          Ferramenta para corrigir inconsistências em dados de equipamentos de forma controlada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta ferramenta analisa e corrige equipamentos substitutos que ficaram em "aguardando_laudo"
            mas deveriam estar em "locação". A correção é segura e registra todas as alterações no histórico.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={analyzeDataIntegrity}
            disabled={isAnalyzing || isMigrating}
            variant="outline"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Analisar Dados
              </>
            )}
          </Button>

          {preview && preview.count > 0 && (
            <Button onClick={executeMigration} disabled={isMigrating}>
              {isMigrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Executar Correção ({preview.count})
                </>
              )}
            </Button>
          )}
        </div>

        {preview && preview.count > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">
                Preview: {preview.count} Equipamento(s) Será(ão) Corrigido(s)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {preview.samples.map((sample, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">PAT {sample.asset_code}</span>
                      <Badge variant="outline">{sample.issue}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status Atual:</span>
                        <div className="font-medium text-yellow-600">{sample.current_status}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Será Alterado Para:</span>
                        <div className="font-medium text-green-600">{sample.proposed_status}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {preview.count > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... e mais {preview.count - 5} equipamento(s)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
      <ConfirmDialog />
    </Card>
  );
}
