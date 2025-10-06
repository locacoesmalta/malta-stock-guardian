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
  movementRetornoObraSchema,
  type MovementDepositoFormData,
  type MovementManutencaoFormData,
  type MovementLocacaoFormData,
  type MovementAguardandoLaudoFormData,
  type MovementRetornoObraFormData,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";

type MovementType = "deposito_malta" | "em_manutencao" | "locacao" | "aguardando_laudo" | "retorno_obra";

export default function AssetMovement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();
  const [movementType, setMovementType] = useState<MovementType>("deposito_malta");
  const [photoFile1, setPhotoFile1] = useState<File | null>(null);
  const [photoFile2, setPhotoFile2] = useState<File | null>(null);
  const [photoPreview1, setPhotoPreview1] = useState<string | null>(null);
  const [photoPreview2, setPhotoPreview2] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [partsReplaced, setPartsReplaced] = useState<boolean | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

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
      case "retorno_obra": return movementRetornoObraSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
  });

  // Buscar retiradas de material quando selecionar "Foi trocada peça: Sim"
  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (partsReplaced === true && asset) {
        setLoadingWithdrawals(true);
        try {
          const { data, error } = await supabase
            .from("material_withdrawals")
            .select(`
              *,
              products:product_id (
                name,
                code
              )
            `)
            .eq("equipment_code", asset.asset_code)
            .order("created_at", { ascending: false });

          if (error) throw error;
          setWithdrawals(data || []);
        } catch (error) {
          console.error("Erro ao buscar retiradas:", error);
          toast.error("Erro ao buscar retiradas de material");
        } finally {
          setLoadingWithdrawals(false);
        }
      } else {
        setWithdrawals([]);
      }
    };

    fetchWithdrawals();
  }, [partsReplaced, asset]);

  useEffect(() => {
    form.reset({});
    setPartsReplaced(null);
    setWithdrawals([]);
    
    // Auto-preencher dados quando for manutenção
    if (movementType === "em_manutencao" && asset) {
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Determinar empresa e obra baseado na localização atual
      let company = "";
      let workSite = "";
      
      if (asset.location_type === "locacao") {
        company = asset.rental_company || "";
        workSite = asset.rental_work_site || "";
      } else if (asset.location_type === "em_manutencao") {
        company = asset.maintenance_company || "";
        workSite = asset.maintenance_work_site || "";
      }
      
      form.reset({
        maintenance_company: company,
        maintenance_work_site: workSite,
        maintenance_arrival_date: currentDate,
      });
    }
  }, [movementType, form, asset]);

  const handlePhotoChange = (file: File | null, photoNumber: 1 | 2) => {
    if (photoNumber === 1) {
      setPhotoFile1(file);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview1(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPhotoPreview1(null);
      }
    } else {
      setPhotoFile2(file);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview2(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPhotoPreview2(null);
      }
    }
  };

  const uploadPhoto = async (file: File, photoNumber: 1 | 2): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${asset?.asset_code}_rental_${photoNumber}_${Date.now()}.${fileExt}`;
      const filePath = `rental-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error(`Erro ao fazer upload da foto ${photoNumber}:`, error);
      toast.error(`Erro ao fazer upload da foto ${photoNumber}`);
      return null;
    }
  };

  const onSubmit = async (data: any) => {
    if (!asset || !user) return;

    try {
      setIsUploading(true);
      console.log("Form data received:", data);
      console.log("Movement type:", movementType);

      // Validar retiradas para Retorno para Obra
      if (movementType === "retorno_obra" && data.parts_replaced === true) {
        if (withdrawals.length === 0) {
          toast.error("Não há retiradas de material cadastradas para este equipamento. Cadastre as peças retiradas antes de continuar.");
          return;
        }
      }
      
      const updateData: any = {
        // Retorno para obra NÃO altera o location_type
        ...(movementType !== "retorno_obra" && { location_type: movementType }),
        ...data,
      };

      // Upload de fotos para locação
      if (movementType === "locacao") {
        if (photoFile1) {
          const url1 = await uploadPhoto(photoFile1, 1);
          if (url1) updateData.rental_photo_1 = url1;
        }
        if (photoFile2) {
          const url2 = await uploadPhoto(photoFile2, 2);
          if (url2) updateData.rental_photo_2 = url2;
        }
      }

      // Converter strings vazias de datas para null
      if (updateData.maintenance_departure_date === "") {
        updateData.maintenance_departure_date = null;
      }
      if (updateData.rental_end_date === "") {
        updateData.rental_end_date = null;
      }
      if (updateData.purchase_date === "") {
        updateData.purchase_date = null;
      }

      // Se for para aguardando laudo, setar inspection_start_date
      if (movementType === "aguardando_laudo") {
        updateData.inspection_start_date = new Date().toISOString();
      }

      // Limpar campos de outros tipos de movimento
      if (movementType === "deposito_malta") {
        // Arquivar dados antigos antes de limpar
        const historicoDetalhes = [];
        if (asset.rental_company) historicoDetalhes.push(`Empresa Locação: ${asset.rental_company}`);
        if (asset.rental_work_site) historicoDetalhes.push(`Obra Locação: ${asset.rental_work_site}`);
        if (asset.rental_start_date) historicoDetalhes.push(`Data Início: ${asset.rental_start_date}`);
        if (asset.rental_end_date) historicoDetalhes.push(`Data Fim: ${asset.rental_end_date}`);
        if (asset.maintenance_company) historicoDetalhes.push(`Empresa Manutenção: ${asset.maintenance_company}`);
        if (asset.maintenance_work_site) historicoDetalhes.push(`Obra Manutenção: ${asset.maintenance_work_site}`);
        
        if (historicoDetalhes.length > 0) {
          await registrarEvento({
            patId: asset.id,
            codigoPat: asset.asset_code,
            tipoEvento: "ARQUIVAMENTO",
            detalhesEvento: `Dados arquivados antes do retorno ao Depósito Malta: ${historicoDetalhes.join(", ")}`,
          });
        }
        
        updateData.rental_company = null;
        updateData.rental_work_site = null;
        updateData.rental_start_date = null;
        updateData.rental_end_date = null;
        updateData.rental_contract_number = null;
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

      console.log("Update data to be sent:", updateData);
      
      const { error: updateError } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        throw updateError;
      }

      const locationLabels: Record<MovementType, string> = {
        deposito_malta: "Depósito Malta",
        em_manutencao: "Em Manutenção",
        locacao: "Locação",
        aguardando_laudo: "Aguardando Laudo",
        retorno_obra: "Retorno para Obra",
      };

      // Para Retorno para Obra, registrar evento diferente
      if (movementType === "retorno_obra") {
        const detalhes = data.parts_replaced 
          ? `Retorno para obra COM troca de peças. Peças retiradas: ${withdrawals.map(w => w.products?.name).join(", ")}`
          : `Retorno para obra SEM troca de peças. Observações: ${data.equipment_observations || "Nenhuma"}`;
        
        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "RETORNO PARA OBRA",
          detalhesEvento: detalhes,
        });
      } else {
        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "MOVIMENTAÇÃO",
          detalhesEvento: `Equipamento movido para ${locationLabels[movementType]}`,
          campoAlterado: "location_type",
          valorAntigo: asset.location_type,
          valorNovo: movementType,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["asset", id] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });

      toast.success("Movimentação registrada com sucesso");
      navigate(`/assets/view/${id}`);
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error);
      toast.error("Erro ao registrar movimentação");
    } finally {
      setIsUploading(false);
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
              <SelectItem value="retorno_obra">Retorno para Obra</SelectItem>
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
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Equipamento foi lavado?</Label>
                    <RadioGroup
                      onValueChange={(value) => form.setValue("was_washed", value === "true")}
                      defaultValue="false"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="washed-yes" />
                        <Label htmlFor="washed-yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="washed-no" />
                        <Label htmlFor="washed-no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>Equipamento foi pintado?</Label>
                    <RadioGroup
                      onValueChange={(value) => form.setValue("was_painted", value === "true")}
                      defaultValue="false"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="painted-yes" />
                        <Label htmlFor="painted-yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="painted-no" />
                        <Label htmlFor="painted-no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

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
                    <Label htmlFor="maintenance_company">Empresa *</Label>
                    <Input
                      id="maintenance_company"
                      {...form.register("maintenance_company")}
                      placeholder="Nome da empresa"
                    />
                    <p className="text-xs text-muted-foreground">
                      Preenchido automaticamente do cadastro do equipamento
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      Preenchido automaticamente do cadastro do equipamento
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                      Data de hoje preenchida automaticamente
                    </p>
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
                    <Label htmlFor="rental_contract_number">Número do Contrato *</Label>
                    <Input
                      id="rental_contract_number"
                      {...form.register("rental_contract_number")}
                      placeholder="Número do contrato de locação"
                    />
                    {form.formState.errors.rental_contract_number && (
                      <p className="text-sm text-destructive">{form.formState.errors.rental_contract_number.message as string}</p>
                    )}
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

                {/* Upload de Fotos */}
                <div className="space-y-4 pt-4 border-t">
                  <Label>Fotos da Locação (Opcionais)</Label>
                  <p className="text-sm text-muted-foreground">
                    Recomendado: imagens no formato paisagem (proporção 16:9)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Foto 1 */}
                    <div className="space-y-2">
                      <Label htmlFor="rental_photo_1">Foto 1</Label>
                      {!photoPreview1 ? (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                          <Input
                            id="rental_photo_1"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoChange(file, 1);
                            }}
                          />
                          <Label htmlFor="rental_photo_1" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                          </Label>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={photoPreview1}
                            alt="Preview 1"
                            className="w-full h-48 object-cover rounded-lg border"
                            style={{ aspectRatio: '16/9' }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handlePhotoChange(null, 1)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Foto 2 */}
                    <div className="space-y-2">
                      <Label htmlFor="rental_photo_2">Foto 2</Label>
                      {!photoPreview2 ? (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                          <Input
                            id="rental_photo_2"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoChange(file, 2);
                            }}
                          />
                          <Label htmlFor="rental_photo_2" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                          </Label>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={photoPreview2}
                            alt="Preview 2"
                            className="w-full h-48 object-cover rounded-lg border"
                            style={{ aspectRatio: '16/9' }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handlePhotoChange(null, 2)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {movementType === "retorno_obra" && (
              <>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Foi trocada peça? *</Label>
                    <RadioGroup
                      onValueChange={(value) => {
                        const boolValue = value === "true";
                        setPartsReplaced(boolValue);
                        form.setValue("parts_replaced", boolValue);
                      }}
                      value={partsReplaced === null ? undefined : String(partsReplaced)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="true" id="parts-yes" />
                        <Label htmlFor="parts-yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="false" id="parts-no" />
                        <Label htmlFor="parts-no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {partsReplaced === true && (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                      <Label>Peças Retiradas do Estoque</Label>
                      {loadingWithdrawals ? (
                        <p className="text-sm text-muted-foreground">Carregando peças...</p>
                      ) : withdrawals.length === 0 ? (
                        <div className="p-3 border border-destructive bg-destructive/10 rounded-md">
                          <p className="text-sm text-destructive font-medium">
                            ⚠️ Nenhuma retirada de material encontrada para este equipamento (PAT: {asset.asset_code})
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            É necessário cadastrar as peças retiradas antes de finalizar o retorno para obra.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {withdrawals.map((withdrawal) => (
                            <div key={withdrawal.id} className="flex justify-between items-center p-2 bg-background rounded border">
                              <div>
                                <p className="font-medium">{withdrawal.products?.name || "Produto não encontrado"}</p>
                                <p className="text-sm text-muted-foreground">
                                  Código: {withdrawal.products?.code} | Quantidade: {withdrawal.quantity}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Data: {new Date(withdrawal.withdrawal_date).toLocaleDateString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {partsReplaced === false && (
                    <div className="space-y-2">
                      <Label htmlFor="equipment_observations">Observações *</Label>
                      <Textarea
                        id="equipment_observations"
                        {...form.register("equipment_observations")}
                        placeholder="Descreva o motivo de não ter trocado peças..."
                        rows={3}
                      />
                      {form.formState.errors.equipment_observations && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.equipment_observations.message as string}
                        </p>
                      )}
                    </div>
                  )}

                  {partsReplaced !== null && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="malta_collaborator">Responsável Malta</Label>
                        <Input
                          id="malta_collaborator"
                          {...form.register("malta_collaborator")}
                          placeholder="Nome do responsável"
                        />
                      </div>
                    </>
                  )}
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
              <Button type="submit" disabled={form.formState.isSubmitting || isUploading}>
                {form.formState.isSubmitting || isUploading ? "Registrando..." : "Registrar Movimentação"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/assets/view/${id}`)}
                disabled={form.formState.isSubmitting || isUploading}
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
