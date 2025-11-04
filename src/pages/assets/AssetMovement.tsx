import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { QRScanner } from "@/components/QRScanner";
import { formatPAT } from "@/lib/patUtils";

import {
  movementDepositoSchema,
  movementManutencaoSchema,
  movementLocacaoSchema,
  movementAguardandoLaudoSchema,
  movementRetornoObraSchema,
  movementSubstituicaoSchema,
  type MovementDepositoFormData,
  type MovementManutencaoFormData,
  type MovementLocacaoFormData,
  type MovementAguardandoLaudoFormData,
  type MovementRetornoObraFormData,
  type MovementSubstituicaoFormData,
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
import { ArrowLeft, Upload, X, QrCode } from "lucide-react";
import { AssetCollaboratorsManager } from "@/components/AssetCollaboratorsManager";

type MovementType = "deposito_malta" | "em_manutencao" | "locacao" | "aguardando_laudo" | "retorno_obra" | "substituicao";

export default function AssetMovement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { registrarEvento } = useAssetHistory();
  
  const [movementType, setMovementType] = useState<MovementType | null>(null);
  const [photoFile1, setPhotoFile1] = useState<File | null>(null);
  const [photoFile2, setPhotoFile2] = useState<File | null>(null);
  const [photoPreview1, setPhotoPreview1] = useState<string | null>(null);
  const [photoPreview2, setPhotoPreview2] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [partsReplaced, setPartsReplaced] = useState<boolean | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [substituteAssetCode, setSubstituteAssetCode] = useState("");
  const [substituteAsset, setSubstituteAsset] = useState<any>(null);
  const [loadingSubstitute, setLoadingSubstitute] = useState(false);
  const [substituteNotFound, setSubstituteNotFound] = useState(false);
  const [replacedAssetToReturn, setReplacedAssetToReturn] = useState<any>(null);
  const [replacedAssetReturnDecision, setReplacedAssetReturnDecision] = useState<boolean | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  

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

  // Forçar "aguardando_laudo" para equipamentos em locação
  useEffect(() => {
    if (asset && asset.location_type === "locacao" && movementType === null) {
      setMovementType("aguardando_laudo");
      toast.info("Equipamento em locação deve passar por laudo antes de qualquer movimentação");
    }
  }, [asset, movementType]);

  const getSchema = () => {
    switch (movementType) {
      case "deposito_malta": return movementDepositoSchema;
      case "em_manutencao": return movementManutencaoSchema;
      case "locacao": return movementLocacaoSchema;
      case "aguardando_laudo": return movementAguardandoLaudoSchema;
      case "retorno_obra": return movementRetornoObraSchema;
      case "substituicao": return movementSubstituicaoSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
  });

  // Preencher automaticamente empresa e obra para retorno_obra
  useEffect(() => {
    if (asset && movementType === "retorno_obra" && asset.rental_company && asset.rental_work_site) {
      form.setValue("rental_company", asset.rental_company);
      form.setValue("rental_work_site", asset.rental_work_site);
    }
  }, [asset, movementType, form]);

  // Buscar equipamento substituto quando digitar PAT
  const handleSearchSubstitute = async () => {
    if (!substituteAssetCode.trim()) {
      toast.error("Digite o PAT do equipamento substituto");
      return;
    }

    // Formatar PAT com 6 dígitos (adicionar zeros à esquerda)
    const formattedPAT = substituteAssetCode.trim().padStart(6, '0');
    setSubstituteAssetCode(formattedPAT);

    setLoadingSubstitute(true);
    setSubstituteNotFound(false);
    setSubstituteAsset(null);

    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("asset_code", formattedPAT)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSubstituteNotFound(true);
        toast.error(`Equipamento ${formattedPAT} não encontrado no sistema. Cadastre o equipamento antes de continuar.`);
        return;
      }

      // Validar se equipamento está no Depósito Malta
      const statusLabels: Record<string, string> = {
        locacao: "Locação",
        em_manutencao: "Manutenção",
        aguardando_laudo: "Aguardando Laudo",
        deposito_malta: "Depósito Malta",
      };

      if (data.location_type !== "deposito_malta") {
        const currentStatus = statusLabels[data.location_type] || data.location_type;
        setSubstituteNotFound(true);
        toast.error(`Equipamento ${formattedPAT} está em "${currentStatus}". Para substituição, o equipamento deve estar no Depósito Malta.`);
        return;
      }

      // Validar se o nome do equipamento é o mesmo
      if (asset && data.equipment_name !== asset.equipment_name) {
        toast.error(`Atenção: Você está substituindo "${asset.equipment_name}" por "${data.equipment_name}". Recomendamos substituir por equipamento do mesmo tipo.`);
        setSubstituteNotFound(true);
        return;
      }

      setSubstituteAsset(data);
      form.setValue("substitute_asset_code", formattedPAT);
      toast.success(`Equipamento ${formattedPAT} encontrado e disponível!`);
    } catch (error) {
      console.error("Erro ao buscar equipamento:", error);
      toast.error("Erro ao buscar equipamento no banco de dados");
      setSubstituteNotFound(true);
    } finally {
      setLoadingSubstitute(false);
    }
  };

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

  // Buscar equipamento que foi substituído por este (para retorno_obra)
  useEffect(() => {
    const fetchReplacedAsset = async () => {
      if (movementType === "retorno_obra" && asset) {
        try {
          const { data, error } = await supabase
            .from("assets")
            .select("id, asset_code, equipment_name, rental_company, rental_work_site")
            .eq("replaced_by_asset_id", asset.id)
            .eq("location_type", "locacao")
            .maybeSingle();

          if (error) throw error;
          setReplacedAssetToReturn(data);
        } catch (error) {
          console.error("Erro ao buscar equipamento substituído:", error);
        }
      } else {
        setReplacedAssetToReturn(null);
        setReplacedAssetReturnDecision(null);
      }
    };

    fetchReplacedAsset();
  }, [movementType, asset]);

  useEffect(() => {
    if (!movementType) return;
    
    form.reset({});
    setPartsReplaced(null);
    setWithdrawals([]);
    setSubstituteAssetCode("");
    setSubstituteAsset(null);
    setSubstituteNotFound(false);
    setReplacedAssetReturnDecision(null);
    
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

    // Auto-preencher empresa e obra quando for substituição
    if (movementType === "substituicao" && asset) {
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
        rental_company: company,
        rental_work_site: workSite,
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
      console.log("=== INICIO DO SUBMIT ===");
      console.log("Form data received:", data);
      console.log("Movement type:", movementType);
      console.log("partsReplaced state:", partsReplaced);

      // Validação específica para Substituição
      if (movementType === "substituicao") {
        console.log("=== PROCESSANDO SUBSTITUIÇÃO ===");
        console.log("Substitute Asset:", substituteAsset);
        console.log("Form data:", data);
        
        if (!substituteAsset) {
          toast.error("Busque e valide o equipamento substituto antes de continuar");
          return;
        }

        if (!data.old_asset_destination) {
          toast.error("Selecione o destino do equipamento antigo");
          return;
        }

        console.log("Iniciando atualização do equipamento ANTIGO...");
        // Atualizar equipamento ANTIGO
        const oldAssetUpdate: any = {
          location_type: data.old_asset_destination,
          equipment_observations: data.equipment_observations || null,
          malta_collaborator: data.malta_collaborator || null,
        };

        console.log("Dados para equipamento antigo:", oldAssetUpdate);

        const { error: oldError } = await supabase
          .from("assets")
          .update(oldAssetUpdate)
          .eq("id", id);

        if (oldError) {
          console.error("Erro ao atualizar equipamento antigo:", oldError);
          throw oldError;
        }

        console.log("Equipamento antigo atualizado com sucesso!");
        console.log("Iniciando atualização do equipamento SUBSTITUTO...");

        // Atualizar equipamento SUBSTITUTO (vai para locação)
        const substituteUpdate: any = {
          location_type: "locacao",
          rental_company: data.rental_company,
          rental_work_site: data.rental_work_site,
          rental_start_date: new Date().toISOString().split('T')[0],
        };

        console.log("Dados para equipamento substituto:", substituteUpdate);

        const { error: newError } = await supabase
          .from("assets")
          .update(substituteUpdate)
          .eq("id", substituteAsset.id);

        if (newError) {
          console.error("Erro ao atualizar equipamento substituto:", newError);
          throw newError;
        }

        console.log("Equipamento substituto atualizado com sucesso!");
        console.log("Registrando eventos no histórico...");

        // Registrar eventos no histórico
        const destLabels: Record<string, string> = {
          aguardando_laudo: "Aguardando Laudo",
          em_manutencao: "Manutenção",
          deposito_malta: "Depósito Malta",
        };

        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "SUBSTITUIÇÃO",
          detalhesEvento: `Equipamento substituído por ${substituteAsset.asset_code}. Destino: ${destLabels[data.old_asset_destination]}. Observações: ${data.equipment_observations || "Nenhuma"}`,
        });

        await registrarEvento({
          patId: substituteAsset.id,
          codigoPat: substituteAsset.asset_code,
          tipoEvento: "SUBSTITUIÇÃO",
          detalhesEvento: `Equipamento enviado para substituir ${asset.asset_code} na obra ${data.rental_work_site} (${data.rental_company})`,
        });

        console.log("Eventos registrados com sucesso!");
        console.log("Invalidando caches...");

        queryClient.invalidateQueries({ queryKey: ["asset", id] });
        queryClient.invalidateQueries({ queryKey: ["asset", substituteAsset.id] });
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });
        queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", substituteAsset.id] });

        console.log("=== SUBSTITUIÇÃO CONCLUÍDA COM SUCESSO ===");
        toast.success("Substituição registrada com sucesso");
        navigate(`/assets/view/${id}`);
        return;
      }

      // Validar retiradas para Retorno para Obra
      if (movementType === "retorno_obra" && data.parts_replaced === true) {
        console.log("Validando retiradas de material...");
        if (withdrawals.length === 0) {
          toast.error("Não há retiradas de material cadastradas para este equipamento. Cadastre as peças retiradas antes de continuar.");
          return;
        }
        console.log(`${withdrawals.length} retiradas encontradas`);
      }

      // Processar destino do equipamento substituído (se existir)
      if (movementType === "retorno_obra" && replacedAssetToReturn && replacedAssetReturnDecision !== null) {
        if (replacedAssetReturnDecision === true) {
          // Equipamento substituído retorna para laudo
          const { error: replacedError } = await supabase
            .from("assets")
            .update({
              location_type: "aguardando_laudo",
              inspection_start_date: new Date().toISOString(),
            })
            .eq("id", replacedAssetToReturn.id);

          if (replacedError) throw replacedError;

          await registrarEvento({
            patId: replacedAssetToReturn.id,
            codigoPat: replacedAssetToReturn.asset_code,
            tipoEvento: "RETORNO PARA LAUDO",
            detalhesEvento: `Equipamento que estava na obra retorna para laudo após ${asset.asset_code} voltar da manutenção`,
          });

          toast.success(`Equipamento ${replacedAssetToReturn.asset_code} enviado para laudo`);
        }
        // Se false, o equipamento substituído continua na obra (não fazer nada)
      }
      
      const updateData: any = {
        // Retorno para obra NÃO altera o location_type
        ...(movementType !== "retorno_obra" && { location_type: movementType }),
        ...data,
        // Registrar data de início do laudo
        ...(movementType === "aguardando_laudo" && { inspection_start_date: new Date().toISOString() }),
      };

      // Remover parts_replaced dos dados (não é coluna do banco)
      if (movementType === "retorno_obra") {
        console.log("Removendo parts_replaced dos dados de update...");
        delete updateData.parts_replaced;
      }

      console.log("Update data ANTES de enviar para Supabase:", updateData);

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
        substituicao: "Substituição",
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

  const handleQRScan = async (code: string) => {
    const formattedPAT = formatPAT(code);
    
    if (!formattedPAT) {
      toast.error("Código inválido");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_code", formattedPAT)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        navigate(`/assets/movement/${data.id}`);
        toast.success(`Movimentando PAT ${formattedPAT}`);
      } else {
        toast.error(`Patrimônio ${formattedPAT} não encontrado`);
      }
    } catch (error) {
      console.error("Erro ao buscar patrimônio:", error);
      toast.error("Erro ao buscar patrimônio");
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
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate(`/assets/view/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Registrar Movimentação</h1>
          <p className="text-muted-foreground">{asset.equipment_name} - PAT: {asset.asset_code}</p>
        </div>
        <Button 
          variant="secondary" 
          size="icon"
          onClick={() => setShowScanner(true)}
          title="Escanear QR Code"
        >
          <QrCode className="h-5 w-5" />
        </Button>
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tipo de Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          {asset.location_type === "locacao" && (
            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ Equipamento em locação deve passar por laudo antes de qualquer movimentação
              </p>
            </div>
          )}
          <Select 
            value={movementType || ""} 
            onValueChange={(value) => setMovementType(value as MovementType)}
            disabled={asset.location_type === "locacao"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de movimentação" />
            </SelectTrigger>
            <SelectContent>
              {asset.location_type === "locacao" ? (
                <SelectItem value="aguardando_laudo">Aguardando Laudo</SelectItem>
              ) : (
                <>
                  <SelectItem value="deposito_malta">Retorno ao Depósito Malta</SelectItem>
                  <SelectItem value="em_manutencao">Envio para Manutenção</SelectItem>
                  <SelectItem value="locacao">Saída para Locação</SelectItem>
                  <SelectItem value="retorno_obra">Retorno para Obra</SelectItem>
                  <SelectItem value="substituicao">Substituição</SelectItem>
                  <SelectItem value="aguardando_laudo">Aguardando Laudo</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {movementType && (
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
                  <Label htmlFor="malta_collaborator">Responsável Malta (Principal)</Label>
                  <Input
                    id="malta_collaborator"
                    {...form.register("malta_collaborator")}
                    placeholder="Nome do responsável principal"
                    required
                  />
                </div>
                <AssetCollaboratorsManager assetId={id} />
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
                    <Label htmlFor="malta_collaborator">Responsável Malta (Principal)</Label>
                    <Input
                      id="malta_collaborator"
                      {...form.register("malta_collaborator")}
                      placeholder="Nome do responsável principal"
                      required
                    />
                  </div>
                  <AssetCollaboratorsManager assetId={id} />
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
                      <p className="text-sm text-destructive">
                        {form.formState.errors.rental_company.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="rental_start_date">Data de Locação/Retirada *</Label>
                    <Input
                      id="rental_start_date"
                      type="date"
                      {...form.register("rental_start_date")}
                    />
                    {form.formState.errors.rental_start_date && (
                      <p className="text-sm text-destructive">{form.formState.errors.rental_start_date.message as string}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rental_end_date">Data de Devolução (Opcional)</Label>
                  <Input
                    id="rental_end_date"
                    type="date"
                    {...form.register("rental_end_date")}
                  />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    <strong>ℹ️ Sobre contratos:</strong> Contratos formais são opcionais. 
                    Preencha apenas se houver um contrato cadastrado ou novo contrato a ser vinculado.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rental_contract_number">Número do Contrato (Opcional)</Label>
                  <Input
                    id="rental_contract_number"
                    {...form.register("rental_contract_number")}
                    placeholder="Ex: CTR-2025-001"
                  />
                  <p className="text-xs text-muted-foreground">
                    Preencha apenas se houver contrato formal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="malta_collaborator">Responsável Malta (Opcional)</Label>
                  <Input
                    id="malta_collaborator"
                    {...form.register("malta_collaborator")}
                    placeholder="Nome do responsável principal (opcional)"
                  />
                </div>
                <AssetCollaboratorsManager assetId={id} />
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
                  {/* Campos de Empresa e Obra (preenchidos automaticamente e desabilitados) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="rental_company">Empresa *</Label>
                      <Input
                        id="rental_company"
                        {...form.register("rental_company")}
                        placeholder="Nome da empresa"
                        disabled={true}
                        className="bg-muted"
                      />
                      {form.formState.errors.rental_company && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.rental_company.message as string}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rental_work_site">Obra *</Label>
                      <Input
                        id="rental_work_site"
                        {...form.register("rental_work_site")}
                        placeholder="Nome da obra"
                        disabled={true}
                        className="bg-muted"
                      />
                      {form.formState.errors.rental_work_site && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.rental_work_site.message as string}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Foi trocada peça? *</Label>
                    <RadioGroup
                      onValueChange={(value) => {
                        const boolValue = value === "true";
                        setPartsReplaced(boolValue);
                        form.setValue("parts_replaced", boolValue);
                        form.clearErrors("parts_replaced");
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
                    {form.formState.errors.parts_replaced && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.parts_replaced.message as string}
                      </p>
                    )}
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
                        <Label htmlFor="malta_collaborator">Responsável Malta (Principal)</Label>
                        <Input
                          id="malta_collaborator"
                          {...form.register("malta_collaborator")}
                          placeholder="Nome do responsável principal"
                          required
                        />
                      </div>
                      <AssetCollaboratorsManager assetId={id} />
                    </>
                   )}

                  {/* Verificação de equipamento substituído */}
                  {replacedAssetToReturn && (
                    <div className="space-y-3 p-4 border rounded-lg bg-amber-50 border-amber-200">
                      <Label className="text-base font-semibold text-amber-800">
                        ⚠️ Equipamento Substituído Detectado
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Este equipamento substituiu o PAT <strong>{replacedAssetToReturn.asset_code}</strong> ({replacedAssetToReturn.equipment_name}) 
                        que ainda está na obra <strong>{replacedAssetToReturn.rental_work_site}</strong>.
                      </p>
                      <div className="space-y-3 mt-3">
                        <Label>O equipamento {replacedAssetToReturn.asset_code} retornará para Malta?</Label>
                        <RadioGroup
                          onValueChange={(value) => setReplacedAssetReturnDecision(value === "true")}
                          value={replacedAssetReturnDecision === null ? undefined : String(replacedAssetReturnDecision)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="replaced-return-yes" />
                            <Label htmlFor="replaced-return-yes" className="font-normal cursor-pointer">
                              Sim, retornar para laudo
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="replaced-return-no" />
                            <Label htmlFor="replaced-return-no" className="font-normal cursor-pointer">
                              Não, continuar na obra
                            </Label>
                          </div>
                        </RadioGroup>
                        {replacedAssetReturnDecision === null && (
                          <p className="text-sm text-destructive">
                            * Obrigatório informar o destino do equipamento substituído
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                 </div>
               </>
             )}

             {movementType === "substituicao" && (
              <>
                <div className="space-y-4">
                  {/* Buscar PAT Substituto */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <Label className="text-base font-semibold">Equipamento Substituto</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Digite o PAT (ex: 1812 ou 001812)"
                          value={substituteAssetCode}
                          onChange={(e) => {
                            // Aceitar apenas números
                            const value = e.target.value.replace(/\D/g, '');
                            setSubstituteAssetCode(value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearchSubstitute();
                            }
                          }}
                          maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          O sistema formatará automaticamente com 6 dígitos
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleSearchSubstitute}
                        disabled={loadingSubstitute}
                      >
                        {loadingSubstitute ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>

                    {substituteNotFound && (
                      <div className="p-3 border border-destructive bg-destructive/10 rounded-md">
                        <p className="text-sm text-destructive font-medium">
                          ⚠️ Equipamento não disponível para substituição
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Verifique o status do equipamento ou cadastre um novo
                        </p>
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 mt-2 text-sm"
                          onClick={() => navigate("/assets/register")}
                        >
                          Cadastrar novo equipamento →
                        </Button>
                      </div>
                    )}

                    {substituteAsset && (
                      <div className="p-4 bg-background border rounded-lg space-y-2">
                        <p className="font-medium text-green-600">✓ Equipamento encontrado</p>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">PAT:</span> {substituteAsset.asset_code}</p>
                          <p><span className="font-medium">Nome:</span> {substituteAsset.equipment_name}</p>
                          <p><span className="font-medium">Fabricante:</span> {substituteAsset.manufacturer}</p>
                          {substituteAsset.model && (
                            <p><span className="font-medium">Modelo:</span> {substituteAsset.model}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dados da Obra/Empresa para o equipamento substituto */}
                  {substituteAsset && (
                    <>
                      <div className="space-y-3 p-4 border rounded-lg">
                        <Label className="text-base font-semibold">Destino do Equipamento Substituto</Label>
                        <p className="text-sm text-muted-foreground">
                          Empresa e Obra preenchidas automaticamente do equipamento atual
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rental_company">Empresa *</Label>
                            <Input
                              id="rental_company"
                              {...form.register("rental_company")}
                              placeholder="Nome da empresa"
                            />
                            {form.formState.errors.rental_company && (
                              <p className="text-sm text-destructive">
                                {form.formState.errors.rental_company.message as string}
                              </p>
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
                              <p className="text-sm text-destructive">
                                {form.formState.errors.rental_work_site.message as string}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Destino do PAT Antigo */}
                      <div className="space-y-3 p-4 border rounded-lg">
                        <Label className="text-base font-semibold">Destino do Equipamento Antigo (PAT: {asset.asset_code})</Label>
                        <div className="space-y-2">
                          <Label htmlFor="old_asset_destination">Selecione o destino *</Label>
                          <Select
                            onValueChange={(value) => form.setValue("old_asset_destination", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o destino" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aguardando_laudo">Aguardando Laudo</SelectItem>
                              <SelectItem value="em_manutencao">Manutenção</SelectItem>
                              <SelectItem value="deposito_malta">Depósito Malta</SelectItem>
                            </SelectContent>
                          </Select>
                          {form.formState.errors.old_asset_destination && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.old_asset_destination.message as string}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Observações */}
                      <div className="space-y-2">
                        <Label htmlFor="equipment_observations">Observações</Label>
                        <Textarea
                          id="equipment_observations"
                          {...form.register("equipment_observations")}
                          placeholder="Observações sobre a substituição..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="malta_collaborator">Responsável Malta (Principal)</Label>
                        <Input
                          id="malta_collaborator"
                          {...form.register("malta_collaborator")}
                          placeholder="Nome do responsável principal"
                          required
                        />
                      </div>
                      <AssetCollaboratorsManager assetId={id} />
                    </>
                  )}
                </div>
              </>
            )}

            {movementType === "aguardando_laudo" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="malta_collaborator">Responsável Malta (Principal)</Label>
                  <Input
                    id="malta_collaborator"
                    {...form.register("malta_collaborator")}
                    placeholder="Nome do responsável principal"
                    required
                  />
                </div>
                <AssetCollaboratorsManager assetId={id} />
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
              <Button 
                type="submit" 
                disabled={
                  form.formState.isSubmitting || 
                  isUploading || 
                  (movementType === "retorno_obra" && replacedAssetToReturn && replacedAssetReturnDecision === null)
                }
              >
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
      )}
    </div>
  );
}
