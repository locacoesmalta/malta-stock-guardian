import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MaintenancePlanHeader } from "./MaintenancePlanHeader";
import { VerificationTable } from "./VerificationTable";
import { MaintenanceSignatures } from "./MaintenanceSignatures";
import { HourmeterInput } from "@/components/HourmeterInput";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { useMaintenancePlans, MaintenancePlanData, MaintenancePlanPhoto } from "@/hooks/useMaintenancePlans";
import { useAssetMaintenances } from "@/hooks/useAssetMaintenances";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { getDefaultSections, VerificationSection } from "@/lib/maintenancePlanDefaults";
import { formatPAT } from "@/lib/patUtils";
import { formatHourmeter } from "@/lib/hourmeterUtils";
import { Wrench, Package, User, FileText, Save, Loader2, Upload, X, Plus, CheckCircle2, XCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import "@/styles/maintenance-plan-print.css";

interface PhotoData {
  file: File | null;
  preview: string;
  comment: string;
}

export function MaintenancePlanForm() {
  const navigate = useNavigate();
  const { createPlan, useLastPlanByAssetId } = useMaintenancePlans();
  const { data: assets = [] } = useAssetsQuery();

  // Estados do formulário
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [patCode, setPatCode] = useState("");
  const [patFormatted, setPatFormatted] = useState("");
  const [planType, setPlanType] = useState<"preventiva" | "corretiva">("preventiva");
  const [planDate, setPlanDate] = useState(new Date().toISOString().split("T")[0]);
  const [previousHourmeter, setPreviousHourmeter] = useState(0);
  const [currentHourmeter, setCurrentHourmeter] = useState(0);
  const [nextRevisionHourmeter, setNextRevisionHourmeter] = useState<number | undefined>();

  // Dados da empresa
  const [companyData, setCompanyData] = useState({
    company_name: "Malta Locações",
    company_cnpj: "10.792.415/0001-14",
    company_address: "Rua Augusto Corrêa, 01 - Guamá, Belém - PA",
    company_cep: "66075-110",
    company_phone: "(91) 99628-0080",
    company_email: "contato@maltalocacoes.com.br",
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
      
      // Preencher dados do cliente baseado no location_type
      if (equipment.location_type === "locacao" || equipment.location_type === "aguardando_laudo") {
        // Em locação ou aguardando laudo - usar dados de rental
        setClientCompany(equipment.rental_company || "");
        setClientWorkSite(equipment.rental_work_site || "");
      } else if (equipment.location_type === "em_manutencao") {
        // Em manutenção - usar dados de manutenção
        setClientCompany(equipment.maintenance_company || "");
        setClientWorkSite(equipment.maintenance_work_site || "");
      }
      // Se em depósito, deixar vazio (equipamento não está em nenhum cliente)
    }
  }, [equipment]);

  // Carregar tabela de verificação: do último plano salvo ou template padrão
  useEffect(() => {
    if (equipment) {
      if (lastPlan?.verification_sections) {
        // Reutilizar tabela do último plano salvo para este PAT
        setVerificationSections(lastPlan.verification_sections as unknown as VerificationSection[]);
        toast.info("Tabela de verificação carregada do último plano");
      } else {
        // Primeiro plano para este PAT → usar template padrão
        setVerificationSections(getDefaultSections(equipment.equipment_name));
      }
    }
  }, [equipment, lastPlan]);

  // Preencher horímetro do último registro
  useEffect(() => {
    if (totalHourmeter !== undefined) {
      setPreviousHourmeter(totalHourmeter);
    }
  }, [totalHourmeter]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureChange = (field: string, value: string) => {
    switch (field) {
      case "supervisor_name":
        setSupervisorName(value);
        break;
      case "supervisor_cpf":
        setSupervisorCpf(value);
        break;
      case "supervisor_signature":
        setSupervisorSignature(value);
        break;
      case "technician_name":
        setTechnicianName(value);
        break;
      case "technician_cpf":
        setTechnicianCpf(value);
        break;
      case "technician_signature":
        setTechnicianSignature(value);
        break;
      case "client_name":
        setSignatureClientName(value);
        break;
      case "client_cpf":
        setClientCpf(value);
        break;
      case "client_signature":
        setClientSignature(value);
        break;
    }
  };

  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const newPhotos = [...photos];
      newPhotos[index] = { ...newPhotos[index], file, preview };
      setPhotos(newPhotos);
    }
  };

  const handlePhotoCommentChange = (index: number, comment: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], comment };
    setPhotos(newPhotos);
  };

  const handlePhotoRemove = (index: number) => {
    const newPhotos = [...photos];
    if (newPhotos[index].preview) {
      URL.revokeObjectURL(newPhotos[index].preview);
    }
    newPhotos[index] = { file: null, preview: "", comment: "" };
    setPhotos(newPhotos);
  };

  const handleAdditionalPhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      const newPhotos = [...additionalPhotos];
      newPhotos[index] = { ...newPhotos[index], file, preview };
      setAdditionalPhotos(newPhotos);
    }
  };

  const handleAdditionalPhotoCommentChange = (index: number, comment: string) => {
    const newPhotos = [...additionalPhotos];
    newPhotos[index] = { ...newPhotos[index], comment };
    setAdditionalPhotos(newPhotos);
  };

  const handleAdditionalPhotoRemove = (index: number) => {
    const newPhotos = [...additionalPhotos];
    if (newPhotos[index].preview) {
      URL.revokeObjectURL(newPhotos[index].preview);
    }
    setAdditionalPhotos(newPhotos.filter((_, i) => i !== index));
  };

  const handleAddAdditionalPhoto = () => {
    setAdditionalPhotos([...additionalPhotos, { file: null, preview: "", comment: "" }]);
  };

  const uploadPhoto = async (photo: PhotoData, index: number): Promise<MaintenancePlanPhoto | null> => {
    if (!photo.file && !photo.preview) return null;

    // Se já é uma URL, retorna direto
    if (photo.preview && !photo.file) {
      return {
        url: photo.preview,
        comment: photo.comment,
        order: index,
      };
    }

    if (!photo.file) return null;

    const fileExt = photo.file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `maintenance-plans/${fileName}`;

    const { error } = await supabase.storage
      .from("reports")
      .upload(filePath, photo.file);

    if (error) {
      console.error("Erro ao fazer upload:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("reports")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      comment: photo.comment,
      order: index,
    };
  };

  // Função para preencher dados de teste (apenas para visualização de impressão)
  const fillMockData = () => {
    // Tipo e Data
    setPlanType("preventiva");
    setPlanDate(new Date().toISOString().split("T")[0]);
    
    // Equipamento (dados manuais para teste)
    setPatCode("0048");
    setEquipmentName("GERADOR 55KVA SILENCIADO");
    setEquipmentManufacturer("CUMMINS");
    setEquipmentModel("C55D5");
    setEquipmentSerial("CMS-2024-55789");
    setPreviousHourmeter(1250);
    setCurrentHourmeter(1500);
    setNextRevisionHourmeter(1750);
    
    // Cliente
    setClientName("João Carlos da Silva");
    setClientCompany("Construtora Horizonte Ltda");
    setClientWorkSite("Obra Residencial Porto Sol - Bloco A");
    
    // Observações completas
    setObservationsOperational(
      "• Manter nível de combustível acima de 30% para evitar entrada de ar no sistema\n" +
      "• Verificar visualmente vazamentos de óleo ou combustível antes de ligar\n" +
      "• Aguardar 30 segundos após partida antes de aplicar carga\n" +
      "• Não desligar o equipamento sob carga total - reduzir gradualmente\n" +
      "• Realizar inspeção visual diária do nível de água do radiador"
    );
    
    setObservationsTechnical(
      "📞 EMERGÊNCIA 24H: (91) 99628-0080 - Walter\n" +
      "📞 Assistência Técnica: (91) 3222-1100\n" +
      "📧 Email: suporte@maltalocacoes.com.br\n" +
      "⚙️ Peças Originais: Distribuidora Cummins Norte - (91) 3333-4444\n" +
      "🏭 Endereço: Rua Augusto Corrêa, 01 - Guamá, Belém - PA"
    );
    
    setObservationsProcedures(
      "PROCEDIMENTO DE PARTIDA:\n" +
      "1. Verificar nível de óleo lubrificante\n" +
      "2. Verificar nível de combustível (mínimo 30%)\n" +
      "3. Verificar se disjuntor principal está desligado\n" +
      "4. Acionar chave de partida e aguardar estabilização\n" +
      "5. Aguardar 30 segundos em marcha lenta\n" +
      "6. Ligar disjuntor e aplicar carga gradualmente\n\n" +
      "PROCEDIMENTO DE PARADA:\n" +
      "1. Desligar cargas gradualmente\n" +
      "2. Desligar disjuntor principal\n" +
      "3. Aguardar 5 minutos em marcha lenta para resfriamento\n" +
      "4. Desligar chave de ignição"
    );
    
    // Nomes e CPF/Matrícula das assinaturas
    setSupervisorName("Walter Malta");
    setSupervisorCpf("123.456.789-00");
    setTechnicianName("Everton Souza");
    setTechnicianCpf("MAT-2024-001");
    setSignatureClientName("João Carlos da Silva");
    setClientCpf("987.654.321-00");
    
    // Carregar tabela de verificação de gerador com alguns itens marcados
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
    
    toast.success("Dados de teste preenchidos! Clique em Imprimir para visualizar.");
  };

  const handleSubmit = async () => {
    // Validações básicas
    if (!patCode && !equipmentName) {
      toast.error("Informe o PAT ou nome do equipamento");
      return;
    }

    // Upload das fotos
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
      onSuccess: () => {
        navigate("/assets");
      },
    });
  };

  // Componente de foto inline
  const PhotoUploadBox = ({
    index,
    photo,
    onUpload,
    onCommentChange,
    onRemove,
    label,
  }: {
    index: number;
    photo: PhotoData;
    onUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onCommentChange: (index: number, comment: string) => void;
    onRemove: (index: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      {photo.preview ? (
        <div className="relative">
          <img
            src={photo.preview}
            alt={label}
            className="w-full h-40 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => onRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">Clique para enviar</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onUpload(index, e)}
          />
        </label>
      )}
      <Textarea
        value={photo.comment}
        onChange={(e) => onCommentChange(index, e.target.value)}
        placeholder="Comentário da foto..."
        rows={2}
        className="text-sm"
      />
    </div>
  );

  return (
    <div className="space-y-6 maintenance-plan-print">
      {/* Cabeçalho de Impressão - Visível apenas ao imprimir */}
      <div className="print-header hidden print:block">
        <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          {/* Logo à esquerda */}
          <img 
            src="/malta-logo.webp" 
            alt="Malta Locações" 
            className="h-16 print-logo"
          />
          
          {/* Título centralizado - DINÂMICO baseado no planType */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold uppercase print-title">
              Plano de Manutenção {planType === "preventiva" ? "Preventiva" : "Corretiva"}
            </h1>
            <p className="text-sm text-gray-600">
              Data: {new Date(planDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          {/* Informações da empresa à direita */}
          <div className="text-right text-xs print-company-info">
            <p className="font-bold">{companyData.company_name}</p>
            <p>CNPJ: {companyData.company_cnpj}</p>
            <p>{companyData.company_phone}</p>
          </div>
        </div>
      </div>

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
              
              {/* PAT validation feedback */}
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
      <Card>
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
      <Card>
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
      <VerificationTable
        sections={verificationSections}
        onChange={setVerificationSections}
      />

      {/* Fotos */}
      <Card>
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
                key={index}
                index={index}
                photo={photo}
                onUpload={handlePhotoUpload}
                onCommentChange={handlePhotoCommentChange}
                onRemove={handlePhotoRemove}
                label={`Foto ${index + 1}`}
              />
            ))}
          </div>

          {/* Fotos Adicionais */}
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
      <Card>
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

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 no-print">
        <Button variant="secondary" onClick={fillMockData}>
          🧪 Preencher Teste
        </Button>
        <Button variant="outline" onClick={() => navigate("/assets")}>
          Cancelar
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
        <Button onClick={handleSubmit} disabled={createPlan.isPending}>
          {createPlan.isPending ? (
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
  );
}
