import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Database } from "lucide-react";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { useAssetsMissingData } from "@/hooks/useAssetsMissingData";

export const DataQualityCard = () => {
  const navigate = useNavigate();
  const { data: assets = [] } = useAssetsQuery();
  const { data: assetsWithoutManufacturer = [] } = useAssetsMissingData();

  const totalAssets = assets.length;
  const completeAssets = totalAssets - assetsWithoutManufacturer.length;
  const percentageComplete = totalAssets > 0 ? Math.round((completeAssets / totalAssets) * 100) : 100;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium">Qualidade dos Dados</CardTitle>
        <Database className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold">{percentageComplete}%</div>
            <p className="text-xs text-muted-foreground">Dados completos</p>
          </div>
          
          <div className="flex items-center gap-2">
            {assetsWithoutManufacturer.length === 0 ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-orange-500" />
            )}
          </div>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Total de equipamentos:</span>
            <span className="font-medium">{totalAssets}</span>
          </div>
          <div className="flex justify-between">
            <span>Com dados completos:</span>
            <span className="font-medium text-green-600">{completeAssets}</span>
          </div>
          {assetsWithoutManufacturer.length > 0 && (
            <div className="flex justify-between">
              <span>Sem fabricante:</span>
              <span className="font-medium text-orange-600">{assetsWithoutManufacturer.length}</span>
            </div>
          )}
        </div>

        {assetsWithoutManufacturer.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate("/assets/missing-data")}
          >
            Corrigir dados incompletos
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
