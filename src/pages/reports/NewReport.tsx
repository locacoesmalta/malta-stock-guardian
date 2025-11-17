import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import "@/styles/report-print.css";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { useWithdrawalsByPAT } from "@/hooks/useWithdrawalsByPAT";
import { useEquipmentFormAutofill } from "@/hooks/useEquipmentFormAutofill";
import { formatPAT } from "@/lib/patUtils";
import { BackButton } from "@/components/BackButton";
import { getTodayLocalDate, parseInputDateToBelem } from "@/lib/dateUtils";
import { ReportEquipmentSelector } from "@/components/reports/ReportEquipmentSelector";
import { ReportPartsManager } from "@/components/reports/ReportPartsManager";
import { ReportPhotoUploader } from "@/components/reports/ReportPhotoUploader";
import { ReportFormFields } from "@/components/reports/ReportFormFields";
import { DuplicateReportWarning } from "@/components/DuplicateReportWarning";

interface ReportPart {
  withdrawal_id: string;
  product_id: string;
  quantity_used: number;
  quantity_withdrawn: number;
  productName: string;
  productCode: string;
  purchasePrice: number | null;
}

interface PhotoData {
  file: File | null;
  preview: string;
  comment: string;
}

const NewReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Capturar PAT da URL (query parameter)
  const searchParams = new URLSearchParams(window.location.search);
  const patFromUrl = searchParams.get("pat");

  const [formData, setFormData] = useState({
    equipment_code: patFromUrl || "",
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
  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(formData.equipment_code);
  
  // Buscar retiradas de material vinculadas ao PAT
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useWithdrawalsByPAT(
    formatPAT(formData.equipment_code) || ""
  );

  // Usar hook de autofill para preencher campos automaticamente
  useEquipmentFormAutofill({
    equipment,
    equipmentCode: formData.equipment_code,
    setFormData,
  });

  // Converter retiradas em formato de peças
  useEffect(() => {
    if (withdrawals && withdrawals.length > 0) {
      const partsFromWithdrawals = withdrawals.map(w => ({
        withdrawal_id: w.id,
        product_id: w.product_id,
        quantity_used: w.remaining_quantity,
        quantity_withdrawn: w.remaining_quantity,
        productName: w.products?.name || "",
        productCode: w.products?.code || "",
        purchasePrice: w.products?.purchase_price || null,
      }));
      setParts(partsFromWithdrawals);
    } else {
      setParts([]);
    }
  }, [withdrawals]);

  const updatePartQuantity = (index: number, newQuantity: number) => {
    const part = parts[index];
    
    if (newQuantity <= 0) {
      toast.error("Quantidade deve ser maior que zero!");
      return;
    }
    
    if (newQuantity > part.quantity_withdrawn) {
      toast.error(
        `Quantidade não pode exceder ${part.quantity_withdrawn} (total retirado)!`
      );
      return;
    }
    
    const updatedParts = [...parts];
    updatedParts[index].quantity_used = newQuantity;
    setParts(updatedParts);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo.preview) URL.revokeObjectURL(photo.preview);
      });
      additionalPhotos.forEach((photo) => {
        if (photo.preview) URL.revokeObjectURL(photo.preview);
      });
    };
  }, []);

  const handlePhotoChange = (index: number, file: File) => {
    // Revoke old URL before creating new one
    if (photos[index].preview) {
      URL.revokeObjectURL(photos[index].preview);
    }
    const newPhotos = [...photos];
    newPhotos[index] = {
      ...newPhotos[index],
      file,
      preview: URL.createObjectURL(file),
    };
    setPhotos(newPhotos);
  };

  const handlePhotoCommentChange = (index: number, comment: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], comment };
    setPhotos(newPhotos);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    if (newPhotos[index].preview) {
      URL.revokeObjectURL(newPhotos[index].preview);
    }
    newPhotos[index] = { file: null, preview: "", comment: "" };
    setPhotos(newPhotos);
  };

  const addAdditionalPhoto = () => {
    setAdditionalPhotos([...additionalPhotos, { file: null, preview: "", comment: "" }]);
  };

  const handleAdditionalPhotoChange = (index: number, file: File) => {
    // Revoke old URL before creating new one
    if (additionalPhotos[index]?.preview) {
      URL.revokeObjectURL(additionalPhotos[index].preview);
    }
    const newPhotos = [...additionalPhotos];
    newPhotos[index] = {
      ...newPhotos[index],
      file,
      preview: URL.createObjectURL(file),
    };
    setAdditionalPhotos(newPhotos);
  };

  const handleAdditionalPhotoCommentChange = (index: number, comment: string) => {
    const newPhotos = [...additionalPhotos];
    newPhotos[index] = { ...newPhotos[index], comment };
    setAdditionalPhotos(newPhotos);
  };

  const removeAdditionalPhoto = (index: number) => {
    const newPhotos = [...additionalPhotos];
    if (newPhotos[index].preview) {
      URL.revokeObjectURL(newPhotos[index].preview);
    }
    setAdditionalPhotos(additionalPhotos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (reportId: string) => {
    const allPhotos = [...photos, ...additionalPhotos.filter(p => p.file)];
    
    const uploadPromises = allPhotos
      .filter((photo) => photo.file)
      .map(async (photo, index) => {
        const fileExt = photo.file!.name.split('.').pop();
        const fileName = `${reportId}/${index + 1}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(fileName, photo.file!);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from('report_photos')
          .insert({
            report_id: reportId,
            photo_url: fileName,
            photo_comment: photo.comment,
            photo_order: index + 1,
          });

        if (dbError) throw dbError;
      });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se o PAT é válido
    const formattedPAT = formatPAT(formData.equipment_code);
    if (!formattedPAT) {
      toast.error("PAT inválido! O PAT deve conter apenas números (máximo 6 dígitos).");
      return;
    }

    // Validar se o equipamento existe
    if (!equipment) {
      toast.error("Equipamento não encontrado! Verifique o PAT digitado.");
      return;
    }

    if (!formData.equipment_code.trim()) {
      toast.error("Código do equipamento (PAT) é obrigatório!");
      return;
    }

    const uploadedPhotosCount = photos.filter((p) => p.file).length;
    if (uploadedPhotosCount !== 6) {
      toast.error("É obrigatório anexar 6 fotos!");
      return;
    }

    const hasEmptyComments = photos.some((p) => p.file && !p.comment.trim());
    if (hasEmptyComments) {
      toast.error("Todas as 6 fotos obrigatórias devem ter comentários!");
      return;
    }

    const additionalPhotosWithFiles = additionalPhotos.filter(p => p.file);
    const hasEmptyAdditionalComments = additionalPhotosWithFiles.some((p) => !p.comment.trim());
    if (hasEmptyAdditionalComments) {
      toast.error("Todas as fotos adicionais devem ter comentários!");
      return;
    }

    const invalidParts = parts.filter(
      part => part.quantity_used > part.quantity_withdrawn || part.quantity_used <= 0
    );
    
    if (invalidParts.length > 0) {
      toast.error(
        "Verifique as quantidades das peças! Algumas estão inválidas."
      );
      return;
    }

    setLoading(true);

    try {
      // Usar função transacional com rollback automático em caso de erro
      const partsJson = parts.map(part => ({
        product_id: part.product_id,
        quantity_used: part.quantity_used,
        withdrawal_id: part.withdrawal_id,
      }));

      const { data: reportId, error: reportError } = await supabase.rpc(
        'create_report_with_parts',
        {
          p_equipment_code: formatPAT(formData.equipment_code) || formData.equipment_code,
          p_equipment_name: formData.equipment_name,
          p_work_site: formData.work_site,
          p_company: formData.company,
          p_technician_name: formData.technician_name,
          p_report_date: parseInputDateToBelem(formData.report_date),
          p_service_comments: formData.service_comments,
          p_considerations: formData.considerations || null,
          p_observations: formData.observations || null,
          p_receiver: formData.receiver || null,
          p_responsible: formData.responsible || null,
          p_created_by: user?.id,
          p_parts: partsJson,
        }
      );

      if (reportError) {
        console.error("Erro ao criar relatório:", reportError);
        throw new Error(reportError.message || "Erro ao criar relatório");
      }

      if (!reportId) {
        throw new Error("ID do relatório não foi retornado");
      }

      // Upload de fotos após transação bem-sucedida
      await uploadPhotos(reportId);

      toast.success(
        parts.length > 0
          ? `Relatório criado com sucesso! ${parts.length} peças vinculadas.`
          : "Relatório criado com sucesso!"
      );
      navigate("/reports");
    } catch (error: any) {
      console.error("Erro completo:", error);
      
      // Tratamento de erros específicos dos constraints SQL
      let errorMessage = "Erro ao criar relatório";
      
      if (error.message) {
        if (error.message.includes("excede quantidade retirada")) {
          errorMessage = "Quantidade usada excede a quantidade retirada! Verifique as peças.";
        } else if (error.message.includes("Retirada de material não encontrada")) {
          errorMessage = "Erro: Retirada de material não encontrada no sistema.";
        } else if (error.message.includes("check_hourmeter_progression")) {
          errorMessage = "Horímetro atual deve ser maior ou igual ao anterior.";
        } else if (error.message.includes("check_rental_dates")) {
          errorMessage = "Data final de locação deve ser posterior à data inicial.";
        } else if (error.message.includes("check_maintenance_dates")) {
          errorMessage = "Data de saída da manutenção deve ser posterior à entrada.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <BackButton />
        <div className="flex items-center gap-4">
          <img src="/malta-logo.webp" alt="Malta Locações" className="h-12" />
          <div>
            <h1 className="text-3xl font-bold">Relatório Fotográfico de Avarias</h1>
            <p className="text-muted-foreground">Registre a saída de produtos e serviços executados</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {formData.equipment_code && formData.report_date && (
          <DuplicateReportWarning
            equipmentCode={formatPAT(formData.equipment_code) || formData.equipment_code}
            reportDate={formData.report_date}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReportEquipmentSelector
              equipmentCode={formData.equipment_code}
              equipmentName={formData.equipment_name}
              onEquipmentCodeChange={(value) => 
                setFormData({ 
                  ...formData, 
                  equipment_code: value,
                  equipment_name: value ? formData.equipment_name : "",
                  company: value ? formData.company : "",
                  work_site: value ? formData.work_site : "",
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
          </CardContent>
        </Card>

        <ReportPartsManager
          parts={parts}
          onUpdateQuantity={updatePartQuantity}
          loadingWithdrawals={loadingWithdrawals}
        />

        <ReportPhotoUploader
          photos={photos}
          additionalPhotos={additionalPhotos}
          onPhotoChange={handlePhotoChange}
          onPhotoCommentChange={handlePhotoCommentChange}
          onRemovePhoto={removePhoto}
          onAdditionalPhotoChange={handleAdditionalPhotoChange}
          onAdditionalPhotoCommentChange={handleAdditionalPhotoCommentChange}
          onRemoveAdditionalPhoto={removeAdditionalPhoto}
          onAddAdditionalPhoto={addAdditionalPhoto}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/reports")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Relatório"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewReport;
