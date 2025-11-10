import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAssetsMissingData } from "@/hooks/useAssetsMissingData";

export const AssetDataWarning = () => {
  const navigate = useNavigate();
  const { data: assetsWithoutManufacturer = [] } = useAssetsMissingData();

  if (assetsWithoutManufacturer.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-700">⚠️ Atenção: Dados Incompletos</AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            Existem <strong>{assetsWithoutManufacturer.length}</strong> equipamento(s) sem fabricante cadastrado.
            Equipamentos sem fabricante não aparecem nos filtros.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/assets/missing-data")}
            className="border-orange-600 text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900 whitespace-nowrap"
          >
            Corrigir agora →
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
