import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useReportDetails } from "@/hooks/useReportDetails";
import { useWithdrawalsByPAT } from "@/hooks/useWithdrawalsByPAT";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { formatPAT } from "@/lib/patUtils";
import { BackButton } from "@/components/BackButton";
import { getTodayLocalDate, parseInputDateToBelem, getISOStringInBelem } from "@/lib/dateUtils";
import { ReportEquipmentSelector } from "@/components/reports/ReportEquipmentSelector";
import { ReportPartsManager } from "@/components/reports/ReportPartsManager";
import { ReportPhotoUploader } from "@/components/reports/ReportPhotoUploader";
import { ReportFormFields } from "@/components/reports/ReportFormFields";
import { DuplicateReportWarning } from "@/components/DuplicateReportWarning";
import { Loader2 } from "lucide-react";

interface ReportPart {
  withdrawal_id: string;
  product_id: string;
  quantity_used: number;
  quantity_withdrawn: number;
  productName: string;
  productCode: string;
  purchasePrice: number | null;
  isNonCataloged?: boolean;
  isRemoved?: boolean;
}

interface PhotoData {
  file: File | null;
  preview: string;
  comment: string;
  existingUrl?: string;
}

const ReportEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { data: reportData, isLoading: loadingReport } = useReportDetails(id);

  const [formData, setFormData] = useState({
    equipment_code: "",
    equipment_name: "",
    work_site: "",
    company: "",
    technician_name: "",
    report_date: getTodayLocalDate(),
    service_comments: "",
    considerations: "",
    observations: "",
    receiver: "",
    responsible: "",
  });

  const [parts, setParts] = useState<ReportPart[]>([]);
  const [photos, setPhotos] = useState<PhotoData[]>(
    Array(6).fill(null).map(() => ({ file: null, preview: "", comment: "" }))
  );
  const [additionalPhotos, setAdditionalPhotos] = useState<PhotoData[]>([]);

  // Buscar informações do equipamento pelo PAT
  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(
    formData.equipment_code
  );

  // Buscar retiradas disponíveis para o PAT
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useWithdrawalsByPAT(
    formatPAT(formData.equipment_code) || ""
  );

  // Preencher formulário com dados do relatório existente
  useEffect(() => {
    if (reportData?.report) {
      const report = reportData.report;
      setFormData({
        equipment_code: report.equipment_code || "",
        equipment_name: report.equipment_name || "",
        work_site: report.work_site || "",
        company: report.company || "",
        technician_name: report.technician_name || "",
        report_date: report.report_date || getTodayLocalDate(),
        service_comments: report.service_comments || "",
        considerations: report.considerations || "",
        observations: report.observations || "",
        receiver: report.receiver || "",
        responsible: report.responsible || "",
      });

      // Carregar peças existentes
      if (reportData.parts && reportData.parts.length > 0) {
        const existingParts = reportData.parts.map((part: any) => ({
          withdrawal_id: part.withdrawal_id || "",
          product_id: part.product_id,
          quantity_used: part.quantity_used,
          quantity_withdrawn: part.material_withdrawals?.quantity || part.quantity_used,
          productName: part.products?.name || "",
          productCode: part.products?.code || "",
          purchasePrice: part.products?.purchase_price || null,
          isNonCataloged: part.product_id === '00000000-0000-0000-0000-000000000001',
        }));
        setParts(existingParts);
      }

      // Carregar fotos existentes
      if (reportData.photos && reportData.photos.length > 0) {
        const loadedPhotos = [...photos];
        const additionalPhotosData: PhotoData[] = [];

        reportData.photos.forEach((photo: any, index: number) => {
          const photoData = {
            file: null,
            preview: photo.signed_url || "",
            comment: photo.photo_comment || "",
            existingUrl: photo.photo_url,
          };

          if (index < 6) {
            loadedPhotos[index] = photoData;
          } else {
            additionalPhotosData.push(photoData);
          }
        });

        setPhotos(loadedPhotos);
        setAdditionalPhotos(additionalPhotosData);
      }
    }
  }, [reportData]);

  // Adicionar retiradas disponíveis às peças (sem sobrescrever existentes)
  useEffect(() => {
    if (withdrawals && withdrawals.length > 0 && reportData?.parts) {
      const existingProductIds = new Set(parts.map(p => p.product_id));
      const newParts = withdrawals
        .filter(w => !existingProductIds.has(w.product_id))
        .map(w => ({
          withdrawal_id: w.id,
          product_id: w.product_id,
          quantity_used: 0,
          quantity_withdrawn: w.remaining_quantity,
          productName: w.products?.name || "",
          productCode: w.products?.code || "",
          purchasePrice: w.products?.purchase_price || null,
          isNonCataloged: w.product_id === '00000000-0000-0000-0000-000000000001',
        }));

      if (newParts.length > 0) {
        setParts(prev => [...prev, ...newParts]);
      }
    }
  }, [withdrawals, reportData]);

  const updatePartQuantity = (index: number, newQuantity: number) => {
    const part = parts[index];

    if (newQuantity < 0) {
      toast.error("Quantidade não pode ser negativa!");
      return;
    }

    // Produtos não catalogados não têm limite de quantidade (apenas informativos)
    if (!part.isNonCataloged && newQuantity > part.quantity_withdrawn) {
      toast.error(
        `Quantidade não pode exceder ${part.quantity_withdrawn} (total disponível)!`
      );
      return;
    }

    const updatedParts = [...parts];
    updatedParts[index] = { ...part, quantity_used: newQuantity };
    setParts(updatedParts);
  };

  const handleRemovePart = (index: number) => {
    const part = parts[index];
    
    // Mark as removed instead of deleting (soft delete for history)
    const updatedParts = [...parts];
    updatedParts[index] = { ...part, isRemoved: true, quantity_used: 0 };
    setParts(updatedParts);
    
    toast.success(`Peça "${part.productName}" removida da lista`);
  };

  const handlePhotoChange = (index: number, file: File | null) => {
    const updatedPhotos = [...photos];
    if (file) {
      updatedPhotos[index] = {
        ...updatedPhotos[index],
        file,
        preview: URL.createObjectURL(file),
      };
    } else {
      updatedPhotos[index] = { file: null, preview: "", comment: "" };
    }
    setPhotos(updatedPhotos);
  };

  const handlePhotoCommentChange = (index: number, comment: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index] = { ...updatedPhotos[index], comment };
    setPhotos(updatedPhotos);
  };

  const handleAdditionalPhotoChange = (index: number, file: File | null) => {
    const updatedPhotos = [...additionalPhotos];
    if (file) {
      updatedPhotos[index] = {
        ...updatedPhotos[index],
        file,
        preview: URL.createObjectURL(file),
      };
    } else {
      updatedPhotos[index] = { file: null, preview: "", comment: "" };
    }
    setAdditionalPhotos(updatedPhotos);
  };

  const handleAdditionalPhotoCommentChange = (index: number, comment: string) => {
    const updatedPhotos = [...additionalPhotos];
    updatedPhotos[index] = { ...updatedPhotos[index], comment };
    setAdditionalPhotos(updatedPhotos);
  };

  const addAdditionalPhoto = () => {
    setAdditionalPhotos([...additionalPhotos, { file: null, preview: "", comment: "" }]);
  };

  const removeAdditionalPhoto = (index: number) => {
    setAdditionalPhotos(additionalPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Usuário não autenticado!");
      return;
    }

    if (!id) {
      toast.error("ID do relatório não encontrado!");
      return;
    }

    // Validações básicas
    if (!formData.equipment_code.trim()) {
      toast.error("Código do equipamento (PAT) é obrigatório!");
      return;
    }

    if (!formData.technician_name.trim()) {
      toast.error("Nome do técnico é obrigatório!");
      return;
    }

    if (!formData.service_comments.trim()) {
      toast.error("Comentários do serviço são obrigatórios!");
      return;
    }

    const usedParts = parts.filter(p => p.quantity_used > 0 && !p.isRemoved);
    if (usedParts.length === 0) {
      toast.error("Selecione pelo menos uma peça utilizada!");
      return;
    }

    const allPhotos = [...photos, ...additionalPhotos];
    const hasPhotos = allPhotos.some(p => p.file !== null || p.existingUrl);
    if (!hasPhotos) {
      toast.error("Adicione pelo menos uma foto!");
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar dados do relatório
      const { error: updateError } = await supabase
        .from("reports")
        .update({
          equipment_code: formatPAT(formData.equipment_code),
          equipment_name: formData.equipment_name,
          work_site: formData.work_site,
          company: formData.company,
          technician_name: formData.technician_name,
          report_date: parseInputDateToBelem(formData.report_date),
          service_comments: formData.service_comments,
          considerations: formData.considerations,
          observations: formData.observations,
          receiver: formData.receiver,
          responsible: formData.responsible,
          updated_at: getISOStringInBelem(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      // 2. Deletar peças antigas
      const { error: deletePartsError } = await supabase
        .from("report_parts")
        .delete()
        .eq("report_id", id);

      if (deletePartsError) throw deletePartsError;

      // 3. Inserir peças atualizadas
      const partsToInsert = usedParts.map(part => ({
        report_id: id,
        product_id: part.product_id,
        quantity_used: part.quantity_used,
        withdrawal_id: part.withdrawal_id || null,
      }));

      const { error: insertPartsError } = await supabase
        .from("report_parts")
        .insert(partsToInsert);

      if (insertPartsError) throw insertPartsError;

      // 4. Atualizar retiradas vinculadas
      for (const part of usedParts) {
        if (part.withdrawal_id) {
          const { error: withdrawalError } = await supabase
            .from("material_withdrawals")
            .update({ used_in_report_id: id })
            .eq("id", part.withdrawal_id);

          if (withdrawalError) throw withdrawalError;
        }
      }

      // 5. Deletar fotos antigas
      const { error: deletePhotosError } = await supabase
        .from("report_photos")
        .delete()
        .eq("report_id", id);

      if (deletePhotosError) throw deletePhotosError;

      // 6. Upload e inserir fotos atualizadas
      let photoOrder = 1;
      for (const photo of allPhotos) {
        if (photo.file || photo.existingUrl) {
          let photoUrl = photo.existingUrl;

          // Upload nova foto se houver
          if (photo.file) {
            // Se tem existingUrl, é foto antiga editada - deletar antiga do storage
            if (photo.existingUrl) {
              const { error: deleteError } = await supabase.storage
                .from("report-photos")
                .remove([photo.existingUrl]);
              
              if (deleteError) {
                console.warn('Erro ao deletar foto antiga:', deleteError);
              }
            }

            const fileName = `${id}_${Date.now()}_${photoOrder}.${photo.file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage
              .from("report-photos")
              .upload(fileName, photo.file);

            if (uploadError) throw uploadError;
            photoUrl = fileName;
          }

          if (photoUrl) {
            const { error: photoError } = await supabase
              .from("report_photos")
              .insert({
                report_id: id,
                photo_url: photoUrl,
                photo_comment: photo.comment || "",
                photo_order: photoOrder,
              });

            if (photoError) throw photoError;
            photoOrder++;
          }
        }
      }

      toast.success("✅ Relatório atualizado com sucesso!");
      navigate("/reports");
    } catch (error: any) {
      console.error("Erro ao atualizar relatório:", error);
      toast.error(`❌ Erro ao atualizar relatório: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingReport) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!reportData?.report) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <BackButton />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Relatório não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <BackButton />

      <Card>
        <CardHeader>
          <CardTitle>✏️ Editar Relatório de Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Warning de Relatórios Duplicados */}
            {formData.equipment_code && formData.report_date && (
              <DuplicateReportWarning
                equipmentCode={formatPAT(formData.equipment_code) || ""}
                reportDate={formData.report_date}
                excludeReportId={id}
              />
            )}

            {/* Seletor de Equipamento */}
            <ReportEquipmentSelector
              equipmentCode={formData.equipment_code}
              equipmentName={formData.equipment_name}
              onEquipmentCodeChange={(value) =>
                setFormData({
                  ...formData,
                  equipment_code: value,
                  equipment_name: value ? formData.equipment_name : "",
                })
              }
              onEquipmentNameChange={(value) =>
                setFormData({ ...formData, equipment_name: value })
              }
              onEquipmentCodeBlur={(value) => {
                const formatted = formatPAT(value);
                if (formatted) {
                  setFormData({ ...formData, equipment_code: formatted });
                }
              }}
              equipment={equipment}
              loadingEquipment={loadingEquipment}
            />

            {/* Campos do Relatório */}
            <ReportFormFields
              company={formData.company}
              workSite={formData.work_site}
              technicianName={formData.technician_name}
              reportDate={formData.report_date}
              serviceComments={formData.service_comments}
              considerations={formData.considerations}
              observations={formData.observations}
              receiver={formData.receiver}
              responsible={formData.responsible}
              equipment={equipment}
              onCompanyChange={(value) => setFormData({ ...formData, company: value })}
              onWorkSiteChange={(value) => setFormData({ ...formData, work_site: value })}
              onTechnicianNameChange={(value) => setFormData({ ...formData, technician_name: value })}
              onReportDateChange={(value) => setFormData({ ...formData, report_date: value })}
              onServiceCommentsChange={(value) => setFormData({ ...formData, service_comments: value })}
              onConsiderationsChange={(value) => setFormData({ ...formData, considerations: value })}
              onObservationsChange={(value) => setFormData({ ...formData, observations: value })}
              onReceiverChange={(value) => setFormData({ ...formData, receiver: value })}
              onResponsibleChange={(value) => setFormData({ ...formData, responsible: value })}
            />

            {/* Gerenciador de Peças */}
            <ReportPartsManager
              parts={parts}
              onUpdateQuantity={updatePartQuantity}
              onRemovePart={handleRemovePart}
              loadingWithdrawals={loadingWithdrawals}
            />

            {/* Upload de Fotos */}
            <ReportPhotoUploader
              photos={photos}
              additionalPhotos={additionalPhotos}
              onPhotoChange={handlePhotoChange}
              onPhotoCommentChange={handlePhotoCommentChange}
              onRemovePhoto={(index) => handlePhotoChange(index, null)}
              onAdditionalPhotoChange={handleAdditionalPhotoChange}
              onAdditionalPhotoCommentChange={handleAdditionalPhotoCommentChange}
              onRemoveAdditionalPhoto={removeAdditionalPhoto}
              onAddAdditionalPhoto={addAdditionalPhoto}
            />

            {/* Botões de Ação */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/reports")}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "💾 Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportEdit;
