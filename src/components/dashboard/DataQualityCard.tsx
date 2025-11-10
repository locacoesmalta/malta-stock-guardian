import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { useAssetsMissingData } from "@/hooks/useAssetsMissingData";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { useDuplicateDetection } from "@/hooks/useDuplicateDetection";
import { Badge } from "@/components/ui/badge";

export const DataQualityCard = () => {
  const navigate = useNavigate();
  const { data: assets, isLoading: assetsLoading } = useAssetsQuery();
  const { data: assetsMissingData, isLoading: missingDataLoading } = useAssetsMissingData();
  const { data: duplicates, isLoading: duplicatesLoading } = useDuplicateDetection();

  if (assetsLoading || missingDataLoading || duplicatesLoading) {
    return null;
  }

  const totalAssets = assets?.length || 0;
  const missingManufacturer = assetsMissingData?.length || 0;
  const completeAssets = totalAssets - missingManufacturer;
  const completionPercentage = totalAssets > 0 ? Math.round((completeAssets / totalAssets) * 100) : 0;

  const totalDuplicates = duplicates?.totalDuplicates || 0;
  const hasDuplicates = totalDuplicates > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {missingManufacturer === 0 && !hasDuplicates ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500" />
          )}
          Qualidade dos Dados
        </CardTitle>
        <CardDescription>
          Completude e consistência dos dados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completude */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Dados Completos</span>
            <span className="font-bold">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completeAssets}</div>
            <div className="text-xs text-muted-foreground">Completos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{missingManufacturer}</div>
            <div className="text-xs text-muted-foreground">Incompletos</div>
          </div>
        </div>

        {/* Duplicatas */}
        {hasDuplicates && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Duplicatas Detectadas</span>
              </div>
              <Badge variant="destructive">{totalDuplicates}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {duplicates?.totalAffectedRecords} registros com nomes inconsistentes
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate("/admin/data-normalization")}
            >
              Normalizar Dados
            </Button>
          </div>
        )}

        {/* Botão de correção */}
        {missingManufacturer > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/assets/missing-data")}
          >
            Corrigir Dados Incompletos
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
