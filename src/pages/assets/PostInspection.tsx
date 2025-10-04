import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import {
  postInspectionApproveSchema,
  movementManutencaoSchema,
  movementLocacaoSchema,
  type PostInspectionApproveFormData,
  type MovementManutencaoFormData,
  type MovementLocacaoFormData,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Check, Wrench, Building2, RefreshCw } from "lucide-react";
import { DeadlineStatusBadge } from "@/components/DeadlineStatusBadge";

type DecisionType = "approve" | "maintenance" | "return" | "replace" | null;

export default function PostInspection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>(null);

  // Verificar se ID existe
  if (!id) {
    navigate("/assets");
    return null;
  }

  const { data: asset, isLoading } = useQuery({
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

  const approveForm = useForm<PostInspectionApproveFormData>({
    resolver: zodResolver(postInspectionApproveSchema),
  });

  const maintenanceForm = useForm<MovementManutencaoFormData>({
    resolver: zodResolver(movementManutencaoSchema),
  });

  const returnForm = useForm<MovementLocacaoFormData>({
    resolver: zodResolver(movementLocacaoSchema),
  });

  const handleApproveForRental = async (data: PostInspectionApproveFormData) => {
    if (!asset) return;

    try {
      const { error } = await supabase
        .from("assets")
        .update({
          location_type: "deposito_malta",
          available_for_rental: true,
          inspection_start_date: null,
          // Limpar campos de outros status
          rental_company: null,
          rental_work_site: null,
          rental_start_date: null,
          rental_end_date: null,
          maintenance_company: null,
          maintenance_work_site: null,
          maintenance_description: null,
          maintenance_arrival_date: null,
          maintenance_departure_date: null,
        })
        .eq("id", id);

      if (error) throw error;

      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "DECISÃO PÓS-LAUDO",
        detalhesEvento: `Equipamento aprovado e disponibilizado para locação${data.decision_notes ? `. Observação: ${data.decision_notes}` : ""}`,
      });

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });

      toast.success("Equipamento aprovado para locação");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao aprovar equipamento:", error);
      toast.error("Erro ao aprovar equipamento");
    }
  };

  const handleSendToMaintenance = async (data: MovementManutencaoFormData) => {
    if (!asset) return;

    try {
      const { error } = await supabase
        .from("assets")
        .update({
          location_type: "em_manutencao",
          available_for_rental: false,
          inspection_start_date: null,
          ...data,
          // Limpar campos de outros status
          rental_company: null,
          rental_work_site: null,
          rental_start_date: null,
          rental_end_date: null,
          deposito_description: null,
        })
        .eq("id", id);

      if (error) throw error;

      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "DECISÃO PÓS-LAUDO",
        detalhesEvento: `Enviado para manutenção em ${data.maintenance_company} - ${data.maintenance_work_site}`,
      });

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });

      toast.success("Equipamento enviado para manutenção");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao enviar para manutenção:", error);
      toast.error("Erro ao enviar para manutenção");
    }
  };

  const handleReturnToSite = async (data: MovementLocacaoFormData) => {
    if (!asset) return;

    try {
      const { error } = await supabase
        .from("assets")
        .update({
          location_type: "locacao",
          available_for_rental: false,
          inspection_start_date: null,
          ...data,
          // Limpar campos de outros status
          deposito_description: null,
          maintenance_company: null,
          maintenance_work_site: null,
          maintenance_description: null,
          maintenance_arrival_date: null,
          maintenance_departure_date: null,
        })
        .eq("id", id);

      if (error) throw error;

      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "DECISÃO PÓS-LAUDO",
        detalhesEvento: `Retornado para obra ${data.rental_work_site} - ${data.rental_company}`,
      });

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });

      toast.success("Equipamento retornado para obra");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao retornar para obra:", error);
      toast.error("Erro ao retornar para obra");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!asset) return null;

  if (asset.location_type !== "aguardando_laudo") {
    toast.error("Este equipamento não está aguardando laudo");
    navigate(`/assets/view/${id}`);
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/assets/view/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Decisão Pós-Laudo</h1>
          <p className="text-muted-foreground">{asset.equipment_name} - PAT: {asset.asset_code}</p>
        </div>
        <Badge variant="outline">Aguardando Laudo</Badge>
      </div>

      {asset.inspection_start_date && (
        <div className="mb-6">
          <DeadlineStatusBadge inspectionStartDate={asset.inspection_start_date} />
        </div>
      )}

      {!selectedDecision ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedDecision("approve")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Aprovar para Locação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Equipamento retorna ao depósito e fica disponível para locação
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedDecision("maintenance")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                Enviar para Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Equipamento necessita de manutenção antes de ser liberado
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedDecision("return")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Retornar para Obra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Equipamento retorna para a obra sem necessidade de manutenção
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/assets/replacement/${id}`)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-500" />
                Substituir Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Equipamento será substituído por outro patrimônio
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {selectedDecision === "approve" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Aprovar para Locação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={approveForm.handleSubmit(handleApproveForRental)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="decision_notes">Observações (opcional)</Label>
                    <Textarea
                      id="decision_notes"
                      {...approveForm.register("decision_notes")}
                      placeholder="Adicione observações sobre a aprovação..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={approveForm.formState.isSubmitting}>
                      {approveForm.formState.isSubmitting ? "Aprovando..." : "Confirmar Aprovação"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSelectedDecision(null)}>
                      Voltar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {selectedDecision === "maintenance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-500" />
                  Enviar para Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={maintenanceForm.handleSubmit(handleSendToMaintenance)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_company">Empresa de Manutenção *</Label>
                      <Input
                        id="maintenance_company"
                        {...maintenanceForm.register("maintenance_company")}
                        placeholder="Nome da empresa"
                      />
                      {maintenanceForm.formState.errors.maintenance_company && (
                        <p className="text-sm text-destructive">{maintenanceForm.formState.errors.maintenance_company.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_work_site">Obra *</Label>
                      <Input
                        id="maintenance_work_site"
                        {...maintenanceForm.register("maintenance_work_site")}
                        placeholder="Nome da obra"
                      />
                      {maintenanceForm.formState.errors.maintenance_work_site && (
                        <p className="text-sm text-destructive">{maintenanceForm.formState.errors.maintenance_work_site.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_arrival_date">Data de Chegada *</Label>
                      <Input
                        id="maintenance_arrival_date"
                        type="date"
                        {...maintenanceForm.register("maintenance_arrival_date")}
                      />
                      {maintenanceForm.formState.errors.maintenance_arrival_date && (
                        <p className="text-sm text-destructive">{maintenanceForm.formState.errors.maintenance_arrival_date.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_departure_date">Previsão de Saída</Label>
                      <Input
                        id="maintenance_departure_date"
                        type="date"
                        {...maintenanceForm.register("maintenance_departure_date")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="malta_collaborator">Responsável Malta</Label>
                      <Input
                        id="malta_collaborator"
                        {...maintenanceForm.register("malta_collaborator")}
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_description">Descrição *</Label>
                    <Textarea
                      id="maintenance_description"
                      {...maintenanceForm.register("maintenance_description")}
                      placeholder="Descrição da manutenção..."
                      rows={3}
                    />
                    {maintenanceForm.formState.errors.maintenance_description && (
                      <p className="text-sm text-destructive">{maintenanceForm.formState.errors.maintenance_description.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equipment_observations">Observações</Label>
                    <Textarea
                      id="equipment_observations"
                      {...maintenanceForm.register("equipment_observations")}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={maintenanceForm.formState.isSubmitting}>
                      {maintenanceForm.formState.isSubmitting ? "Enviando..." : "Confirmar Envio"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSelectedDecision(null)}>
                      Voltar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {selectedDecision === "return" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Retornar para Obra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={returnForm.handleSubmit(handleReturnToSite)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rental_company">Empresa *</Label>
                      <Input
                        id="rental_company"
                        {...returnForm.register("rental_company")}
                        placeholder="Nome da empresa"
                      />
                      {returnForm.formState.errors.rental_company && (
                        <p className="text-sm text-destructive">{returnForm.formState.errors.rental_company.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rental_work_site">Obra *</Label>
                      <Input
                        id="rental_work_site"
                        {...returnForm.register("rental_work_site")}
                        placeholder="Nome da obra"
                      />
                      {returnForm.formState.errors.rental_work_site && (
                        <p className="text-sm text-destructive">{returnForm.formState.errors.rental_work_site.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rental_start_date">Data Início *</Label>
                      <Input
                        id="rental_start_date"
                        type="date"
                        {...returnForm.register("rental_start_date")}
                      />
                      {returnForm.formState.errors.rental_start_date && (
                        <p className="text-sm text-destructive">{returnForm.formState.errors.rental_start_date.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rental_end_date">Data Fim</Label>
                      <Input
                        id="rental_end_date"
                        type="date"
                        {...returnForm.register("rental_end_date")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="malta_collaborator">Responsável Malta</Label>
                      <Input
                        id="malta_collaborator"
                        {...returnForm.register("malta_collaborator")}
                        placeholder="Nome do responsável"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="equipment_observations">Observações</Label>
                    <Textarea
                      id="equipment_observations"
                      {...returnForm.register("equipment_observations")}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={returnForm.formState.isSubmitting}>
                      {returnForm.formState.isSubmitting ? "Retornando..." : "Confirmar Retorno"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setSelectedDecision(null)}>
                      Voltar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
