import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Card de monitoramento da normalização automática
 */
export const DataNormalizationCard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: duplicates, isLoading, refetch } = useDuplicateDetection();
  const [isNormalizing, setIsNormalizing] = useState(false);

  const totalDuplicates = duplicates?.totalDuplicates || 0;
  const totalAffectedRecords = duplicates?.totalAffectedRecords || 0;
  const hasDuplicates = totalDuplicates > 0;

  /**
   * Executar normalização manual
   */
  const handleManualNormalization = async () => {
    setIsNormalizing(true);
    
    try {
      const { data, error } = await supabase.rpc('normalize_all_data');

      if (error) {
        console.error('Erro ao normalizar dados:', error);
        toast.error('Erro ao normalizar dados');
        return;
      }

      if (data && Array.isArray(data)) {
        const totalUpdated = data.reduce((sum: number, row: any) => sum + (row.records_updated || 0), 0);
        
        if (totalUpdated === 0) {
          toast.success('✅ Nenhum registro precisou ser normalizado');
        } else {
          const details = data
            .filter((row: any) => row.records_updated > 0)
            .map((row: any) => `${row.table_name}.${row.field_name}: ${row.records_updated}`)
            .join('\n');
          
          toast.success(`✅ Normalização concluída!\n${totalUpdated} registros atualizados\n\n${details}`, {
            duration: 5000,
          });
        }
        
        // Atualizar cache
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['duplicate-detection'] });
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    } catch (error) {
      console.error('Erro na normalização:', error);
      toast.error('Erro ao normalizar dados');
    } finally {
      setIsNormalizing(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasDuplicates ? (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          Normalização de Dados
        </CardTitle>
        <CardDescription>
          {hasDuplicates 
            ? 'Sistema de limpeza automática detectou inconsistências' 
            : 'Dados normalizados e consistentes'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold ${hasDuplicates ? 'text-orange-600' : 'text-green-600'}`}>
              {totalDuplicates}
            </div>
            <div className="text-xs text-muted-foreground">Duplicatas</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${totalAffectedRecords > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {totalAffectedRecords}
            </div>
            <div className="text-xs text-muted-foreground">Registros Afetados</div>
          </div>
        </div>

        {/* Informação sobre automação */}
        <div className="p-3 bg-muted rounded-md text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Normalização Automática</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sistema executa limpeza diariamente às 03:00. 
            Novos dados são validados em tempo real nos formulários.
          </p>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleManualNormalization}
            disabled={isNormalizing}
          >
            {isNormalizing ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Forçar Normalização Agora
          </Button>

          {hasDuplicates && (
            <Button
              variant="default"
              className="w-full"
              onClick={() => navigate("/admin/data-normalization")}
            >
              Ver Detalhes das Duplicatas
              <Badge variant="destructive" className="ml-2">{totalDuplicates}</Badge>
            </Button>
          )}
        </div>

        {/* Breakdown por categoria */}
        {hasDuplicates && (
          <div className="pt-3 border-t space-y-1 text-xs">
            <div className="font-medium mb-2">Duplicatas por categoria:</div>
            {duplicates?.manufacturersAssets.length > 0 && (
              <div className="flex justify-between">
                <span>Fabricantes (Assets)</span>
                <Badge variant="outline" size="sm">{duplicates.manufacturersAssets.length}</Badge>
              </div>
            )}
            {duplicates?.equipmentNames.length > 0 && (
              <div className="flex justify-between">
                <span>Nomes de Equipamentos</span>
                <Badge variant="outline" size="sm">{duplicates.equipmentNames.length}</Badge>
              </div>
            )}
            {duplicates?.models && duplicates.models.length > 0 && (
              <div className="flex justify-between">
                <span>Modelos</span>
                <Badge variant="outline" size="sm">{duplicates.models.length}</Badge>
              </div>
            )}
            {duplicates?.equipmentTypes && duplicates.equipmentTypes.length > 0 && (
              <div className="flex justify-between">
                <span>Tipos de Equipamentos</span>
                <Badge variant="outline" size="sm">{duplicates.equipmentTypes.length}</Badge>
              </div>
            )}
            {duplicates?.products.length > 0 && (
              <div className="flex justify-between">
                <span>Produtos</span>
                <Badge variant="outline" size="sm">{duplicates.products.length}</Badge>
              </div>
            )}
            {duplicates?.manufacturersProducts.length > 0 && (
              <div className="flex justify-between">
                <span>Fabricantes (Produtos)</span>
                <Badge variant="outline" size="sm">{duplicates.manufacturersProducts.length}</Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
