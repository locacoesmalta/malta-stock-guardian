import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import {
  movementDepositoSchema,
  movementManutencaoSchema,
  movementLocacaoSchema,
  movementAguardandoLaudoSchema,
  type MovementDepositoFormData,
  type MovementManutencaoFormData,
  type MovementLocacaoFormData,
  type MovementAguardandoLaudoFormData,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type MovementType = "deposito_malta" | "em_manutencao" | "locacao" | "aguardando_laudo";

export default function AssetMovement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();
  const [movementType, setMovementType] = useState<MovementType>("deposito_malta");

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

  // Bloquear movimentação se equipamento estiver em laudo
  useEffect(() => {
    if (asset && asset.location_type === "aguardando_laudo") {
      toast.error("Equipamento em laudo deve passar pela Decisão Pós-Laudo");
      navigate(`/assets/post-inspection/${id}`);
    }
  }, [asset, id, navigate]);

  const getSchema = () => {
    switch (movementType) {
      case "deposito_malta": return movementDepositoSchema;
      case "em_manutencao": return movementManutencaoSchema;
      case "locacao": return movementLocacaoSchema;
      case "aguardando_laudo": return movementAguardandoLaudoSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
  });

  useEffect(() => {
    form.reset({});
  }, [movementType, form]);

  const onSubmit = async (data: any) => {
    if (!asset || !user) return;

    try {
      const updateData: any = {
        location_type: movementType,
        ...data,
      };

      // Se for para aguardando laudo, setar inspection_start_date
      if (movementType === "aguardando_laudo") {
        updateData.inspection_start_date = new Date().toISOString();
      }

      // Limpar campos de outros tipos de movimento
      if (movementType === "deposito_malta") {
        updateData.rental_company = null;
        updateData.rental_work_site = null;
        updateData.rental_start_date = null;
        updateData.rental_end_date = null;
        updateData.maintenance_company = null;
        updateData.maintenance_work_site = null;
        updateData.maintenance_description = null;
        updateData.maintenance_arrival_date = null;
        updateData.maintenance_departure_date = null;
        updateData.maintenance_delay_observations = null;
        updateData.returns_to_work_site = null;
        updateData.destination_after_maintenance = null;
        updateData.was_replaced = null;
        updateData.replacement_reason = null;
        updateData.is_new_equipment = null;
      } else if (movementType === "em_manutencao") {
        updateData.rental_company = null;
        updateData.rental_work_site = null;
        updateData.rental_start_date = null;
        updateData.rental_end_date = null;
        updateData.deposito_description = null;
      } else if (movementType === "locacao") {
        updateData.deposito_description = null;
        updateData.maintenance_company = null;
        updateData.maintenance_work_site = null;
        updateData.maintenance_description = null;
        updateData.maintenance_arrival_date = null;
        updateData.maintenance_departure_date = null;
        updateData.maintenance_delay_observations = null;
        updateData.returns_to_work_site = null;
        updateData.destination_after_maintenance = null;
        updateData.was_replaced = null;
        updateData.replacement_reason = null;
        updateData.is_new_equipment = null;
      } else if (movementType === "aguardando_laudo") {
        updateData.deposito_description = null;
        updateData.rental_company = null;
        updateData.rental_work_site = null;
        updateData.rental_start_date = null;
        updateData.rental_end_date = null;
        updateData.maintenance_company = null;
        updateData.maintenance_work_site = null;
        updateData.maintenance_description = null;
        updateData.maintenance_arrival_date = null;
        updateData.maintenance_departure_date = null;
        updateData.maintenance_delay_observations = null;
        updateData.returns_to_work_site = null;
        updateData.destination_after_maintenance = null;
        updateData.was_replaced = null;
        updateData.replacement_reason = null;
        updateData.is_new_equipment = null;
      }

      const { error: updateError } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      const locationLabels: Record<MovementType, string> = {
        deposito_malta: "Depósito Malta",
        em_manutencao: "Em Manutenção",
        locacao: "Locação",
        aguardando_laudo: "Aguardando Laudo",
      };

      await registrarEvento({
        patId: asset.id,
        codigoPat: asset.asset_code,
        tipoEvento: "MOVIMENTAÇÃO",
        detalhesEvento: `Equipamento movido para ${locationLabels[movementType]}`,
        campoAlterado: "location_type",
        valorAntigo: asset.location_type,
        valorNovo: movementType,
      });

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });

      toast.success("Movimentação registrada com sucesso");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      toast.error("Erro ao registrar movimentação");
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

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/assets/view/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Registrar Movimentação</h1>
          <p className="text-muted-foreground">{asset.equipment_name} - PAT: {asset.asset_code}</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tipo de Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={movementType} onValueChange={(value) => setMovementType(value as MovementType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deposito_malta">Retorno ao Depósito Malta</SelectItem>
              <SelectItem value="em_manutencao">Envio para Manutenção</SelectItem>
              <SelectItem value="locacao">Saída para Locação</SelectItem>
              <SelectItem value="aguardando_laudo">Aguardando Laudo</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {movementType === "deposito_malta" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deposito_description">Descrição</Label>
                  <Textarea
                    id="deposito_description"
                    {...form.register("deposito_description")}
                    placeholder="Descrição do retorno..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="malta_collaborator">Responsável Malta</Label>
                  <Input
                    id="malta_collaborator"
                    {...form.register("malta_collaborator")}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_observations">Observações</Label>
                  <Textarea
                    id="equipment_observations"
                    {...form.register("equipment_observations")}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {movementType === "em_manutencao" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_company">Empresa de Manutenção *</Label>
                    <Input
                      id="maintenance_company"
                      {...form.register("maintenance_company")}
                      placeholder="Nome da empresa"
                    />
                    {form.formState.errors.maintenance_company && (
                      <p className="text-sm text-destructive">{form.formState.errors.maintenance_company.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_work_site">Obra *</Label>
                    <Input
                      id="maintenance_work_site"
                      {...form.register("maintenance_work_site")}
                      placeholder="Nome da obra"
                    />
                    {form.formState.errors.maintenance_work_site && (
                      <p className="text-sm text-destructive">{form.formState.errors.maintenance_work_site.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_arrival_date">Data de Chegada *</Label>
                    <Input
                      id="maintenance_arrival_date"
                      type="date"
                      {...form.register("maintenance_arrival_date")}
                    />
                    {form.formState.errors.maintenance_arrival_date && (
                      <p className="text-sm text-destructive">{form.formState.errors.maintenance_arrival_date.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_departure_date">Previsão de Saída</Label>
                    <Input
                      id="maintenance_departure_date"
                      type="date"
                      {...form.register("maintenance_departure_date")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="malta_collaborator">Responsável Malta</Label>
                    <Input
                      id="malta_collaborator"
                      {...form.register("malta_collaborator")}
                      placeholder="Nome do responsável"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance_description">Descrição *</Label>
                  <Textarea
                    id="maintenance_description"
                    {...form.register("maintenance_description")}
                    placeholder="Descrição da manutenção..."
                    rows={3}
                  />
                  {form.formState.errors.maintenance_description && (
                    <p className="text-sm text-destructive">{form.formState.errors.maintenance_description.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_observations">Observações</Label>
                  <Textarea
                    id="equipment_observations"
                    {...form.register("equipment_observations")}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {movementType === "locacao" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rental_company">Empresa *</Label>
                    <Input
                      id="rental_company"
                      {...form.register("rental_company")}
                      placeholder="Nome da empresa"
                    />
                    {form.formState.errors.rental_company && (
                      <p className="text-sm text-destructive">{form.formState.errors.rental_company.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rental_work_site">Obra *</Label>
                    <Input
                      id="rental_work_site"
                      {...form.register("rental_work_site")}
                      placeholder="Nome da obra"
                    />
                    {form.formState.errors.rental_work_site && (
                      <p className="text-sm text-destructive">{form.formState.errors.rental_work_site.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rental_start_date">Data Início *</Label>
                    <Input
                      id="rental_start_date"
                      type="date"
                      {...form.register("rental_start_date")}
                    />
                    {form.formState.errors.rental_start_date && (
                      <p className="text-sm text-destructive">{form.formState.errors.rental_start_date.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rental_end_date">Data Fim</Label>
                    <Input
                      id="rental_end_date"
                      type="date"
                      {...form.register("rental_end_date")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="malta_collaborator">Responsável Malta</Label>
                    <Input
                      id="malta_collaborator"
                      {...form.register("malta_collaborator")}
                      placeholder="Nome do responsável"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_observations">Observações</Label>
                  <Textarea
                    id="equipment_observations"
                    {...form.register("equipment_observations")}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {movementType === "aguardando_laudo" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="malta_collaborator">Responsável Malta</Label>
                  <Input
                    id="malta_collaborator"
                    {...form.register("malta_collaborator")}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_observations">Observações</Label>
                  <Textarea
                    id="equipment_observations"
                    {...form.register("equipment_observations")}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Registrando..." : "Registrar Movimentação"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/assets/view/${id}`)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
