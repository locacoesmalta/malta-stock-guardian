import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaintenancePlanHeader } from "./MaintenancePlanHeader";
import { VerificationTable } from "./VerificationTable";
import { VerificationTablePrint } from "./VerificationTablePrint";
import { MaintenanceSignatures } from "./MaintenanceSignatures";
import { PhotoUploadBox, PhotoData } from "./PhotoUploadBox";
import { HourmeterInput } from "@/components/HourmeterInput";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { useMaintenancePlans, MaintenancePlanData, MaintenancePlanPhoto } from "@/hooks/useMaintenancePlans";
import { useAssetMaintenances } from "@/hooks/useAssetMaintenances";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { useVerificationTemplates } from "@/hooks/useVerificationTemplates";
import { getDefaultSections, VerificationSection, MaintenanceInterval, AlternadorInterval } from "@/lib/maintenancePlanDefaults";
import { formatPAT } from "@/lib/patUtils";
import { formatHourmeter } from "@/lib/hourmeterUtils";
import { getCurrentDate, formatBelemDate, getNowInBelem, parseLocalDate, getDaysDifference } from "@/lib/dateUtils";
import { RetroactiveDateWarning } from "@/components/RetroactiveDateWarning";
import { Wrench, Package, User, FileText, Save, Loader2, Plus, CheckCircle2, XCircle, Printer, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/maintenance-plan-print.css";

interface MaintenancePlanFormProps {
  planId?: string;
  initialData?: any;
  mode?: "create" | "edit";
}

export function MaintenancePlanForm({ 
  planId, 
  initialData, 
  mode = "create" 
}: MaintenancePlanFormProps) {
  const navigate = useNavigate();
  const { createPlan, updatePlan, useLastPlanByAssetId } = useMaintenancePlans();
  const { data: assets = [] } = useAssetsQuery();
  const { getTemplateByEquipment, saveAsTemplate } = useVerificationTemplates();

  // Estados do formulário
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [patCode, setPatCode] = useState("");
  const [patFormatted, setPatFormatted] = useState("");
  const [planType, setPlanType] = useState<"preventiva" | "corretiva">("preventiva");
  const [planDate, setPlanDate] = useState(getCurrentDate());
  const [previousHourmeter, setPreviousHourmeter] = useState(0);
  const [currentHourmeter, setCurrentHourmeter] = useState(0);
  const [nextRevisionHourmeter, setNextRevisionHourmeter] = useState<number | undefined>();

  // Dados da empresa
  const [companyData, setCompanyData] = useState({
    company_name: "Malta Locações De Maquinas E Equipamentos",
    company_cnpj: "55.108.613/0001-39",
    company_address: "R. União, 16a - Marco, Belém - PA",
    company_cep: "66095-670",
    company_phone: "(91) 98605-4851",
    company_email: "walter@maltalocacoes.com.br",
  });

  // Dados do cliente
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientWorkSite, setClientWorkSite] = useState("");

  // Equipamento manual (se não tiver PAT)
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentManufacturer, setEquipmentManufacturer] = useState("");
  const [equipmentModel, setEquipmentModel] = useState("");
  const [equipmentSerial, setEquipmentSerial] = useState("");

  // Observações
  const [observationsOperational, setObservationsOperational] = useState("");
  const [observationsTechnical, setObservationsTechnical] = useState("");
  const [observationsProcedures, setObservationsProcedures] = useState("");

  // Assinaturas
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorCpf, setSupervisorCpf] = useState("");
  const [supervisorSignature, setSupervisorSignature] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [technicianCpf, setTechnicianCpf] = useState("");
  const [technicianSignature, setTechnicianSignature] = useState("");
  const [signatureClientName, setSignatureClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientSignature, setClientSignature] = useState("");

  // Seções de verificação
  const [verificationSections, setVerificationSections] = useState<VerificationSection[]>([]);
  const [templateSource, setTemplateSource] = useState<string>("");
  const [saveAsTemplateChecked, setSaveAsTemplateChecked] = useState(false);
  
  // Tipo de manutenção (Motor/Alternador) - para geradores
  const [motorMaintenance, setMotorMaintenance] = useState(false);
  const [alternadorMaintenance, setAlternadorMaintenance] = useState(false);
  
  // Intervalo de manutenção selecionado (para cálculo automático da próxima revisão)
  const [selectedMotorInterval, setSelectedMotorInterval] = useState<MaintenanceInterval | null>(null);
  const [selectedAlternadorInterval, setSelectedAlternadorInterval] = useState<AlternadorInterval | null>(null);

  // Fotos
  const [photos, setPhotos] = useState<PhotoData[]>([
    { file: null, preview: "", comment: "" },
    { file: null, preview: "", comment: "" },
    { file: null, preview: "", comment: "" },
    { file: null, preview: "", comment: "" },
  ]);
  const [additionalPhotos, setAdditionalPhotos] = useState<PhotoData[]>([]);

  // Justificativa retroativa
  const [retroactiveJustification, setRetroactiveJustification] = useState("");

  // Funções de validação retroativa
  const isRetroactive = () => {
    if (!planDate) return false;
    const movementDate = parseLocalDate(planDate);
    const today = getNowInBelem();
    return getDaysDifference(today, movementDate) > 0;
  };

  const requiresJustification = () => {
    if (!planDate) return false;
    const movementDate = parseLocalDate(planDate);
    const today = getNowInBelem();
    return getDaysDifference(today, movementDate) > 7;
  };

  // Buscar dados do equipamento
  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(patFormatted);
  const { lastHourmeter, lastPreviousHourmeter } = useAssetMaintenances(equipment?.id);
  
  // Buscar último plano do equipamento para reutilizar tabela de verificação
  const { data: lastPlan } = useLastPlanByAssetId(equipment?.id);

  // Handle PAT input change
  const handlePatChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setPatCode(numericValue);
  };

  // Handle PAT blur - format and trigger search
  const handlePatBlur = () => {
    if (patCode) {
      const formatted = formatPAT(patCode);
      if (formatted) {
        setPatFormatted(formatted);
      }
    }
  };

  // Atualizar PAT quando selecionar equipamento
  useEffect(() => {
    if (selectedAssetId) {
      const asset = assets.find(a => a.id === selectedAssetId);
      if (asset) {
        setPatCode(asset.asset_code);
        setPatFormatted(asset.asset_code);
      }
    }
  }, [selectedAssetId, assets]);

  // Preencher dados do equipamento quando encontrado
  useEffect(() => {
    if (equipment) {
      setEquipmentName(equipment.equipment_name || "");
      setEquipmentManufacturer(equipment.manufacturer || "");
      setEquipmentModel(equipment.model || "");
      setEquipmentSerial(equipment.serial_number || "");
      
      if (equipment.location_type === "locacao" || equipment.location_type === "aguardando_laudo") {
        setClientCompany(equipment.rental_company || "");
        setClientWorkSite(equipment.rental_work_site || "");
      } else if (equipment.location_type === "em_manutencao") {
        setClientCompany(equipment.maintenance_company || "");
        setClientWorkSite(equipment.maintenance_work_site || "");
      }
    }
  }, [equipment]);

  // Carregar dados iniciais quando em modo edição
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setPatCode(initialData.equipment_code || "");
      setPatFormatted(initialData.equipment_code || "");
      setPlanType(initialData.plan_type || "preventiva");
      setPlanDate(initialData.plan_date || getCurrentDate());
      setCurrentHourmeter(initialData.current_hourmeter || 0);
      setNextRevisionHourmeter(initialData.next_revision_hourmeter || undefined);
      setPreviousHourmeter(initialData.previous_hourmeter || 0);
      
      setClientName(initialData.client_name || "");
      setClientCompany(initialData.client_company || "");
      setClientWorkSite(initialData.client_work_site || "");
      
      setEquipmentName(initialData.equipment_name || "");
      setEquipmentManufacturer(initialData.equipment_manufacturer || "");
      setEquipmentModel(initialData.equipment_model || "");
      setEquipmentSerial(initialData.equipment_serial || "");
      
      setObservationsOperational(initialData.observations_operational || "");
      setObservationsTechnical(initialData.observations_technical || "");
      setObservationsProcedures(initialData.observations_procedures || "");
      
      setSupervisorName(initialData.supervisor_name || "");
      setSupervisorCpf(initialData.supervisor_cpf || "");
      setSupervisorSignature(initialData.supervisor_signature || "");
      setTechnicianName(initialData.technician_name || "");
      setTechnicianCpf(initialData.technician_cpf || "");
      setTechnicianSignature(initialData.technician_signature || "");
      setSignatureClientName(initialData.client_name || "");
      setClientCpf(initialData.client_cpf || "");
      setClientSignature(initialData.client_signature || "");
      
      setRetroactiveJustification(initialData.retroactive_justification || "");
      
      // Carregar seções de verificação
      if (initialData.verification_sections) {
        try {
          const sections = typeof initialData.verification_sections === 'string' 
            ? JSON.parse(initialData.verification_sections) 
            : initialData.verification_sections;
          setVerificationSections(sections);
        } catch {
          setVerificationSections([]);
        }
      }
      
      // Carregar fotos existentes
      if (initialData.photos) {
        try {
          const loadedPhotos = typeof initialData.photos === 'string' 
            ? JSON.parse(initialData.photos) 
            : initialData.photos;
          if (Array.isArray(loadedPhotos)) {
            const mainPhotos = loadedPhotos.slice(0, 4).map((p: any) => ({
              file: null,
              preview: p.url || "",
              comment: p.comment || "",
            }));
            setPhotos([
              ...mainPhotos,
              ...Array(4 - mainPhotos.length).fill({ file: null, preview: "", comment: "" }),
            ]);
            
            if (loadedPhotos.length > 4) {
              const extraPhotos = loadedPhotos.slice(4).map((p: any) => ({
                file: null,
                preview: p.url || "",
                comment: p.comment || "",
              }));
              setAdditionalPhotos(extraPhotos);
            }
          }
        } catch {
          // Mantém fotos vazias
        }
      }
      
      // Dados da empresa
      if (initialData.company_name) {
        setCompanyData({
          company_name: initialData.company_name,
          company_cnpj: initialData.company_cnpj || "",
          company_address: initialData.company_address || "",
          company_cep: initialData.company_cep || "",
          company_phone: initialData.company_phone || "",
          company_email: initialData.company_email || "",
        });
      }
    }
  }, [mode, initialData]);
  // 1. Último plano do mesmo PAT
  // 2. Template salvo (tipo + fabricante + modelo)
  // 3. Template padrão do código
  // Tabela de verificações inicia vazia - usuário adiciona seções manualmente
  // Botões Motor/Alternador disponíveis para especificar de qual sistema é a manutenção

  // Preencher horímetros automaticamente da última manutenção preventiva
  useEffect(() => {
    // Só preenche automaticamente no modo criação e quando equipamento estiver carregado
    if (mode === "create" && equipment?.id) {
      // Horímetro Anterior = previous_hourmeter da última manutenção
      if (lastPreviousHourmeter !== undefined && lastPreviousHourmeter > 0) {
        console.log("Auto-fill horímetro anterior:", lastPreviousHourmeter, "para asset:", equipment.id);
        setPreviousHourmeter(lastPreviousHourmeter);
      }
      // Horímetro Atual = current_hourmeter da última manutenção (pré-preenchido, editável)
      if (lastHourmeter !== undefined && lastHourmeter > 0) {
        console.log("Auto-fill horímetro atual:", lastHourmeter, "para asset:", equipment.id);
        setCurrentHourmeter(lastHourmeter);
      }
    }
  }, [lastPreviousHourmeter, lastHourmeter, mode, equipment?.id]);

  // Calcular automaticamente a próxima revisão quando intervalo for selecionado
  useEffect(() => {
    if (currentHourmeter > 0) {
      // Converter intervalo para segundos
      const motorIntervalHours: Record<MaintenanceInterval, number> = {
        h100: 100, h200: 200, h800: 800, h2000: 2000
      };
      const alternadorIntervalHours: Record<AlternadorInterval, number> = {
        h250: 250, h1000: 1000, h10000: 10000, h30000: 30000
      };
      
      // Usa o maior intervalo selecionado
      let intervalHours = 0;
      if (selectedMotorInterval) {
        intervalHours = Math.max(intervalHours, motorIntervalHours[selectedMotorInterval]);
      }
      if (selectedAlternadorInterval) {
        intervalHours = Math.max(intervalHours, alternadorIntervalHours[selectedAlternadorInterval]);
      }
      
      if (intervalHours > 0) {
        const intervalSeconds = intervalHours * 3600;
        setNextRevisionHourmeter(currentHourmeter + intervalSeconds);
      }
    }
  }, [selectedMotorInterval, selectedAlternadorInterval, currentHourmeter]);

  const handlePrint = () => {
    window.print();
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureChange = (field: string, value: string) => {
    switch (field) {
      case "supervisor_name": setSupervisorName(value); break;
      case "supervisor_cpf": setSupervisorCpf(value); break;
      case "supervisor_signature": setSupervisorSignature(value); break;
      case "technician_name": setTechnicianName(value); break;
      case "technician_cpf": setTechnicianCpf(value); break;
      case "technician_signature": setTechnicianSignature(value); break;
      case "client_name": setSignatureClientName(value); break;
      case "client_cpf": setClientCpf(value); break;
      case "client_signature": setClientSignature(value); break;
    }
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { ...newPhotos[index], file, preview };
        return newPhotos;
      });
    }
  };

  const handlePhotoCommentChange = (index: number, comment: string) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index] = { ...newPhotos[index], comment };
      return newPhotos;
    });
  };

  const handlePhotoRemove = (index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      if (newPhotos[index].preview) {
        URL.revokeObjectURL(newPhotos[index].preview);
      }
      newPhotos[index] = { file: null, preview: "", comment: "" };
      return newPhotos;
    });
  };

  const handleAdditionalPhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setAdditionalPhotos(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = { ...newPhotos[index], file, preview };
        return newPhotos;
      });
    }
  };

  const handleAdditionalPhotoCommentChange = (index: number, comment: string) => {
    setAdditionalPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index] = { ...newPhotos[index], comment };
      return newPhotos;
    });
  };

  const handleAdditionalPhotoRemove = (index: number) => {
    setAdditionalPhotos(prev => {
      const newPhotos = [...prev];
      if (newPhotos[index].preview) {
        URL.revokeObjectURL(newPhotos[index].preview);
      }
      return newPhotos.filter((_, i) => i !== index);
    });
  };

  const handleAddAdditionalPhoto = () => {
    setAdditionalPhotos(prev => [...prev, { file: null, preview: "", comment: "" }]);
  };

  const uploadPhoto = async (photo: PhotoData, index: number): Promise<MaintenancePlanPhoto | null> => {
    if (!photo.file && !photo.preview) return null;

    if (photo.preview && !photo.file) {
      return { url: photo.preview, comment: photo.comment, order: index };
    }

    if (!photo.file) return null;

    const fileExt = photo.file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `maintenance-plans/${fileName}`;

    const { error } = await supabase.storage.from("maintenance-photos").upload(filePath, photo.file);

    if (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error(`Erro ao enviar foto ${index + 1}: ${error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from("maintenance-photos").getPublicUrl(filePath);

    return { url: urlData.publicUrl, comment: photo.comment, order: index };
  };

  const fillMockData = () => {
    setPlanType("preventiva");
    setPlanDate(getCurrentDate());
    setPatCode("0048");
    setEquipmentName("GERADOR 55KVA SILENCIADO");
    setEquipmentManufacturer("CUMMINS");
    setEquipmentModel("C55D5");
    setEquipmentSerial("CMS-2024-55789");
    setPreviousHourmeter(1250);
    setCurrentHourmeter(1500);
    setNextRevisionHourmeter(1750);
    setClientName("João Carlos da Silva");
    setClientCompany("Construtora Horizonte Ltda");
    setClientWorkSite("Obra Residencial Porto Sol - Bloco A");
    
    setObservationsOperational(
      "• Manter nível de combustível acima de 30%\n• Verificar vazamentos antes de ligar\n• Aguardar 30 segundos após partida"
    );
    setObservationsTechnical(
      "📞 EMERGÊNCIA 24H: (91) 99628-0080\n📧 suporte@maltalocacoes.com.br"
    );
    setObservationsProcedures(
      "PROCEDIMENTO DE PARTIDA:\n1. Verificar nível de óleo\n2. Verificar combustível (mínimo 30%)\n3. Acionar chave de partida"
    );
    
    setSupervisorName("Walter Malta");
    setSupervisorCpf("123.456.789-00");
    setTechnicianName("Everton Souza");
    setTechnicianCpf("MAT-2024-001");
    setSignatureClientName("João Carlos da Silva");
    setClientCpf("987.654.321-00");
    
    const mockSections = getDefaultSections("GERADOR").map(section => ({
      ...section,
      items: section.items.map((item, idx) => ({
        ...item,
        daily: idx % 2 === 0,
        h250: idx % 3 === 0,
        h500: idx % 4 === 0,
        h1000: idx % 5 === 0,
        h4000: idx % 6 === 0,
      }))
    }));
    setVerificationSections(mockSections);
    
    toast.success("Dados de teste preenchidos!");
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    // Validações obrigatórias
    if (!patCode && !equipmentName) {
      toast.error("Informe o PAT ou nome do equipamento");
      return;
    }

    if (currentHourmeter <= 0) {
      toast.error("Informe o horímetro atual do equipamento");
      return;
    }

    // Validação retroativa
    if (requiresJustification() && !retroactiveJustification.trim()) {
      toast.error("Justificativa obrigatória para datas retroativas (>7 dias)");
      return;
    }

    // Alertas não bloqueantes
    const hasPhotos = photos.some(p => p.preview) || additionalPhotos.some(p => p.preview);
    if (!hasPhotos) {
      toast.warning("Nenhuma foto adicionada - o plano será salvo sem fotos");
    }

    setIsSaving(true);

    try {
      const uploadedPhotos: MaintenancePlanPhoto[] = [];
      
      for (let i = 0; i < photos.length; i++) {
        const uploaded = await uploadPhoto(photos[i], i);
        if (uploaded) uploadedPhotos.push(uploaded);
      }

      for (let i = 0; i < additionalPhotos.length; i++) {
        const uploaded = await uploadPhoto(additionalPhotos[i], photos.length + i);
        if (uploaded) uploadedPhotos.push(uploaded);
      }

      const planData: MaintenancePlanData = {
        asset_id: equipment?.id || null,
        equipment_code: formatPAT(patCode) || undefined,
        equipment_name: equipment?.equipment_name || equipmentName,
        equipment_manufacturer: equipment?.manufacturer || equipmentManufacturer,
        equipment_model: equipment?.model || equipmentModel,
        equipment_serial: equipmentSerial,
        plan_type: planType,
        plan_date: planDate,
        current_hourmeter: currentHourmeter,
        next_revision_hourmeter: nextRevisionHourmeter,
        ...companyData,
        client_name: clientName,
        client_company: clientCompany,
        client_work_site: clientWorkSite,
        observations_operational: observationsOperational,
        observations_technical: observationsTechnical,
        observations_procedures: observationsProcedures,
        supervisor_name: supervisorName,
        supervisor_cpf: supervisorCpf,
        supervisor_signature: supervisorSignature,
        technician_name: technicianName,
        technician_cpf: technicianCpf,
        technician_signature: technicianSignature,
        client_cpf: clientCpf,
        client_signature: clientSignature,
        verification_sections: verificationSections,
        photos: uploadedPhotos,
        retroactive_justification: retroactiveJustification || null,
      };

      // Usar updatePlan ou createPlan dependendo do modo
      const mutation = mode === "edit" && planId ? updatePlan : createPlan;
      const mutationData = mode === "edit" && planId ? { id: planId, ...planData } : planData;

      mutation.mutate(mutationData as any, {
        onSuccess: async () => {
          const displayName = formatPAT(patCode) || equipmentName;
          
          // Salvar como template se checkbox marcado (apenas no modo criação)
          if (mode === "create" && saveAsTemplateChecked && verificationSections.length > 0) {
            const eqType = equipment?.equipment_name || equipmentName;
            const eqManufacturer = equipment?.manufacturer || equipmentManufacturer;
            
            try {
              await saveAsTemplate.mutateAsync({
                name: `${eqType} ${eqManufacturer || ""}`.trim(),
                equipmentType: eqType,
                manufacturer: eqManufacturer || null,
                model: null,
                sections: verificationSections,
              });
            } catch (error) {
              console.error("Erro ao salvar template:", error);
            }
          }
          
          const successMessage = mode === "edit" 
            ? "✅ Plano de manutenção atualizado com sucesso!"
            : "✅ Plano de manutenção salvo com sucesso!";
          
          toast.success(successMessage, {
            description: `${displayName} - ${planType === "preventiva" ? "Preventiva" : "Corretiva"}`,
            duration: 5000,
            action: {
              label: "Imprimir",
              onClick: () => window.print(),
            },
          });
          
          // Navegar para listagem
          const redirectPath = mode === "edit" ? "/maintenance/plans" : "/assets";
          setTimeout(() => navigate(redirectPath), 3000);
        },
        onError: (error: any) => {
          toast.error(mode === "edit" ? "Erro ao atualizar plano" : "Erro ao salvar plano de manutenção", {
            description: error.message,
          });
          setIsSaving(false);
        },
      });
    } catch (error) {
      toast.error("Erro ao processar dados do plano");
      setIsSaving(false);
    }
  };

  // Dados formatados para impressão
  const equipmentDisplayName = equipment?.equipment_name || equipmentName;
  const equipmentDisplayManufacturer = equipment?.manufacturer || equipmentManufacturer;
  const equipmentDisplayModel = equipment?.model || equipmentModel;
  const allPhotos = [...photos, ...additionalPhotos].filter(p => p.preview);

  return (
    <div className="space-y-6 maintenance-plan-print">
      {/* ============================================
          SEÇÃO PRINT-ONLY - Relatório Formatado
          ============================================ */}
      <div className="print-only-section">
        {/* Cabeçalho */}
        <div className="print-report-header">
          <img src="/malta-logo.webp" alt="Malta Locações" className="print-logo" />
          <div className="print-header-title">
            <h1>Plano de Manutenção {planType === "preventiva" ? "Preventiva" : "Corretiva"}</h1>
            <p>Data: {formatBelemDate(planDate, 'dd/MM/yyyy')}</p>
          </div>
          <div className="print-header-company">
            <p><strong>{companyData.company_name}</strong></p>
            <p>CNPJ: {companyData.company_cnpj}</p>
            <p>{companyData.company_phone}</p>
          </div>
        </div>

        {/* Dados do Equipamento */}
        <div className="print-section">
          <h3 className="print-section-title">DADOS DO EQUIPAMENTO</h3>
          <table className="print-data-table">
            <tbody>
              <tr>
                <th>Equipamento</th>
                <td>{equipmentDisplayName}</td>
              </tr>
              <tr>
                <th>Fabricante</th>
                <td>{equipmentDisplayManufacturer}</td>
              </tr>
              <tr>
                <th>Modelo</th>
                <td>{equipmentDisplayModel}</td>
              </tr>
              <tr>
                <th>PAT</th>
                <td>{formatPAT(patCode) || "-"}</td>
              </tr>
              <tr>
                <th>Nº Série</th>
                <td>{equipmentSerial || "-"}</td>
              </tr>
              <tr>
                <th>Horímetro</th>
                <td>Anterior: {formatHourmeter(previousHourmeter)} | Atual: {formatHourmeter(currentHourmeter)} | Próx. Revisão: {nextRevisionHourmeter ? formatHourmeter(nextRevisionHourmeter) : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dados do Cliente */}
        <div className="print-section">
          <h3 className="print-section-title">DADOS DO CLIENTE</h3>
          <table className="print-data-table">
            <tbody>
              <tr>
                <th>Responsável</th>
                <td>{clientName || "-"}</td>
              </tr>
              <tr>
                <th>Empresa</th>
                <td>{clientCompany || "-"}</td>
              </tr>
              <tr>
                <th>Obra/Local</th>
                <td>{clientWorkSite || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabela de Verificações */}
        <VerificationTablePrint sections={verificationSections} />

        {/* Fotos - Grid 3x2 otimizado */}
        {allPhotos.length > 0 && (
          <div className="print-photos-section print-section avoid-break">
            <h3 className="print-section-title">FOTOS DO EQUIPAMENTO</h3>
            <div className="print-photos-grid">
              {allPhotos.map((photo, index) => (
                <div key={index} className="print-photo-item">
                  <img src={photo.preview} alt={`Foto ${index + 1}`} />
                  <div className="print-photo-comment">{photo.comment || `Foto ${index + 1}`}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observações - Compactas */}
        {(observationsOperational || observationsTechnical || observationsProcedures) && (
          <div className="print-observations-section print-section">
            <h3 className="print-section-title">OBSERVAÇÕES</h3>
            <div className="print-observations-compact">
              {observationsOperational && (
                <div className="print-observation-item">
                  <div className="print-observation-label">Cuidados Operacionais:</div>
                  <div className="print-observation-box">{observationsOperational}</div>
                </div>
              )}
              
              {observationsTechnical && (
                <div className="print-observation-item">
                  <div className="print-observation-label">Assistência Técnica:</div>
                  <div className="print-observation-box">{observationsTechnical}</div>
                </div>
              )}
              
              {observationsProcedures && (
                <div className="print-observation-item">
                  <div className="print-observation-label">Procedimentos:</div>
                  <div className="print-observation-box">{observationsProcedures}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assinaturas - 2 colunas: Supervisor | Técnico+Cliente */}
        <div className="print-signatures-section print-section avoid-break">
          <h3 className="print-section-title">ASSINATURAS</h3>
          <div className="print-signatures-grid">
            {/* Coluna Esquerda: Supervisor */}
            <div className="print-signature-box">
              <div className="print-signature-image">
                {supervisorSignature && <img src={supervisorSignature} alt="Assinatura Supervisor" />}
              </div>
              <div className="print-signature-line">
                <div className="print-signature-name">{supervisorName || "___________________"}</div>
                <div className="print-signature-cpf">{supervisorCpf ? `CPF/Mat: ${supervisorCpf}` : "CPF/Mat: ___________"}</div>
              </div>
              <div className="print-signature-role">Supervisor</div>
            </div>

            {/* Coluna Direita: Técnico e Cliente empilhados */}
            <div className="print-signature-column">
              {/* Técnico */}
              <div className="print-signature-box-small">
                <div className="print-signature-image">
                  {technicianSignature && <img src={technicianSignature} alt="Assinatura Técnico" />}
                </div>
                <div className="print-signature-line">
                  <div className="print-signature-name">{technicianName || "___________________"}</div>
                  <div className="print-signature-cpf">{technicianCpf ? `CPF/Mat: ${technicianCpf}` : "CPF/Mat: ___________"}</div>
                </div>
                <div className="print-signature-role">Técnico</div>
              </div>

              {/* Cliente */}
              <div className="print-signature-box-small">
                <div className="print-signature-image">
                  {clientSignature && <img src={clientSignature} alt="Assinatura Cliente" />}
                </div>
                <div className="print-signature-line">
                  <div className="print-signature-name">{signatureClientName || "___________________"}</div>
                  <div className="print-signature-cpf">{clientCpf ? `CPF/Mat: ${clientCpf}` : "CPF/Mat: ___________"}</div>
                </div>
                <div className="print-signature-role">Cliente</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          FORMULÁRIO DE EDIÇÃO (Escondido na Impressão)
          ============================================ */}
      
      {/* Cabeçalho da Empresa */}
      <MaintenancePlanHeader
        companyName={companyData.company_name}
        companyCnpj={companyData.company_cnpj}
        companyAddress={companyData.company_address}
        companyCep={companyData.company_cep}
        companyPhone={companyData.company_phone}
        companyEmail={companyData.company_email}
        onChange={handleCompanyChange}
      />

      {/* Tipo e Data do Plano */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Informações do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Manutenção</Label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data do Plano</Label>
              <Input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
              />
              {planDate && <RetroactiveDateWarning selectedDate={planDate} />}
              
              {requiresJustification() && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="retroactive_justification" className="text-amber-700 dark:text-amber-400">
                    Justificativa para Data Retroativa *
                  </Label>
                  <Textarea
                    id="retroactive_justification"
                    value={retroactiveJustification}
                    onChange={(e) => setRetroactiveJustification(e.target.value)}
                    placeholder="Explique o motivo do registro com data retroativa..."
                    className="min-h-[80px] border-amber-500"
                  />
                  {!retroactiveJustification && (
                    <p className="text-sm text-destructive">
                      Justificativa obrigatória para datas superiores a 7 dias
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>PAT do Equipamento</Label>
              <div className="relative">
                <Input
                  value={patCode}
                  onChange={(e) => handlePatChange(e.target.value)}
                  onBlur={handlePatBlur}
                  placeholder="Digite o PAT (ex: 48)"
                  maxLength={6}
                  className="font-mono pr-10"
                  disabled={mode === "edit"}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {loadingEquipment && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {!loadingEquipment && patFormatted && equipment && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {!loadingEquipment && patFormatted && !equipment && (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
              
              {!loadingEquipment && patFormatted && (
                equipment ? (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                      Equipamento encontrado: <strong>{equipment.equipment_name}</strong>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="py-2">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Equipamento não encontrado para o PAT {patFormatted}
                    </AlertDescription>
                  </Alert>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Equipamento */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Dados do Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome do Equipamento</Label>
              <Input
                value={equipment?.equipment_name || equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                disabled={!!equipment}
                placeholder="Ex: Gerador 55KVA"
              />
            </div>

            <div className="space-y-2">
              <Label>Fabricante</Label>
              <Input
                value={equipment?.manufacturer || equipmentManufacturer}
                onChange={(e) => setEquipmentManufacturer(e.target.value)}
                disabled={!!equipment}
                placeholder="Ex: Cummins"
              />
            </div>

            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input
                value={equipment?.model || equipmentModel}
                onChange={(e) => setEquipmentModel(e.target.value)}
                disabled={!!equipment}
                placeholder="Ex: C55D5"
              />
            </div>

            <div className="space-y-2">
              <Label>Número de Série</Label>
              <Input
                value={equipmentSerial}
                onChange={(e) => setEquipmentSerial(e.target.value)}
                placeholder="Número de série"
              />
            </div>

            <div className="space-y-2">
              <HourmeterInput
                label="Horímetro Anterior (Última Manutenção)"
                value={previousHourmeter}
                onChange={() => {}} // Campo somente leitura
                disabled={true}
              />
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Preenchido automaticamente do último registro de manutenção preventiva
              </p>
            </div>

            <div className="space-y-2">
              <HourmeterInput
                label="Horímetro Atual"
                value={currentHourmeter}
                onChange={() => {}}
                disabled={true}
              />
              <p className="text-xs text-green-600 dark:text-green-400">
                ✓ Preenchido automaticamente do último registro de manutenção preventiva
              </p>
            </div>

            <div className="space-y-2">
              <HourmeterInput
                label="Próxima Revisão (Horímetro)"
                value={nextRevisionHourmeter || 0}
                onChange={setNextRevisionHourmeter}
                disabled={false}
              />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                ✓ Calculado automaticamente (Atual + Intervalo). Editável para ajustes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Cliente */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Dados do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>

            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label>Obra/Local</Label>
              <Input
                value={clientWorkSite}
                onChange={(e) => setClientWorkSite(e.target.value)}
                placeholder="Local de trabalho"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Verificações */}
      <div className="no-print space-y-3">
        {/* Indicador de origem do template */}
        {templateSource && (
          <Alert className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
              {templateSource}
            </AlertDescription>
          </Alert>
        )}
        
        <VerificationTable
          sections={verificationSections}
          onChange={setVerificationSections}
          showCategoryButtons={equipmentName.toLowerCase().includes("gerador") || equipment?.equipment_name?.toLowerCase().includes("gerador")}
          onMotorIntervalChange={setSelectedMotorInterval}
          onAlternadorIntervalChange={setSelectedAlternadorInterval}
        />
      </div>

      {/* Fotos */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Fotos do Equipamento (4 obrigatórias)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <PhotoUploadBox
                key={`main-${index}`}
                index={index}
                photo={photo}
                onUpload={handlePhotoUpload}
                onCommentChange={handlePhotoCommentChange}
                onRemove={handlePhotoRemove}
                label={`Foto ${index + 1}`}
              />
            ))}
          </div>

          {additionalPhotos.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Fotos Adicionais</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {additionalPhotos.map((photo, index) => (
                  <PhotoUploadBox
                    key={`additional-${index}`}
                    index={index}
                    photo={photo}
                    onUpload={handleAdditionalPhotoUpload}
                    onCommentChange={handleAdditionalPhotoCommentChange}
                    onRemove={handleAdditionalPhotoRemove}
                    label={`Foto Adicional ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleAddAdditionalPhoto}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Foto Adicional
          </Button>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card className="no-print">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Observação 1 - Cuidados Operacionais</Label>
            <Textarea
              value={observationsOperational}
              onChange={(e) => setObservationsOperational(e.target.value)}
              placeholder="Cuidados operacionais, instruções de uso..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Observação 2 - Contatos de Assistência Técnica</Label>
            <Textarea
              value={observationsTechnical}
              onChange={(e) => setObservationsTechnical(e.target.value)}
              placeholder="Telefones, emails, contatos de emergência..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Observação 3 - Procedimentos</Label>
            <Textarea
              value={observationsProcedures}
              onChange={(e) => setObservationsProcedures(e.target.value)}
              placeholder="Procedimentos de parada, funcionamento, emergência..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assinaturas */}
      <div className="no-print">
        <MaintenanceSignatures
          supervisorName={supervisorName}
          supervisorCpf={supervisorCpf}
          supervisorSignature={supervisorSignature}
          technicianName={technicianName}
          technicianCpf={technicianCpf}
          technicianSignature={technicianSignature}
          clientName={signatureClientName}
          clientCpf={clientCpf}
          clientSignature={clientSignature}
          onChange={handleSignatureChange}
        />
      </div>

      {/* Botões de Ação */}
      <Card className="no-print">
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Checkbox para salvar como template */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveAsTemplate"
                checked={saveAsTemplateChecked}
                onCheckedChange={(checked) => setSaveAsTemplateChecked(checked === true)}
              />
              <label
                htmlFor="saveAsTemplate"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Salvar tabela como template para{" "}
                <span className="text-primary font-semibold">
                  {equipment?.equipment_name || equipmentName || "este tipo de equipamento"}
                </span>
              </label>
            </div>
            
            {/* Botões */}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={fillMockData} className="hidden md:flex">
                🧪 Teste
              </Button>
              <Button variant="outline" onClick={() => navigate("/assets")}>
                Cancelar
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || createPlan.isPending || updatePlan.isPending}>
                {isSaving || createPlan.isPending || updatePlan.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {mode === "edit" ? "Atualizando..." : "Salvando..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {mode === "edit" ? "Atualizar Plano" : "Salvar Plano"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
