import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Camera } from "lucide-react";
import { assetSchema, type AssetFormData } from "@/lib/validations";
import { useConfirm } from "@/hooks/useConfirm";
import { Html5QrcodeScanner } from "html5-qrcode";
import { formatInTimeZone } from "date-fns-tz";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetHistorySection } from "@/components/AssetHistorySection";

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const { ConfirmDialog, confirm } = useConfirm();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      location_type: "deposito_malta",
      available_for_rental: false,
      is_new_equipment: false,
    },
  });

  const locationType = watch("location_type");
  const isNewEquipment = watch("is_new_equipment");
  
  // Regra de negócio: bloquear campos quando status = "aguardando_laudo"
  const isAwaitingReport = locationType === "aguardando_laudo";

  useEffect(() => {
    if (id) {
      fetchAsset();
    } else {
      // Preencher código se vier da URL (do scanner)
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('code');
      if (codeFromUrl) {
        setValue('asset_code', codeFromUrl);
      }
    }
  }, [id]);

  const fetchAsset = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setValue("asset_code", data.asset_code);
        setValue("equipment_name", data.equipment_name);
        setValue("location_type", data.location_type as any);
        setValue("deposito_description", data.deposito_description || "");
        setValue("maintenance_company", data.maintenance_company || "");
        setValue("maintenance_work_site", data.maintenance_work_site || "");
        setValue("maintenance_description", data.maintenance_description || "");
        setValue("maintenance_arrival_date", data.maintenance_arrival_date || "");
        setValue("maintenance_departure_date", data.maintenance_departure_date || "");
        setValue("maintenance_delay_observations", data.maintenance_delay_observations || "");
        setValue("is_new_equipment", data.is_new_equipment ?? false);
        setValue("rental_company", data.rental_company || "");
        setValue("rental_work_site", data.rental_work_site || "");
        setValue("rental_start_date", data.rental_start_date || "");
        setValue("rental_end_date", data.rental_end_date || "");
        setValue("qr_code_data", data.qr_code_data || "");
        setValue("equipment_observations", data.equipment_observations || "");
      }
    } catch (error) {
      console.error("Erro ao buscar patrimônio:", error);
      toast.error("Erro ao carregar patrimônio");
      navigate("/assets");
    }
  };

  const startCamera = () => {
    setScanning(true);
    
    const scanner = new Html5QrcodeScanner(
      "qr-reader-form",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setValue('asset_code', decodedText);
        toast.success("QR Code lido com sucesso!");
        scanner.clear();
        setScanning(false);
      },
      (error) => {
        console.log("QR Code scan error:", error);
      }
    );
  };

  const onSubmit = async (data: AssetFormData) => {
    setLoading(true);
    try {
      const payload: any = {
        asset_code: data.asset_code,
        equipment_name: data.equipment_name,
        location_type: data.location_type,
        qr_code_data: data.qr_code_data || null,
        equipment_observations: data.equipment_observations || null,
      };

      // Limpar campos baseado no tipo de localização
      if (data.location_type === "deposito_malta") {
        payload.deposito_description = data.deposito_description || null;
        payload.maintenance_company = null;
        payload.maintenance_work_site = null;
        payload.maintenance_description = null;
        payload.maintenance_arrival_date = null;
        payload.maintenance_departure_date = null;
        payload.maintenance_delay_observations = null;
        payload.is_new_equipment = null;
        payload.rental_company = null;
        payload.rental_work_site = null;
        payload.rental_start_date = null;
        payload.rental_end_date = null;
      } else if (data.location_type === "em_manutencao") {
        payload.deposito_description = null;
        payload.maintenance_company = data.maintenance_company;
        payload.maintenance_work_site = data.maintenance_work_site;
        payload.maintenance_description = data.maintenance_description;
        payload.maintenance_arrival_date = data.maintenance_arrival_date || null;
        payload.maintenance_departure_date = data.maintenance_departure_date || null;
        payload.maintenance_delay_observations = data.maintenance_delay_observations || null;
        payload.is_new_equipment = data.is_new_equipment ?? false;
        payload.rental_company = null;
        payload.rental_work_site = null;
        payload.rental_start_date = null;
        payload.rental_end_date = null;
      } else if (data.location_type === "locacao") {
        payload.deposito_description = null;
        payload.maintenance_company = null;
        payload.maintenance_work_site = null;
        payload.maintenance_description = null;
        payload.maintenance_arrival_date = null;
        payload.maintenance_departure_date = null;
        payload.maintenance_delay_observations = null;
        payload.is_new_equipment = null;
        payload.rental_company = data.rental_company;
        payload.rental_work_site = data.rental_work_site;
        // Se não tiver data de início, usar a data atual de Belém/PA
        payload.rental_start_date = data.rental_start_date || formatInTimeZone(new Date(), "America/Belem", "yyyy-MM-dd");
        payload.rental_end_date = data.rental_end_date || null;
      } else if (data.location_type === "aguardando_laudo") {
        // Aguardando laudo: manter apenas o status, limpar os campos específicos
        payload.deposito_description = null;
        payload.maintenance_company = null;
        payload.maintenance_work_site = null;
        payload.maintenance_description = null;
        payload.maintenance_arrival_date = null;
        payload.maintenance_departure_date = null;
        payload.maintenance_delay_observations = null;
        payload.is_new_equipment = null;
        payload.rental_company = null;
        payload.rental_work_site = null;
        payload.rental_start_date = null;
        payload.rental_end_date = null;
      }

      if (id) {
        const { error } = await supabase
          .from("assets")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
        toast.success("Patrimônio atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("assets")
          .insert([payload]);

        if (error) throw error;
        toast.success("Patrimônio cadastrado com sucesso!");
      }

      navigate("/assets");
    } catch (error: any) {
      console.error("Erro ao salvar patrimônio:", error);
      toast.error(error.message || "Erro ao salvar patrimônio");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Excluir Patrimônio",
      description: "Tem certeza que deseja excluir este patrimônio? Esta ação não pode ser desfeita.",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Patrimônio excluído com sucesso!");
      navigate("/assets");
    } catch (error) {
      console.error("Erro ao excluir patrimônio:", error);
      toast.error("Erro ao excluir patrimônio");
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <ConfirmDialog />
      
      <Button
        variant="ghost"
        onClick={() => navigate("/assets")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      {id ? (
        <Tabs defaultValue="cadastro" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cadastro">Dados do Patrimônio</TabsTrigger>
            <TabsTrigger value="historico">Histórico de Alterações</TabsTrigger>
          </TabsList>

          <TabsContent value="cadastro">
            <Card className="p-6">
              <h1 className="text-2xl font-bold mb-6">Editar Patrimônio</h1>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="asset_code">Código do Patrimônio (PAT)*</Label>
            <div className="flex gap-2">
              <Input
                id="asset_code"
                {...register("asset_code")}
                placeholder="Ex: PAT001"
                disabled={scanning}
              />
              <Button
                type="button"
                variant="outline"
                onClick={startCamera}
                disabled={scanning}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            {scanning && (
              <div className="mt-4">
                <div
                  id="qr-reader-form"
                  className="w-full rounded-lg overflow-hidden"
                />
                <Button
                  type="button"
                  onClick={() => setScanning(false)}
                  variant="outline"
                  className="w-full mt-2"
                >
                  Cancelar Scanner
                </Button>
              </div>
            )}
            {errors.asset_code && (
              <p className="text-sm text-destructive">{errors.asset_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_name">Nome do Equipamento*</Label>
            <Input
              id="equipment_name"
              {...register("equipment_name")}
              placeholder="Ex: Notebook Dell Latitude"
              disabled={isAwaitingReport}
            />
            {errors.equipment_name && (
              <p className="text-sm text-destructive">{errors.equipment_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_type">Local do Equipamento*</Label>
            <Select
              value={locationType}
              onValueChange={(value) => setValue("location_type", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o local" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deposito_malta">Depósito Malta</SelectItem>
                <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                <SelectItem value="locacao">Locação</SelectItem>
                <SelectItem value="aguardando_laudo">Aguardando Laudo</SelectItem>
              </SelectContent>
            </Select>
            {errors.location_type && (
              <p className="text-sm text-destructive">{errors.location_type.message}</p>
            )}
            {isAwaitingReport && (
              <p className="text-sm text-amber-600">
                ⚠️ Equipamento aguardando laudo. Apenas o campo "Local do Equipamento" pode ser editado.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_observations">Observação</Label>
            <Textarea
              id="equipment_observations"
              {...register("equipment_observations")}
              placeholder="Comentários sobre o equipamento"
              rows={3}
              disabled={isAwaitingReport}
            />
            {errors.equipment_observations && (
              <p className="text-sm text-destructive">{errors.equipment_observations.message}</p>
            )}
          </div>

          {locationType === "deposito_malta" && (
            <div className="space-y-2">
              <Label htmlFor="deposito_description">Descrição</Label>
              <Textarea
                id="deposito_description"
                {...register("deposito_description")}
                placeholder="Informações adicionais sobre o equipamento"
                rows={3}
                disabled={isAwaitingReport}
              />
              {errors.deposito_description && (
                <p className="text-sm text-destructive">{errors.deposito_description.message}</p>
              )}
            </div>
          )}

          {locationType === "em_manutencao" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="maintenance_company">Empresa*</Label>
                <Input
                  id="maintenance_company"
                  {...register("maintenance_company")}
                  placeholder="Ex: Construtora ABC"
                  disabled={isAwaitingReport}
                />
                {errors.maintenance_company && (
                  <p className="text-sm text-destructive">{errors.maintenance_company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_work_site">Obra*</Label>
                <Input
                  id="maintenance_work_site"
                  {...register("maintenance_work_site")}
                  placeholder="Ex: Obra Centro"
                  disabled={isAwaitingReport}
                />
                {errors.maintenance_work_site && (
                  <p className="text-sm text-destructive">{errors.maintenance_work_site.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_description">Descrição/Motivo*</Label>
                <Textarea
                  id="maintenance_description"
                  {...register("maintenance_description")}
                  placeholder="Descreva o motivo da manutenção"
                  rows={3}
                  disabled={isAwaitingReport}
                />
                {errors.maintenance_description && (
                  <p className="text-sm text-destructive">{errors.maintenance_description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance_arrival_date">Data de Chegada*</Label>
                  <Input
                    id="maintenance_arrival_date"
                    type="date"
                    {...register("maintenance_arrival_date")}
                    disabled={isAwaitingReport}
                  />
                  {errors.maintenance_arrival_date && (
                    <p className="text-sm text-destructive">{errors.maintenance_arrival_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance_departure_date">Data de Saída</Label>
                  <Input
                    id="maintenance_departure_date"
                    type="date"
                    {...register("maintenance_departure_date")}
                    disabled={isAwaitingReport}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional - será preenchida quando o equipamento sair da manutenção
                  </p>
                </div>
              </div>

              {watch("maintenance_arrival_date") && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Tempo em Manutenção</p>
                  <p className="text-2xl font-bold">
                    {(() => {
                      const arrival = new Date(watch("maintenance_arrival_date") || "");
                      const departure = watch("maintenance_departure_date") 
                        ? new Date(watch("maintenance_departure_date") || "")
                        : new Date();
                      const diffTime = Math.abs(departure.getTime() - arrival.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                    })()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="maintenance_delay_observations">Observações sobre o Tempo de Manutenção</Label>
                <Textarea
                  id="maintenance_delay_observations"
                  {...register("maintenance_delay_observations")}
                  placeholder="Descreva o que causou atraso, se houver"
                  rows={3}
                  disabled={isAwaitingReport}
                />
                <p className="text-xs text-muted-foreground">
                  Utilize para documentar atrasos ou observações sobre o tempo de manutenção
                </p>
                {errors.maintenance_delay_observations && (
                  <p className="text-sm text-destructive">{errors.maintenance_delay_observations.message}</p>
                )}
              </div>
            </>
          )}

          {locationType === "locacao" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rental_company">Empresa*</Label>
                <Input
                  id="rental_company"
                  {...register("rental_company")}
                  placeholder="Ex: Construtora ABC"
                  disabled={isAwaitingReport}
                />
                {errors.rental_company && (
                  <p className="text-sm text-destructive">{errors.rental_company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_work_site">Obra*</Label>
                <Input
                  id="rental_work_site"
                  {...register("rental_work_site")}
                  placeholder="Ex: Obra Centro"
                  disabled={isAwaitingReport}
                />
                {errors.rental_work_site && (
                  <p className="text-sm text-destructive">{errors.rental_work_site.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rental_start_date">Data Inicial*</Label>
                  <Input
                    id="rental_start_date"
                    type="date"
                    {...register("rental_start_date")}
                    disabled={isAwaitingReport}
                  />
                  {errors.rental_start_date && (
                    <p className="text-sm text-destructive">{errors.rental_start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rental_end_date">Data Final (Devolução)</Label>
                  <Input
                    id="rental_end_date"
                    type="date"
                    {...register("rental_end_date")}
                    disabled={isAwaitingReport}
                  />
                  <p className="text-xs text-muted-foreground">
                    Será preenchida quando o equipamento for devolvido
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_new_equipment"
              checked={isNewEquipment}
              onCheckedChange={(checked) => setValue("is_new_equipment", checked as boolean)}
              disabled={isAwaitingReport}
            />
            <Label htmlFor="is_new_equipment" className="font-normal cursor-pointer">
              Equipamento Novo
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Atualizar"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </div>
        </form>
      </Card>
    </TabsContent>

    <TabsContent value="historico">
      <AssetHistorySection assetId={id} />
    </TabsContent>
  </Tabs>
) : (
  <Card className="p-6">
    <h1 className="text-2xl font-bold mb-6">Cadastrar Patrimônio</h1>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ... keep existing code (campos do formulário de cadastro) */}
      <div className="space-y-2">
        <Label htmlFor="asset_code">Código do Patrimônio (PAT)*</Label>
        <div className="flex gap-2">
          <Input
            id="asset_code"
            {...register("asset_code")}
            placeholder="Ex: PAT001"
            disabled={scanning}
          />
          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            disabled={scanning}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
        {scanning && (
          <div className="mt-4">
            <div
              id="qr-reader-form"
              className="w-full rounded-lg overflow-hidden"
            />
            <Button
              type="button"
              onClick={() => setScanning(false)}
              variant="outline"
              className="w-full mt-2"
            >
              Cancelar Scanner
            </Button>
          </div>
        )}
        {errors.asset_code && (
          <p className="text-sm text-destructive">{errors.asset_code.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipment_name">Nome do Equipamento*</Label>
        <Input
          id="equipment_name"
          {...register("equipment_name")}
          placeholder="Ex: Notebook Dell Latitude"
        />
        {errors.equipment_name && (
          <p className="text-sm text-destructive">{errors.equipment_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_type">Local do Equipamento*</Label>
        <Select
          value={locationType}
          onValueChange={(value) => setValue("location_type", value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o local" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deposito_malta">Depósito Malta</SelectItem>
            <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
            <SelectItem value="locacao">Locação</SelectItem>
            <SelectItem value="aguardando_laudo">Aguardando Laudo</SelectItem>
          </SelectContent>
        </Select>
        {errors.location_type && (
          <p className="text-sm text-destructive">{errors.location_type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipment_observations">Observação</Label>
        <Textarea
          id="equipment_observations"
          {...register("equipment_observations")}
          placeholder="Comentários sobre o equipamento"
          rows={3}
        />
        {errors.equipment_observations && (
          <p className="text-sm text-destructive">{errors.equipment_observations.message}</p>
        )}
      </div>

      {locationType === "deposito_malta" && (
        <div className="space-y-2">
          <Label htmlFor="deposito_description">Descrição</Label>
          <Textarea
            id="deposito_description"
            {...register("deposito_description")}
            placeholder="Informações adicionais sobre o equipamento"
            rows={3}
          />
          {errors.deposito_description && (
            <p className="text-sm text-destructive">{errors.deposito_description.message}</p>
          )}
        </div>
      )}

      {locationType === "em_manutencao" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="maintenance_company">Empresa*</Label>
            <Input
              id="maintenance_company"
              {...register("maintenance_company")}
              placeholder="Ex: Construtora ABC"
            />
            {errors.maintenance_company && (
              <p className="text-sm text-destructive">{errors.maintenance_company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_work_site">Obra*</Label>
            <Input
              id="maintenance_work_site"
              {...register("maintenance_work_site")}
              placeholder="Ex: Obra Centro"
            />
            {errors.maintenance_work_site && (
              <p className="text-sm text-destructive">{errors.maintenance_work_site.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_description">Descrição/Motivo*</Label>
            <Textarea
              id="maintenance_description"
              {...register("maintenance_description")}
              placeholder="Descreva o motivo da manutenção"
              rows={3}
            />
            {errors.maintenance_description && (
              <p className="text-sm text-destructive">{errors.maintenance_description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance_arrival_date">Data de Chegada*</Label>
              <Input
                id="maintenance_arrival_date"
                type="date"
                {...register("maintenance_arrival_date")}
              />
              {errors.maintenance_arrival_date && (
                <p className="text-sm text-destructive">{errors.maintenance_arrival_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_departure_date">Data de Saída</Label>
              <Input
                id="maintenance_departure_date"
                type="date"
                {...register("maintenance_departure_date")}
              />
              <p className="text-xs text-muted-foreground">
                Opcional - será preenchida quando o equipamento sair da manutenção
              </p>
            </div>
          </div>

          {watch("maintenance_arrival_date") && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Tempo em Manutenção</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const arrival = new Date(watch("maintenance_arrival_date") || "");
                  const departure = watch("maintenance_departure_date") 
                    ? new Date(watch("maintenance_departure_date") || "")
                    : new Date();
                  const diffTime = Math.abs(departure.getTime() - arrival.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                })()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maintenance_delay_observations">Observações sobre o Tempo de Manutenção</Label>
            <Textarea
              id="maintenance_delay_observations"
              {...register("maintenance_delay_observations")}
              placeholder="Descreva o que causou atraso, se houver"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Utilize para documentar atrasos ou observações sobre o tempo de manutenção
            </p>
            {errors.maintenance_delay_observations && (
              <p className="text-sm text-destructive">{errors.maintenance_delay_observations.message}</p>
            )}
          </div>
        </>
      )}

      {locationType === "locacao" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="rental_company">Empresa*</Label>
            <Input
              id="rental_company"
              {...register("rental_company")}
              placeholder="Ex: Construtora ABC"
            />
            {errors.rental_company && (
              <p className="text-sm text-destructive">{errors.rental_company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental_work_site">Obra*</Label>
            <Input
              id="rental_work_site"
              {...register("rental_work_site")}
              placeholder="Ex: Obra Centro"
            />
            {errors.rental_work_site && (
              <p className="text-sm text-destructive">{errors.rental_work_site.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rental_start_date">Data Inicial*</Label>
              <Input
                id="rental_start_date"
                type="date"
                {...register("rental_start_date")}
              />
              {errors.rental_start_date && (
                <p className="text-sm text-destructive">{errors.rental_start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rental_end_date">Data Final (Devolução)</Label>
              <Input
                id="rental_end_date"
                type="date"
                {...register("rental_end_date")}
              />
              <p className="text-xs text-muted-foreground">
                Será preenchida quando o equipamento for devolvido
              </p>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_new_equipment"
          checked={isNewEquipment}
          onCheckedChange={(checked) => setValue("is_new_equipment", checked as boolean)}
        />
        <Label htmlFor="is_new_equipment" className="font-normal cursor-pointer">
          Equipamento Novo
        </Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Salvando..." : "Cadastrar"}
        </Button>
      </div>
    </form>
  </Card>
)}
</div>
);
}