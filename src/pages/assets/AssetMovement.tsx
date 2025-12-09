import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAssetHistory } from "@/hooks/useAssetHistory";
import { useAssetLifecycle } from "@/hooks/useAssetLifecycle";
import { 
  validateRentalStartDate, 
  validateMaintenanceArrivalDate,
  validateGenericMovementDate,
  validateDateRange,
  formatValidationError
} from "@/lib/assetMovementValidation";
import { QRScanner } from "@/components/QRScanner";
import { RetroactiveDateWarning } from "@/components/RetroactiveDateWarning";
import { formatPAT } from "@/lib/patUtils";
import { getTodayLocalDate, getISOStringInBelem } from "@/lib/dateUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { saveLeaseCycle, saveMaintenanceCycle } = useAssetLifecycle();
  
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
  const [showDateConfirmDialog, setShowDateConfirmDialog] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);
  const [showRentalEndedDialog, setShowRentalEndedDialog] = useState(false);
  const [rentalEndedData, setRentalEndedData] = useState<any>(null);
  

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


  // Redirecionar para Pós-Laudo APENAS se equipamento JÁ ESTÁ em laudo no banco
  // (não bloquear se usuário está CRIANDO uma movimentação para laudo)
  useEffect(() => {
    if (asset && asset.location_type === "aguardando_laudo" && movementType === null) {
      toast.error("Equipamento em laudo deve passar pela Decisão Pós-Laudo");
      navigate(`/assets/post-inspection/${id}`);
    }
  }, [asset, id, navigate, movementType]);

  // Auto-selecionar "aguardando_laudo" para equipamentos em locação
  // PERMITIR que usuário finalize a movimentação normalmente
  useEffect(() => {
    if (asset && asset.location_type === "locacao" && movementType === null) {
      setMovementType("aguardando_laudo");
      toast.info("Equipamento em locação deve passar por laudo antes de qualquer movimentação");
    }
  }, [asset, movementType]);

  // Função auxiliar para determinar empresa e obra baseado no location_type
  const getAssetCompanyAndWorkSite = (asset: any) => {
    let company = "";
    let workSite = "";
    
    if (asset.location_type === "locacao") {
      // Equipamento em locação - usa dados de rental
      company = asset.rental_company || "";
      workSite = asset.rental_work_site || "";
    } else if (asset.location_type === "em_manutencao") {
      // Equipamento em manutenção - usa dados de maintenance
      company = asset.maintenance_company || "";
      workSite = asset.maintenance_work_site || "";
    } else if (asset.location_type === "aguardando_laudo") {
      // Equipamento aguardando laudo - mantém dados de rental do período anterior
      company = asset.rental_company || "";
      workSite = asset.rental_work_site || "";
    }
    // Para "deposito_malta" - retorna vazio (não está associado a ninguém)
    
    return { company, workSite };
  };

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
    if (asset && movementType === "retorno_obra") {
      const { company, workSite } = getAssetCompanyAndWorkSite(asset);
      
      if (company) form.setValue("rental_company", company);
      if (workSite) form.setValue("rental_work_site", workSite);
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
      const currentDate = getTodayLocalDate();
      
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

    // Auto-preencher data atual para outros tipos de movimentação
    if (movementType === "deposito_malta") {
      form.reset({ movement_date: getTodayLocalDate() });
    }
    if (movementType === "aguardando_laudo") {
      form.reset({ movement_date: getTodayLocalDate() });
    }
    if (movementType === "retorno_obra" && asset) {
      const { company, workSite } = getAssetCompanyAndWorkSite(asset);
      
      form.reset({ 
        rental_company: company,
        rental_work_site: workSite,
        movement_date: getTodayLocalDate() 
      });
    }
    if (movementType === "locacao") {
      form.reset({ rental_start_date: getTodayLocalDate() });
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
        movement_date: getTodayLocalDate(),
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

    // 🎯 FASE 2: OPERADOR DECIDE - Locação com data de fim retroativa
    // Sistema não decide automaticamente ir para aguardando_laudo
    // Operador será perguntado depois através do diálogo de confirmação
    if (movementType === "locacao" && data.rental_end_date) {
      const endDate = new Date(data.rental_end_date);
      endDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (endDate < today) {
        // ✅ Perguntar ao operador o que fazer (não decidir automaticamente)
        const enrichedData = {
          ...data,
          isRentalEnded: true,
          rentalEndDateForHistory: data.rental_end_date,
        };
        setRentalEndedData(enrichedData);
        setShowRentalEndedDialog(true);
        return;
      }
    }

    // Verificar se a data é retroativa (> 30 dias) e mostrar confirmação
    const movementDate = new Date(
      data.movement_date || 
      data.maintenance_arrival_date || 
      data.rental_start_date || 
      getTodayLocalDate()
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    movementDate.setHours(0, 0, 0, 0);

    // ✅ BLOQUEIO ÚNICO: Data não pode ser futura
    if (movementDate > today) {
      toast.error("❌ Data da movimentação não pode ser futura");
      return;
    }

    const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));

    // ⚠️ AVISO: Movimentação retroativa (NÃO bloqueia mais)
    if (asset.effective_registration_date) {
      const assetEntryDate = new Date(asset.effective_registration_date);
      assetEntryDate.setHours(0, 0, 0, 0);
      
      if (movementDate < assetEntryDate) {
        const retroDays = Math.floor((assetEntryDate.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
        toast.info(
          `⚠️ Movimentação retroativa: Data da movimentação é ${retroDays} dias anterior ao cadastro. ` +
          `Isso será registrado no histórico para rastreabilidade.`,
          { duration: 5000 }
        );
      }
    } else {
      // Se não há data de entrada definida E a movimentação é anterior ao cadastro
      const createdDate = new Date(asset.created_at);
      createdDate.setHours(0, 0, 0, 0);
      
      if (movementDate < createdDate) {
        console.log(`Movimentação retroativa detectada: ${format(movementDate, 'dd/MM/yyyy')} anterior ao cadastro ${format(createdDate, 'dd/MM/yyyy')}`);
        
        try {
          // Atualizar effective_registration_date automaticamente
          const { error: updateError } = await supabase
            .from("assets")
            .update({ 
              effective_registration_date: format(movementDate, 'yyyy-MM-dd'),
              retroactive_registration_notes: `Data de entrada ajustada automaticamente baseada em movimentação retroativa registrada em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
            })
            .eq("id", asset.id);
          
          if (updateError) {
            console.error("Erro ao atualizar data de entrada:", updateError);
            toast.error("Erro ao ajustar data de entrada do equipamento");
            return;
          }
          
          console.log("Data de entrada atualizada automaticamente para", format(movementDate, 'dd/MM/yyyy'));
          
          // Registrar no histórico
          await registrarEvento({
            patId: asset.id,
            codigoPat: asset.asset_code,
            tipoEvento: "AJUSTE AUTOMÁTICO",
            detalhesEvento: `Data de entrada ajustada de ${format(createdDate, 'dd/MM/yyyy')} para ${format(movementDate, 'dd/MM/yyyy')} devido a movimentação retroativa`,
          });
          
          toast.success("Data de entrada do equipamento ajustada automaticamente");
        } catch (error) {
          console.error("Erro ao processar ajuste automático:", error);
          toast.error("Erro ao ajustar data de entrada");
          return;
        }
      }
    }

    if (daysDiff > 30) {
      setPendingSubmitData(data);
      setShowDateConfirmDialog(true);
      return;
    }

    await processSubmit(data);
  };

  // Função auxiliar para sanitizar datas vazias/undefined para null
  const sanitizeDate = (value: any): string | null => {
    if (!value || value === "" || (typeof value === "object" && value._type === "undefined")) {
      return null;
    }
    return value;
  };

  // Função auxiliar para construir payload seguro por tipo de movimento
  const buildUpdatePayloadByMovementType = (movementType: MovementType, formData: any): any => {
    const basePayload: any = {};

    // Campos compartilhados (sanitizados)
    const sanitizedData = {
      ...formData,
      maintenance_arrival_date: sanitizeDate(formData.maintenance_arrival_date),
      maintenance_departure_date: sanitizeDate(formData.maintenance_departure_date),
      rental_start_date: sanitizeDate(formData.rental_start_date),
      rental_end_date: sanitizeDate(formData.rental_end_date),
      purchase_date: sanitizeDate(formData.purchase_date),
    };

    switch (movementType) {
      case "deposito_malta":
        return {
          location_type: "deposito_malta",
          was_washed: sanitizedData.was_washed ?? false,
          was_painted: sanitizedData.was_painted ?? false,
          deposito_description: sanitizedData.deposito_description || null,
          malta_collaborator: sanitizedData.malta_collaborator || null,
          equipment_observations: sanitizedData.equipment_observations || null,
          // Limpar campos de locação e manutenção
          rental_company: null,
          rental_work_site: null,
          rental_start_date: null,
          rental_end_date: null,
          rental_contract_number: null,
          maintenance_company: null,
          maintenance_work_site: null,
          maintenance_description: null,
          maintenance_arrival_date: null,
          maintenance_departure_date: null,
          maintenance_delay_observations: null,
          returns_to_work_site: null,
          destination_after_maintenance: null,
          was_replaced: null,
          replacement_reason: null,
          is_new_equipment: null,
        };

      case "em_manutencao":
        return {
          location_type: "em_manutencao",
          maintenance_company: sanitizedData.maintenance_company || null,
          maintenance_work_site: sanitizedData.maintenance_work_site || null,
          maintenance_arrival_date: sanitizedData.maintenance_arrival_date,
          maintenance_departure_date: sanitizedData.maintenance_departure_date,
          maintenance_description: sanitizedData.maintenance_description || null,
          equipment_observations: sanitizedData.equipment_observations || null,
          malta_collaborator: sanitizedData.malta_collaborator || null,
        };

      case "locacao":
        const locacaoPayload: any = {
          location_type: "locacao",
          rental_company: sanitizedData.rental_company || null,
          rental_work_site: sanitizedData.rental_work_site || null,
          rental_start_date: sanitizedData.rental_start_date,
          rental_end_date: sanitizedData.rental_end_date,
          rental_contract_number: sanitizedData.rental_contract_number || null,
          equipment_observations: sanitizedData.equipment_observations || null,
          malta_collaborator: sanitizedData.malta_collaborator || null,
        };
        
        // Se locação já encerrou, mover automaticamente para aguardando_laudo
        if (sanitizedData.isRentalEnded) {
          locacaoPayload.location_type = "aguardando_laudo";
          locacaoPayload.inspection_start_date = sanitizedData.rental_end_date;
        }
        
        return locacaoPayload;

      case "aguardando_laudo":
        return {
          location_type: "aguardando_laudo",
          inspection_start_date: getISOStringInBelem(),
          equipment_observations: sanitizedData.equipment_observations || null,
          malta_collaborator: sanitizedData.malta_collaborator || null,
        };

      case "retorno_obra":
        // Retorno para obra ALTERA para locação (equipamento volta para obra e continua locado)
        return {
          location_type: "locacao",
          rental_company: sanitizedData.rental_company || null,
          rental_work_site: sanitizedData.rental_work_site || null,
          rental_start_date: sanitizedData.movement_date || getTodayLocalDate(),
          rental_end_date: null,
          rental_contract_number: null,
          equipment_observations: sanitizedData.equipment_observations || null,
          malta_collaborator: sanitizedData.malta_collaborator || null,
          // Limpar dados de manutenção (não está mais em manutenção)
          maintenance_company: null,
          maintenance_work_site: null,
          maintenance_description: null,
          maintenance_arrival_date: null,
          maintenance_departure_date: null,
          maintenance_delay_observations: null,
        };

      case "substituicao":
        // Tratado separadamente, não chega aqui
        return {};

      default:
        return basePayload;
    }
  };

  const processSubmit = async (data: any) => {
    if (!asset || !user) return;

    try {
      setIsUploading(true);
      console.log("=== INICIO DO SUBMIT ===");
      console.log("Form data received:", data);
      console.log("Movement type:", movementType);
      console.log("partsReplaced state:", partsReplaced);

      // ===== VALIDAÇÕES DE DATA VS. CRIAÇÃO DO ATIVO =====
      console.log("=== VALIDAÇÕES DE DATA ===");
      console.log("Movement Type:", movementType);
      console.log("Asset Creation:", {
        created_at: asset.created_at,
        effective_registration_date: asset.effective_registration_date
      });
      
      // Validação para LOCAÇÃO
      if (movementType === "locacao" && data.rental_start_date) {
        console.log("→ Validando locação:", data.rental_start_date);
        
        const rentalValidation = validateRentalStartDate(data.rental_start_date, {
          created_at: asset.created_at,
          effective_registration_date: asset.effective_registration_date,
        });
        
        if (rentalValidation !== true) {
          console.error("❌ Validação de locação falhou:", rentalValidation);
          toast.error(formatValidationError(rentalValidation, asset.asset_code));
          setIsUploading(false);
          return;
        }
        
        // Validar intervalo completo (início e fim)
        if (data.rental_end_date) {
          console.log("→ Validando intervalo de locação:", { start: data.rental_start_date, end: data.rental_end_date });
          
          const rangeValidation = validateDateRange(
            data.rental_start_date,
            data.rental_end_date,
            {
              created_at: asset.created_at,
              effective_registration_date: asset.effective_registration_date,
            },
            "locação"
          );
          
          if (rangeValidation !== true) {
            console.error("❌ Validação de intervalo falhou:", rangeValidation);
            toast.error(formatValidationError(rangeValidation, asset.asset_code));
            setIsUploading(false);
            return;
          }
        }
        
        console.log("✓ Validação de locação OK");
      }
      
      // Validação para MANUTENÇÃO
      if (movementType === "em_manutencao" && data.maintenance_arrival_date) {
        console.log("→ Validando manutenção:", data.maintenance_arrival_date);
        
        const maintenanceValidation = validateMaintenanceArrivalDate(data.maintenance_arrival_date, {
          created_at: asset.created_at,
          effective_registration_date: asset.effective_registration_date,
        });
        
        if (maintenanceValidation !== true) {
          console.error("❌ Validação de manutenção falhou:", maintenanceValidation);
          toast.error(formatValidationError(maintenanceValidation, asset.asset_code));
          setIsUploading(false);
          return;
        }
        
        // Validar intervalo completo (entrada e saída)
        if (data.maintenance_departure_date) {
          console.log("→ Validando intervalo de manutenção:", { start: data.maintenance_arrival_date, end: data.maintenance_departure_date });
          
          const rangeValidation = validateDateRange(
            data.maintenance_arrival_date,
            data.maintenance_departure_date,
            {
              created_at: asset.created_at,
              effective_registration_date: asset.effective_registration_date,
            },
            "manutenção"
          );
          
          if (rangeValidation !== true) {
            console.error("❌ Validação de intervalo de manutenção falhou:", rangeValidation);
            toast.error(formatValidationError(rangeValidation, asset.asset_code));
            setIsUploading(false);
            return;
          }
        }
        
        console.log("✓ Validação de manutenção OK");
      }
      
      // Validação para DEPÓSITO e AGUARDANDO LAUDO
      if ((movementType === "deposito_malta" || movementType === "aguardando_laudo") && data.movement_date) {
        console.log(`→ Validando ${movementType}:`, data.movement_date);
        
        const movementValidation = validateGenericMovementDate(data.movement_date, {
          created_at: asset.created_at,
          effective_registration_date: asset.effective_registration_date,
        });
        
        if (movementValidation !== true) {
          console.error(`❌ Validação de ${movementType} falhou:`, movementValidation);
          toast.error(formatValidationError(movementValidation, asset.asset_code));
          setIsUploading(false);
          return;
        }
        
        console.log(`✓ Validação de ${movementType} OK`);
      }
      
      console.log("=== TODAS VALIDAÇÕES DE DATA CONCLUÍDAS ===");

      // ===== PROCESSAMENTO NORMAL CONTINUA =====

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

        // CAPTURAR TODOS os dados do equipamento antigo ANTES de qualquer alteração
        const oldAssetData = {
          location_type: asset.location_type,
          rental_company: asset.rental_company,
          rental_work_site: asset.rental_work_site,
          rental_start_date: asset.rental_start_date,
          rental_end_date: asset.rental_end_date,
          rental_contract_number: asset.rental_contract_number,
          maintenance_company: asset.maintenance_company,
          maintenance_work_site: asset.maintenance_work_site,
          maintenance_arrival_date: asset.maintenance_arrival_date,
          maintenance_departure_date: asset.maintenance_departure_date,
          available_for_rental: asset.available_for_rental,
        };

        // 🎯 Determinar localização EFETIVA para herança
        // Se equipamento está em "aguardando_laudo" mas tem dados de locação,
        // trata como se estivesse em "locacao" para fins de herança
        const effectiveOriginalLocation =
          oldAssetData.location_type === "aguardando_laudo" && oldAssetData.rental_company
            ? "locacao"
            : oldAssetData.location_type;

        const today = getTodayLocalDate();

        console.log("Iniciando atualização do equipamento ANTIGO...");
        
        // 🔒 FASE 3: Trigger modificado para evitar duplicações
        // O trigger log_asset_changes agora detecta operações programáticas
        // e evita criar registros duplicados de "ALTERAÇÃO DE DADO"
        
        // Atualizar equipamento ANTIGO
        const oldAssetUpdate: any = {
          location_type: "aguardando_laudo", // ✅ SEMPRE vai para Aguardando Laudo
          equipment_observations: data.equipment_observations || null,
          malta_collaborator: data.malta_collaborator || null,
          was_replaced: true,
          replaced_by_asset_id: substituteAsset.id,
          replacement_reason: data.replacement_reason,
          substitution_date: data.movement_date,
          available_for_rental: false,
          locked_for_manual_edit: true, // 🔒 FASE 2.2: Bloquear edições manuais
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

        // Atualizar equipamento SUBSTITUTO - HERDA o status efetivo do antigo
        const substituteUpdate: any = {
          location_type: effectiveOriginalLocation, // ✅ Usa location_type EFETIVO
          available_for_rental: true,
        };

        // Herdar APENAS campos relevantes para o location_type efetivo
        if (effectiveOriginalLocation === "locacao") {
          substituteUpdate.rental_company = oldAssetData.rental_company;
          substituteUpdate.rental_work_site = oldAssetData.rental_work_site;
          substituteUpdate.rental_start_date = data.movement_date;
          substituteUpdate.rental_end_date = oldAssetData.rental_end_date;
          substituteUpdate.rental_contract_number = oldAssetData.rental_contract_number;
          // Limpar campos de manutenção
          substituteUpdate.maintenance_company = null;
          substituteUpdate.maintenance_work_site = null;
          substituteUpdate.maintenance_arrival_date = null;
          substituteUpdate.maintenance_departure_date = null;
        } else if (effectiveOriginalLocation === "em_manutencao") {
          substituteUpdate.maintenance_company = oldAssetData.maintenance_company;
          substituteUpdate.maintenance_work_site = oldAssetData.maintenance_work_site;
          substituteUpdate.maintenance_arrival_date = data.movement_date;
          substituteUpdate.maintenance_departure_date = null;
          // Limpar campos de locação
          substituteUpdate.rental_company = null;
          substituteUpdate.rental_work_site = null;
          substituteUpdate.rental_start_date = null;
          substituteUpdate.rental_end_date = null;
          substituteUpdate.rental_contract_number = null;
        }

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

        // Determinar localização para os eventos usando o location_type EFETIVO
        const locationInfo = effectiveOriginalLocation === 'locacao' 
          ? `Locação - ${oldAssetData.rental_company} / ${oldAssetData.rental_work_site}`
          : effectiveOriginalLocation === 'em_manutencao'
          ? `Manutenção - ${oldAssetData.maintenance_company} / ${oldAssetData.maintenance_work_site}`
          : effectiveOriginalLocation === 'deposito_malta'
          ? 'Depósito Malta'
          : 'Aguardando Laudo';

        const statusName = effectiveOriginalLocation === 'locacao' 
          ? 'Locação'
          : effectiveOriginalLocation === 'em_manutencao'
          ? 'Manutenção'
          : effectiveOriginalLocation === 'deposito_malta'
          ? 'Depósito Malta'
          : 'Aguardando Laudo';

        // Registrar eventos no histórico com data configurável
        const movementDateFormatted = data.movement_date.split('-').reverse().join('/');

        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "SUBSTITUIÇÃO",
          detalhesEvento: `Substituído pelo PAT ${substituteAsset.asset_code} em ${movementDateFormatted} e enviado para Aguardando Laudo. Estava em ${locationInfo}. Obs: ${data.equipment_observations || "Nenhuma"}`,
          dataEventoReal: `${data.movement_date}T12:00:00Z`, // ✅ Usa data configurável
        });

        await registrarEvento({
          patId: substituteAsset.id,
          codigoPat: substituteAsset.asset_code,
          tipoEvento: "SUBSTITUIÇÃO",
          detalhesEvento: `Substituiu o PAT ${asset.asset_code} em ${movementDateFormatted} e assumiu posição em ${locationInfo}. Saiu do Depósito Malta para ${statusName}. Data de início: ${movementDateFormatted}. Equipamento anterior foi para Aguardando Laudo. Motivo: ${data.replacement_reason || "Não informado"}${data.equipment_observations ? `. Obs: ${data.equipment_observations}` : ""}`,
          campoAlterado: "location_type",
          valorAntigo: "deposito_malta",
          valorNovo: effectiveOriginalLocation,
          dataEventoReal: `${data.movement_date}T12:00:00Z`, // ✅ Usa data configurável
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
              inspection_start_date: getISOStringInBelem(),
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
      
      // Arquivar dados antigos antes de limpar (apenas para depósito)
      if (movementType === "deposito_malta") {
        let cycleNumber = 0;
        
        // 1️⃣ SALVAR CICLO DE LOCAÇÃO (se houver dados)
        if (asset.rental_company || asset.rental_work_site) {
          console.log("🔄 Salvando ciclo de locação antes de limpar...");
          await saveLeaseCycle(asset.id, asset.asset_code, {
            rental_company: asset.rental_company,
            rental_work_site: asset.rental_work_site,
            rental_start_date: asset.rental_start_date,
            rental_end_date: asset.rental_end_date,
            rental_contract_number: asset.rental_contract_number,
          });
          
          // Buscar número do ciclo recém-criado
          const { data: lastCycle } = await supabase
            .from("asset_lifecycle_history")
            .select("cycle_number")
            .eq("asset_id", asset.id)
            .order("cycle_number", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          cycleNumber = lastCycle?.cycle_number || 0;
          console.log(`✓ Ciclo de locação #${cycleNumber} salvo`);
        }
        
        // 2️⃣ SALVAR CICLO DE MANUTENÇÃO (se houver dados)
        if (asset.maintenance_company || asset.maintenance_work_site) {
          console.log("🔄 Salvando ciclo de manutenção antes de limpar...");
          await saveMaintenanceCycle(asset.id, asset.asset_code, {
            maintenance_company: asset.maintenance_company,
            maintenance_work_site: asset.maintenance_work_site,
            maintenance_arrival_date: asset.maintenance_arrival_date,
            maintenance_departure_date: asset.maintenance_departure_date,
            maintenance_description: asset.maintenance_description,
          });
          
          // Buscar número do ciclo recém-criado
          const { data: lastCycle } = await supabase
            .from("asset_lifecycle_history")
            .select("cycle_number")
            .eq("asset_id", asset.id)
            .order("cycle_number", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          cycleNumber = lastCycle?.cycle_number || 0;
          console.log(`✓ Ciclo de manutenção #${cycleNumber} salvo`);
        }
        
        // 3️⃣ REGISTRAR EVENTO ENRIQUECIDO
        const historicoDetalhes = [];
        if (asset.rental_company) historicoDetalhes.push(`Empresa: ${asset.rental_company}`);
        if (asset.rental_work_site) historicoDetalhes.push(`Obra: ${asset.rental_work_site}`);
        if (asset.rental_start_date && asset.rental_end_date) {
          const inicio = new Date(asset.rental_start_date);
          const fim = new Date(asset.rental_end_date);
          const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
          historicoDetalhes.push(`Duração: ${dias} dias`);
        }
        if (asset.maintenance_company) historicoDetalhes.push(`Manutenção: ${asset.maintenance_company}`);
        
        if (historicoDetalhes.length > 0) {
          await registrarEvento({
            patId: asset.id,
            codigoPat: asset.asset_code,
            tipoEvento: "CICLO ENCERRADO",
            detalhesEvento: cycleNumber > 0 
              ? `Ciclo #${cycleNumber} arquivado com sucesso. ${historicoDetalhes.join(" | ")}. Equipamento disponível para nova locação.`
              : `Equipamento retornou ao Depósito Malta. ${historicoDetalhes.join(" | ")}.`,
          });
        }
      }

      // Construir payload seguro baseado no tipo de movimento
      const updateData = buildUpdatePayloadByMovementType(movementType!, data);

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

      console.log("✅ Payload sanitizado e pronto para envio:", updateData);
      
      const { error: updateError } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        console.error("❌ Erro no update do Supabase:", updateError);
        toast.error(`Erro ao atualizar: ${updateError.message}`);
        throw updateError;
      }

      console.log("✅ Asset atualizado com sucesso!");

      // TRATAMENTO ESPECIAL: Locação encerrada → Aguardando Laudo
      if (movementType === "locacao" && data.isRentalEnded && data.rentalEndDateForHistory) {
        // Registrar 2 eventos com data real do fim da locação
        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "FIM DE LOCAÇÃO",
          detalhesEvento: `Locação encerrada em ${format(parseISO(data.rentalEndDateForHistory), 'dd/MM/yyyy')}. Empresa: ${data.rental_company}. Obra: ${data.rental_work_site}`,
          dataEventoReal: data.rentalEndDateForHistory,
        });

        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "MOVIMENTAÇÃO AUTOMÁTICA",
          detalhesEvento: `Equipamento movido automaticamente para Aguardando Laudo após fim de locação retroativa`,
          campoAlterado: "location_type",
          valorAntigo: "locacao",
          valorNovo: "aguardando_laudo",
          dataEventoReal: data.rentalEndDateForHistory,
        });

        queryClient.invalidateQueries({ queryKey: ["asset", id] });
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        queryClient.invalidateQueries({ queryKey: ["patrimonio-historico", id] });

        toast.success("Locação encerrada e equipamento movido para Aguardando Laudo");
        navigate(`/assets/view/${id}`);
        return;
      }

      const locationLabels: Record<MovementType, string> = {
        deposito_malta: "Depósito Malta",
        em_manutencao: "Em Manutenção",
        locacao: "Locação",
        aguardando_laudo: "Aguardando Laudo",
        retorno_obra: "Retorno para Obra",
        substituicao: "Substituição",
      };

      // Construir detalhes do evento incluindo justificativa retroativa (se fornecida)
      let detalhesEvento = "";
      
      if (movementType === "retorno_obra") {
        detalhesEvento = data.parts_replaced 
          ? `Retorno para obra COM troca de peças. Peças retiradas: ${withdrawals.map(w => w.products?.name).join(", ")}`
          : `Retorno para obra SEM troca de peças. Observações: ${data.equipment_observations || "Nenhuma"}`;
      } else {
        detalhesEvento = `Equipamento movido para ${locationLabels[movementType]}`;
      }

      // Incluir justificativa retroativa nos detalhes do histórico (se fornecida)
      if (data.retroactive_justification) {
        detalhesEvento += ` | Justificativa: ${data.retroactive_justification}`;
      }

      // Registrar evento no histórico
      if (movementType === "retorno_obra") {
        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "RETORNO PARA OBRA",
          detalhesEvento,
          campoAlterado: "location_type",
          valorAntigo: asset.location_type,
          valorNovo: "locacao",
        });
      } else {
        await registrarEvento({
          patId: asset.id,
          codigoPat: asset.asset_code,
          tipoEvento: "MOVIMENTAÇÃO",
          detalhesEvento,
          campoAlterado: "location_type",
          valorAntigo: asset.location_type,
          valorNovo: movementType!,
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
                <div className="space-y-2">
                  <Label htmlFor="movement_date">Data da Movimentação *</Label>
                  <Input
                    id="movement_date"
                    type="date"
                    {...form.register("movement_date")}
                  />
                  {form.formState.errors.movement_date && (
                    <p className="text-sm text-destructive">{form.formState.errors.movement_date.message as string}</p>
                  )}
                </div>

                {form.watch("movement_date") && (
                  <RetroactiveDateWarning selectedDate={form.watch("movement_date")} />
                )}

                {(() => {
                  const date = form.watch("movement_date");
                  if (!date) return null;
                  const movementDate = new Date(date);
                  const today = new Date();
                  const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 7) {
                    return (
                      <div className="space-y-2">
                        <Label htmlFor="retroactive_justification">Justificativa (Obrigatória para datas antigas) *</Label>
                        <Textarea
                          id="retroactive_justification"
                          {...form.register("retroactive_justification")}
                          placeholder="Explique o motivo do registro retroativo..."
                          rows={3}
                        />
                        {form.formState.errors.retroactive_justification && (
                          <p className="text-sm text-destructive">{form.formState.errors.retroactive_justification.message as string}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

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
                      placeholder="Nome do responsável principal (opcional)"
                    />
                  </div>
                  <AssetCollaboratorsManager assetId={id} />
                </div>

                {form.watch("maintenance_arrival_date") && (
                  <RetroactiveDateWarning selectedDate={form.watch("maintenance_arrival_date")} />
                )}

                {(() => {
                  const date = form.watch("maintenance_arrival_date");
                  if (!date) return null;
                  const movementDate = new Date(date);
                  const today = new Date();
                  const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 7) {
                    return (
                      <div className="space-y-2">
                        <Label htmlFor="retroactive_justification">Justificativa (Obrigatória para datas antigas) *</Label>
                        <Textarea
                          id="retroactive_justification"
                          {...form.register("retroactive_justification")}
                          placeholder="Explique o motivo do registro retroativo..."
                          rows={3}
                        />
                        {form.formState.errors.retroactive_justification && (
                          <p className="text-sm text-destructive">{form.formState.errors.retroactive_justification.message as string}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
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

                {form.watch("rental_start_date") && (
                  <RetroactiveDateWarning selectedDate={form.watch("rental_start_date")} />
                )}

                {(() => {
                  const date = form.watch("rental_start_date");
                  if (!date) return null;
                  const movementDate = new Date(date);
                  const today = new Date();
                  const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 7) {
                    return (
                      <div className="space-y-2">
                        <Label htmlFor="retroactive_justification">Justificativa (Obrigatória para datas antigas) *</Label>
                        <Textarea
                          id="retroactive_justification"
                          {...form.register("retroactive_justification")}
                          placeholder="Explique o motivo do registro retroativo..."
                          rows={3}
                        />
                        {form.formState.errors.retroactive_justification && (
                          <p className="text-sm text-destructive">{form.formState.errors.retroactive_justification.message as string}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

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
                  {/* Data da Movimentação */}
                  <div className="space-y-2">
                    <Label htmlFor="movement_date">Data do Retorno *</Label>
                    <Input
                      id="movement_date"
                      type="date"
                      {...form.register("movement_date")}
                    />
                    {form.formState.errors.movement_date && (
                      <p className="text-sm text-destructive">{form.formState.errors.movement_date.message as string}</p>
                    )}
                  </div>

                  {form.watch("movement_date") && (
                    <RetroactiveDateWarning selectedDate={form.watch("movement_date")} />
                  )}

                  {(() => {
                    const date = form.watch("movement_date");
                    if (!date) return null;
                    const movementDate = new Date(date);
                    const today = new Date();
                    const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysDiff > 7) {
                      return (
                        <div className="space-y-2">
                          <Label htmlFor="retroactive_justification">Justificativa (Obrigatória para datas antigas) *</Label>
                          <Textarea
                            id="retroactive_justification"
                            {...form.register("retroactive_justification")}
                            placeholder="Explique o motivo do registro retroativo..."
                            rows={3}
                          />
                          {form.formState.errors.retroactive_justification && (
                            <p className="text-sm text-destructive">{form.formState.errors.retroactive_justification.message as string}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}

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
                          placeholder="Nome do responsável principal (opcional)"
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
                      {/* Data da Movimentação */}
                      <div className="space-y-2">
                        <Label htmlFor="movement_date">Data da Substituição *</Label>
                        <Input
                          id="movement_date"
                          type="date"
                          {...form.register("movement_date")}
                        />
                        {form.formState.errors.movement_date && (
                          <p className="text-sm text-destructive">{form.formState.errors.movement_date.message as string}</p>
                        )}
                      </div>

                      {form.watch("movement_date") && (
                        <RetroactiveDateWarning selectedDate={form.watch("movement_date")} />
                      )}

                      {(() => {
                        const date = form.watch("movement_date");
                        if (!date) return null;
                        const movementDate = new Date(date);
                        const today = new Date();
                        const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
                        if (daysDiff > 7) {
                          return (
                            <div className="space-y-2">
                              <Label htmlFor="retroactive_justification">Justificativa (Obrigatória para datas antigas) *</Label>
                              <Textarea
                                id="retroactive_justification"
                                {...form.register("retroactive_justification")}
                                placeholder="Explique o motivo do registro retroativo..."
                                rows={3}
                              />
                              {form.formState.errors.retroactive_justification && (
                                <p className="text-sm text-destructive">{form.formState.errors.retroactive_justification.message as string}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}

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
                          placeholder="Nome do responsável principal (opcional)"
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
                {/* Data da Movimentação */}
                <div className="space-y-2">
                  <Label htmlFor="movement_date">Data da Movimentação *</Label>
                  <Input
                    id="movement_date"
                    type="date"
                    {...form.register("movement_date")}
                  />
                  {form.formState.errors.movement_date && (
                    <p className="text-sm text-destructive">{form.formState.errors.movement_date.message as string}</p>
                  )}
                </div>

                {form.watch("movement_date") && (
                  <RetroactiveDateWarning selectedDate={form.watch("movement_date")} />
                )}

                {(() => {
                  const date = form.watch("movement_date");
                  if (!date) return null;
                  const movementDate = new Date(date);
                  const today = new Date();
                  const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 7) {
                    return (
                      <div className="space-y-2">
                        <Label htmlFor="retroactive_justification">Justificativa (Obrigatória para datas antigas) *</Label>
                        <Textarea
                          id="retroactive_justification"
                          {...form.register("retroactive_justification")}
                          placeholder="Explique o motivo do registro retroativo..."
                          rows={3}
                        />
                        {form.formState.errors.retroactive_justification && (
                          <p className="text-sm text-destructive">{form.formState.errors.retroactive_justification.message as string}</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-2">
                  <Label htmlFor="malta_collaborator">Responsável Malta (Principal)</Label>
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

      {/* Dialog de confirmação para datas muito antigas */}
      <AlertDialog open={showDateConfirmDialog} onOpenChange={setShowDateConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirmar Data Retroativa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está registrando uma movimentação com mais de 30 dias de atraso.
              Isso pode impactar relatórios e ciclos de vida dos equipamentos.
              <br /><br />
              Deseja realmente continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDateConfirmDialog(false);
              setPendingSubmitData(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowDateConfirmDialog(false);
              if (pendingSubmitData) {
                await processSubmit(pendingSubmitData);
                setPendingSubmitData(null);
              }
            }}>
              Confirmar e Registrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog informativo: Locação Encerrada → Aguardando Laudo */}
      <AlertDialog open={showRentalEndedDialog} onOpenChange={setShowRentalEndedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🔄 Locação Encerrada - Laudo Obrigatório</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                A data de fim da locação <strong>({rentalEndedData?.rental_end_date && format(parseISO(rentalEndedData.rental_end_date), 'dd/MM/yyyy')})</strong> já passou.
              </p>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ O equipamento será automaticamente movido para <strong>"Aguardando Laudo"</strong>.
              </p>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-semibold mb-2">📋 Próximos passos:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Criar relatório de avarias/inspeção</li>
                  <li>Definir destino final: Depósito, Manutenção ou Retorno para Obra</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground">
                Todos os dados da locação serão preservados no histórico com a data real do encerramento.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRentalEndedDialog(false);
              setRentalEndedData(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowRentalEndedDialog(false);
              if (rentalEndedData) {
                await processSubmit(rentalEndedData);
                setRentalEndedData(null);
              }
            }}>
              Confirmar e Mover para Laudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
