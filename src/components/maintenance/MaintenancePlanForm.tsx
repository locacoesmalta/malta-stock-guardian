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
import { getDefaultSections, VerificationSection } from "@/lib/maintenancePlanDefaults";
import { formatPAT } from "@/lib/patUtils";
import { formatHourmeter } from "@/lib/hourmeterUtils";
import { getCurrentDate, formatBelemDate } from "@/config/timezone";
import { Wrench, Package, User, FileText, Save, Loader2, Plus, CheckCircle2, XCircle, Printer, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/maintenance-plan-print.css";

export function MaintenancePlanForm() {
  const navigate = useNavigate();
  const { createPlan, useLastPlanByAssetId } = useMaintenancePlans();
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

  // Fotos
  const [photos, setPhotos] = useState<PhotoData[]>([
    { file: null, preview: "", comment: "" },
    { file: null, preview: "", comment: "" },
    { file: null, preview: "", comment: "" },
    { file: null, preview: "", comment: "" },
  ]);
  const [additionalPhotos, setAdditionalPhotos] = useState<PhotoData[]>([]);

  // Buscar dados do equipamento
  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(patFormatted);
  const { totalHourmeter } = useAssetMaintenances(equipment?.id);
  
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

  // Carregar tabela de verificação com hierarquia: 
  // 1. Último plano do mesmo PAT
  // 2. Template salvo (tipo + fabricante + modelo)
  // 3. Template padrão do código
  useEffect(() => {
    const loadVerificationSections = async () => {
      if (!equipment) return;

      // 1. Primeiro: último plano do mesmo PAT
      if (lastPlan?.verification_sections) {
        setVerificationSections(lastPlan.verification_sections as unknown as VerificationSection[]);
        setTemplateSource(`Último plano do PAT ${formatPAT(equipment.asset_code)}`);
        return;
      }

      // 2. Segundo: buscar template hierárquico
      const template = await getTemplateByEquipment(
        equipment.equipment_name,
        equipment.manufacturer,
        equipment.model
      );

      if (template) {
        setVerificationSections(template.sections);
        setTemplateSource(template.source);
        toast.info(`Tabela carregada: ${template.source}`);
      }
    };

    loadVerificationSections();
  }, [equipment, lastPlan, getTemplateByEquipment]);

  // Preencher horímetro do último registro
  useEffect(() => {
    if (totalHourmeter !== undefined) {
      setPreviousHourmeter(totalHourmeter);
    }
  }, [totalHourmeter]);

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

    const { error } = await supabase.storage.from("reports").upload(filePath, photo.file);

    if (error) {
      console.error("Erro ao fazer upload:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("reports").getPublicUrl(filePath);

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
        supervisor_signature: supervisorSignature,
        technician_name: technicianName,
        technician_signature: technicianSignature,
        client_signature: clientSignature,
        verification_sections: verificationSections,
        photos: uploadedPhotos,
      };

      createPlan.mutate(planData, {
        onSuccess: async () => {
          const displayName = formatPAT(patCode) || equipmentName;
          
          // Salvar como template se checkbox marcado
          if (saveAsTemplateChecked && verificationSections.length > 0) {
            const eqType = equipment?.equipment_name || equipmentName;
            const eqManufacturer = equipment?.manufacturer || equipmentManufacturer;
            
            try {
              await saveAsTemplate.mutateAsync({
                name: `${eqType} ${eqManufacturer || ""}`.trim(),
                equipmentType: eqType,
                manufacturer: eqManufacturer || null,
                model: null, // Salva para tipo + fabricante (equipamentos similares)
                sections: verificationSections,
              });
            } catch (error) {
              console.error("Erro ao salvar template:", error);
            }
          }
          
          toast.success(`✅ Plano de manutenção salvo com sucesso!`, {
            description: `${displayName} - ${planType === "preventiva" ? "Preventiva" : "Corretiva"}`,
            duration: 5000,
            action: {
              label: "Imprimir",
              onClick: () => window.print(),
            },
          });
          // Aguarda para permitir impressão antes de navegar
          setTimeout(() => navigate("/assets"), 3000);
        },
        onError: (error) => {
          toast.error("Erro ao salvar plano de manutenção", {
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

        {/* Fotos */}
        {allPhotos.length > 0 && (
          <div className="print-photos-section print-section">
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

        {/* Observações */}
        <div className="print-observations-section print-section">
          <h3 className="print-section-title">OBSERVAÇÕES</h3>
          
          {observationsOperational && (
            <div>
              <div className="print-observation-label">Cuidados Operacionais:</div>
              <div className="print-observation-box">{observationsOperational}</div>
            </div>
          )}
          
          {observationsTechnical && (
            <div>
              <div className="print-observation-label">Contatos de Assistência Técnica:</div>
              <div className="print-observation-box">{observationsTechnical}</div>
            </div>
          )}
          
          {observationsProcedures && (
            <div>
              <div className="print-observation-label">Procedimentos:</div>
              <div className="print-observation-box">{observationsProcedures}</div>
            </div>
          )}
        </div>

        {/* Assinaturas */}
        <div className="print-signatures-section print-section">
          <h3 className="print-section-title">ASSINATURAS</h3>
          <div className="print-signatures-grid">
            {/* Supervisor */}
            <div className="print-signature-box">
              <div className="print-signature-image">
                {supervisorSignature && <img src={supervisorSignature} alt="Assinatura Supervisor" />}
              </div>
              <div className="print-signature-line">
                <div className="print-signature-name">{supervisorName || "___________________"}</div>
                <div className="print-signature-cpf">{supervisorCpf || "CPF/Matrícula: ___________"}</div>
              </div>
              <div className="print-signature-role">Supervisor</div>
            </div>

            {/* Técnico */}
            <div className="print-signature-box">
              <div className="print-signature-image">
                {technicianSignature && <img src={technicianSignature} alt="Assinatura Técnico" />}
              </div>
              <div className="print-signature-line">
                <div className="print-signature-name">{technicianName || "___________________"}</div>
                <div className="print-signature-cpf">{technicianCpf || "CPF/Matrícula: ___________"}</div>
              </div>
              <div className="print-signature-role">Técnico</div>
            </div>

            {/* Cliente */}
            <div className="print-signature-box">
              <div className="print-signature-image">
                {clientSignature && <img src={clientSignature} alt="Assinatura Cliente" />}
              </div>
              <div className="print-signature-line">
                <div className="print-signature-name">{signatureClientName || "___________________"}</div>
                <div className="print-signature-cpf">{clientCpf || "CPF/Matrícula: ___________"}</div>
              </div>
              <div className="print-signature-role">Cliente</div>
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
              <Label>Horímetro Anterior (Última Manutenção)</Label>
              <Input
                value={formatHourmeter(previousHourmeter)}
                readOnly
                className="bg-muted font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Valor da última manutenção registrada
              </p>
            </div>

            <HourmeterInput
              label="Horímetro Atual (Novo)"
              value={currentHourmeter}
              onChange={setCurrentHourmeter}
            />

            <HourmeterInput
              label="Próxima Revisão (Horímetro)"
              value={nextRevisionHourmeter || 0}
              onChange={(v) => setNextRevisionHourmeter(v || undefined)}
            />
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
              <Button onClick={handleSubmit} disabled={isSaving || createPlan.isPending}>
                {isSaving || createPlan.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Plano
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
