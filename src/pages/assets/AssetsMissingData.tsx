import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, CheckCircle } from "lucide-react";
import { useAssetsMissingData } from "@/hooks/useAssetsMissingData";
import { QuickFixManufacturerDialog } from "@/components/QuickFixManufacturerDialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLocationLabel, getLocationVariant } from "@/lib/locationUtils";

export default function AssetsMissingData() {
  const navigate = useNavigate();
  const { data: assetsWithoutManufacturer = [], isLoading } = useAssetsMissingData();
  const [selectedAsset, setSelectedAsset] = useState<{
    id: string;
    code: string;
    name: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/assets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Correção de Dados</h1>
          <p className="text-sm text-muted-foreground">
            Equipamentos sem fabricante cadastrado
          </p>
        </div>
      </div>

      {assetsWithoutManufacturer.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Todos os dados estão completos!</h3>
            <p className="text-muted-foreground text-center mb-4">
              Não há equipamentos sem fabricante cadastrado.
            </p>
            <Button onClick={() => navigate("/assets")}>Voltar para Equipamentos</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="text-orange-700">
                ⚠️ {assetsWithoutManufacturer.length} Equipamento(s) Pendente(s)
              </CardTitle>
              <CardDescription className="text-orange-600">
                Estes equipamentos não aparecem nos filtros enquanto não tiverem o fabricante cadastrado.
                Corrija os dados para garantir o controle adequado do patrimônio.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {assetsWithoutManufacturer.map((asset) => (
              <Card key={asset.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{asset.equipment_name}</h3>
                        <Badge variant={getLocationVariant(asset.location_type)}>
                          {getLocationLabel(asset.location_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">PAT: {asset.asset_code}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em: {format(parseISO(asset.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedAsset({
                            id: asset.id,
                            code: asset.asset_code,
                            name: asset.equipment_name,
                          })
                        }
                        className="flex-1 sm:flex-none"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Corrigir Fabricante
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/assets/view/${asset.id}`)}
                        className="flex-1 sm:flex-none"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {selectedAsset && (
        <QuickFixManufacturerDialog
          assetId={selectedAsset.id}
          assetCode={selectedAsset.code}
          equipmentName={selectedAsset.name}
          open={!!selectedAsset}
          onOpenChange={(open) => !open && setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
