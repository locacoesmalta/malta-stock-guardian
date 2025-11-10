import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PlayCircle, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const DataNormalizationCard = () => {
  const { data, isLoading } = useDuplicateDetection();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNormalizing, setIsNormalizing] = useState(false);

  const handleManualNormalization = async () => {
    setIsNormalizing(true);
    try {
      const { data: result, error } = await supabase.rpc('normalize_all_data');
      
      if (error) {
        console.error('Erro ao normalizar:', error);
        toast({
          title: "Erro ao normalizar dados",
          description: "Houve um problema ao executar a normalização. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const totalUpdated = result?.reduce((sum: number, row: any) => sum + (row.records_updated || 0), 0) || 0;

      if (totalUpdated === 0) {
        toast({
          title: "✅ Dados já normalizados",
          description: "Todos os dados já estão normalizados. Nenhuma alteração necessária.",
        });
      } else {
        toast({
          title: "✅ Normalização concluída!",
          description: `${totalUpdated} registro(s) foram normalizados com sucesso.`,
        });
      }

      // Invalidar queries para atualizar o dashboard
      queryClient.invalidateQueries({ queryKey: ['duplicate-detection'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
    } catch (err) {
      console.error('Erro ao normalizar:', err);
      toast({
        title: "Erro ao normalizar dados",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsNormalizing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Normalização de Dados
          </CardTitle>
          <CardDescription>Carregando informações...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalDuplicates = data?.totalDuplicates || 0;
  const totalAffectedRecords = data?.totalAffectedRecords || 0;
  const hasIssues = totalDuplicates > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Normalização de Dados
        </CardTitle>
        <CardDescription>
          Sistema automático de limpeza e padronização de dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {hasIssues ? (
              <AlertTriangle className="h-5 w-5 text-warning" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-success" />
            )}
            <div>
              <p className="font-medium">
                {hasIssues ? "Duplicatas detectadas" : "Dados normalizados"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hasIssues 
                  ? `${totalDuplicates} grupo(s) de duplicatas afetando ${totalAffectedRecords} registro(s)`
                  : "Todos os dados estão padronizados corretamente"
                }
              </p>
            </div>
          </div>
          <Button
            onClick={handleManualNormalization}
            disabled={isNormalizing}
            size="sm"
            variant={hasIssues ? "default" : "outline"}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            {isNormalizing ? "Normalizando..." : "Normalizar Agora"}
          </Button>
        </div>

        {/* Detalhes por Categoria */}
        {hasIssues && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Duplicatas por categoria:</p>
            <div className="grid grid-cols-2 gap-2">
              {data.manufacturersAssets.length > 0 && (
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Fabricantes (Assets)</span>
                  <Badge variant="outline">{data.manufacturersAssets.length}</Badge>
                </div>
              )}
              {data.equipmentNames.length > 0 && (
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Equipamentos</span>
                  <Badge variant="outline">{data.equipmentNames.length}</Badge>
                </div>
              )}
              {data.models.length > 0 && (
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Modelos</span>
                  <Badge variant="outline">{data.models.length}</Badge>
                </div>
              )}
              {data.manufacturersProducts.length > 0 && (
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Fabricantes (Produtos)</span>
                  <Badge variant="outline">{data.manufacturersProducts.length}</Badge>
                </div>
              )}
              {data.products.length > 0 && (
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Produtos</span>
                  <Badge variant="outline">{data.products.length}</Badge>
                </div>
              )}
              {data.equipmentTypes.length > 0 && (
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Tipos de Equipamento</span>
                  <Badge variant="outline">{data.equipmentTypes.length}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações de Automação */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>⏰ Normalização automática: Diariamente às 03:00</p>
          <p>📊 Última verificação: {format(new Date(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </CardContent>
    </Card>
  );
};
