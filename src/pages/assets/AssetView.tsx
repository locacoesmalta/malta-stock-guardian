import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/hooks/useConfirm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2, Move, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AssetHistorySection } from "@/components/AssetHistorySection";
import { DeadlineStatusBadge } from "@/components/DeadlineStatusBadge";

export default function AssetView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const { confirm, ConfirmDialog } = useConfirm();

  const { data: asset, isLoading, error } = useQuery({
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

  useEffect(() => {
    if (error) {
      toast.error("Erro ao carregar patrimônio");
      navigate("/assets");
    }
  }, [error, navigate]);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Confirmar exclusão",
      description: "Tem certeza que deseja excluir este patrimônio? Esta ação não pode ser desfeita.",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
      toast.success("Patrimônio excluído com sucesso");
      navigate("/assets");
    } catch (error) {
      console.error("Erro ao excluir patrimônio:", error);
      toast.error("Erro ao excluir patrimônio");
    }
  };

  const getLocationLabel = (locationType: string) => {
    switch (locationType) {
      case "deposito_malta": return "Depósito Malta";
      case "em_manutencao": return "Em Manutenção";
      case "locacao": return "Locação";
      case "aguardando_laudo": return "Aguardando Laudo";
      default: return locationType;
    }
  };

  const getLocationVariant = (locationType: string) => {
    switch (locationType) {
      case "deposito_malta": return "secondary" as const;
      case "em_manutencao": return "destructive" as const;
      case "locacao": return "default" as const;
      case "aguardando_laudo": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-6xl">
      <ConfirmDialog />

      {asset.was_replaced && (
        <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-sm sm:text-base">Equipamento Substituído</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            Este equipamento foi substituído.
            {asset.replaced_by_asset_id && (
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2 text-yellow-700 hover:text-yellow-900 text-xs sm:text-sm"
                onClick={() => navigate(`/assets/view/${asset.replaced_by_asset_id}`)}
              >
                Ver Substituto →
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/assets")} className="flex-shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{asset.equipment_name}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">PAT: {asset.asset_code}</p>
        </div>
        <Badge variant={getLocationVariant(asset.location_type)} className="text-xs sm:text-sm whitespace-nowrap">
          {getLocationLabel(asset.location_type)}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {permissions?.can_edit_assets && (
          <>
            <Button onClick={() => navigate(`/assets/edit/${id}`)} className="flex-1 sm:flex-none text-xs sm:text-sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar Cadastro
            </Button>
            {asset.location_type === "aguardando_laudo" ? (
              <Button variant="outline" onClick={() => navigate(`/assets/post-inspection/${id}`)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Move className="h-4 w-4 mr-2" />
                Registrar Decisão Pós-Laudo
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate(`/assets/movement/${id}`)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Move className="h-4 w-4 mr-2" />
                Registrar Movimentação
              </Button>
            )}
          </>
        )}
        {permissions?.can_delete_assets && (
          <Button variant="destructive" onClick={handleDelete} className="flex-1 sm:flex-none text-xs sm:text-sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        )}
      </div>

      <Tabs defaultValue="technical" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="technical" className="text-xs sm:text-sm">Dados Técnicos</TabsTrigger>
          <TabsTrigger value="status" className="text-xs sm:text-sm">Status Atual</TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Fabricante</p>
                  <p className="text-sm sm:text-base">{asset.manufacturer || "—"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Modelo</p>
                  <p className="text-sm sm:text-base">{asset.model || "—"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Número de Série</p>
                  <p className="text-sm sm:text-base break-all">{asset.serial_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Voltagem/Combustível</p>
                  <p className="text-sm sm:text-base">{asset.voltage_combustion || "—"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Fornecedor</p>
                  <p className="text-sm sm:text-base">{asset.supplier || "—"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Data de Compra</p>
                  <p className="text-sm sm:text-base">
                    {asset.purchase_date ? format(parseISO(asset.purchase_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Valor Unitário</p>
                  <p className="text-sm sm:text-base">
                    {asset.unit_value ? `R$ ${asset.unit_value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Condição</p>
                  <p className="text-sm sm:text-base">{asset.equipment_condition || "—"}</p>
                </div>
              </div>
              {asset.comments && (
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Comentários</p>
                  <p className="text-sm sm:text-base">{asset.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status e Localização Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.location_type === "aguardando_laudo" && asset.inspection_start_date && (
                <DeadlineStatusBadge inspectionStartDate={asset.inspection_start_date} />
              )}
              
              {asset.location_type === "deposito_malta" && (
                <>
                  {asset.deposito_description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-base">{asset.deposito_description}</p>
                    </div>
                  )}
                  {asset.malta_collaborator && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Responsável Malta</p>
                      <p className="text-base">{asset.malta_collaborator}</p>
                    </div>
                  )}
                </>
              )}

              {asset.location_type === "em_manutencao" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Empresa de Manutenção</p>
                      <p className="text-base">{asset.maintenance_company || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Obra</p>
                      <p className="text-base">{asset.maintenance_work_site || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Chegada</p>
                      <p className="text-base">
                        {asset.maintenance_arrival_date ? format(parseISO(asset.maintenance_arrival_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Previsão de Saída</p>
                      <p className="text-base">
                        {asset.maintenance_departure_date ? format(parseISO(asset.maintenance_departure_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </p>
                    </div>
                  </div>
                  {asset.maintenance_description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-base">{asset.maintenance_description}</p>
                    </div>
                  )}
                  {asset.malta_collaborator && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Responsável Malta</p>
                      <p className="text-base">{asset.malta_collaborator}</p>
                    </div>
                  )}
                </>
              )}

              {asset.location_type === "locacao" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                      <p className="text-base">{asset.rental_company || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Obra</p>
                      <p className="text-base">{asset.rental_work_site || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Início</p>
                      <p className="text-base">
                        {asset.rental_start_date ? format(parseISO(asset.rental_start_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data Fim</p>
                      <p className="text-base">
                        {asset.rental_end_date ? format(parseISO(asset.rental_end_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </p>
                    </div>
                  </div>
                  {asset.malta_collaborator && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Responsável Malta</p>
                      <p className="text-base">{asset.malta_collaborator}</p>
                    </div>
                  )}
                </>
              )}

              {asset.location_type === "aguardando_laudo" && (
                <>
                  {asset.malta_collaborator && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Responsável Malta</p>
                      <p className="text-base">{asset.malta_collaborator}</p>
                    </div>
                  )}
                </>
              )}

              {asset.equipment_observations && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-base">{asset.equipment_observations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <AssetHistorySection assetId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
