import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, X, CheckCircle2, AlertCircle, Plus, Minus } from "lucide-react";
import "@/styles/report-print.css";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { useWithdrawalsByPAT } from "@/hooks/useWithdrawalsByPAT";
import { formatPAT } from "@/lib/patUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BackButton } from "@/components/BackButton";
import { getTodayLocalDate } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";

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
  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(formData.equipment_code);
  
  // Buscar retiradas de material vinculadas ao PAT
  const { data: withdrawals = [], isLoading: loadingWithdrawals } = useWithdrawalsByPAT(
    formatPAT(formData.equipment_code) || ""
  );

  // Preencher informações automaticamente quando o equipamento for encontrado
  useEffect(() => {
    console.log("🔍 Equipment data in NewReport:", equipment);
    
    if (equipment) {
      setFormData(prev => ({
        ...prev,
        equipment_name: equipment.equipment_name,
      }));
      
      // Preencher empresa: prioriza rental_company, senão maintenance_company
      if (equipment.rental_company) {
        console.log("✅ Preenchendo empresa de locação:", equipment.rental_company);
        setFormData(prev => ({
          ...prev,
          company: equipment.rental_company || "",
        }));
      } else if (equipment.maintenance_company) {
        console.log("✅ Preenchendo empresa de manutenção:", equipment.maintenance_company);
        setFormData(prev => ({
          ...prev,
          company: equipment.maintenance_company || "",
        }));
      }
      
      // Preencher obra: prioriza rental_work_site, senão maintenance_work_site
      if (equipment.rental_work_site) {
        console.log("✅ Preenchendo obra de locação:", equipment.rental_work_site);
        setFormData(prev => ({
          ...prev,
          work_site: equipment.rental_work_site || "",
        }));
      } else if (equipment.maintenance_work_site) {
        console.log("✅ Preenchendo obra de manutenção:", equipment.maintenance_work_site);
        setFormData(prev => ({
          ...prev,
          work_site: equipment.maintenance_work_site || "",
        }));
      }
    } else if (!formData.equipment_code) {
      // Limpa os campos se o PAT for apagado
      console.log("🧹 Limpando campos em NewReport");
      setFormData(prev => ({
        ...prev,
        equipment_name: "",
        work_site: "",
        company: "",
      }));
    }
  }, [equipment, formData.equipment_code]);

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
          p_report_date: formData.report_date,
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
      toast.error(error.message || "Erro ao criar relatório");
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
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_code">Patrimônio (PAT) * (6 dígitos)</Label>
                <div className="relative">
                  <Input
                    id="equipment_code"
                    type="text"
                    value={formData.equipment_code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove não-números
                      if (value.length <= 6) {
                        setFormData({ 
                          ...formData, 
                          equipment_code: value,
                          equipment_name: value ? formData.equipment_name : "",
                          company: value ? formData.company : "",
                          work_site: value ? formData.work_site : "",
                        });
                      }
                    }}
                    onBlur={(e) => {
                      const formatted = formatPAT(e.target.value);
                      if (formatted) {
                        setFormData({ ...formData, equipment_code: formatted });
                      }
                    }}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="font-mono"
                  />
                  {loadingEquipment && formData.equipment_code && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
                {formData.equipment_code && !loadingEquipment && (
                  equipment ? (
                    <Alert className="mt-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                        Equipamento encontrado: {equipment.equipment_name}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="mt-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                        Equipamento não encontrado. Verifique o PAT.
                      </AlertDescription>
                    </Alert>
                  )
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_name">Equipamento *</Label>
                <Input
                  id="equipment_name"
                  value={formData.equipment_name}
                  onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                  placeholder="Nome do equipamento"
                  required
                  readOnly={!!equipment}
                  className={equipment ? "bg-muted cursor-not-allowed" : ""}
                />
                {equipment && (
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente do cadastro do equipamento
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Cliente *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nome do cliente"
                  required
                  readOnly={!!equipment}
                  className={equipment ? "bg-muted cursor-not-allowed" : ""}
                />
                {equipment && (
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente do cadastro do equipamento
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_site">Obra *</Label>
                <Input
                  id="work_site"
                  value={formData.work_site}
                  onChange={(e) => setFormData({ ...formData, work_site: e.target.value })}
                  placeholder="Local da obra"
                  required
                  readOnly={!!equipment}
                  className={equipment ? "bg-muted cursor-not-allowed" : ""}
                />
                {equipment && (
                  <p className="text-xs text-muted-foreground">
                    Preenchido automaticamente do cadastro do equipamento
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="technician">Assunto/Técnico Responsável *</Label>
                <Input
                  id="technician"
                  value={formData.technician_name}
                  onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                  placeholder="Nome do técnico"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {withdrawals && withdrawals.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Peças Utilizadas (Retiradas Registradas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Peças automaticamente vinculadas através da Retirada de Material deste equipamento.
                </AlertDescription>
              </Alert>

              {withdrawals.map((withdrawal, index) => (
                <div key={withdrawal.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Produto</Label>
                      <p className="font-medium">{withdrawal.products?.name}</p>
                      <p className="text-sm text-muted-foreground">Código: {withdrawal.products?.code}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Quantidade Utilizada</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updatePartQuantity(
                            index, 
                            parts[index].quantity_used - 1
                          )}
                          disabled={parts[index].quantity_used <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          min={1}
                          max={withdrawal.quantity}
                          value={parts[index].quantity_used}
                          onChange={(e) => updatePartQuantity(index, parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updatePartQuantity(
                            index, 
                            parts[index].quantity_used + 1
                          )}
                          disabled={parts[index].quantity_used >= withdrawal.quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-sm text-muted-foreground">
                          / {withdrawal.quantity} retiradas
                        </span>
                      </div>
                      
                      {parts[index].quantity_used === withdrawal.quantity ? (
                        <Badge className="mt-2 bg-green-600 hover:bg-green-600">
                          Uso Total
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mt-2 border-yellow-600 text-yellow-600">
                          Uso Parcial ({parts[index].quantity_used}/{withdrawal.quantity})
                        </Badge>
                      )}
                      
                      {parts[index].quantity_used < withdrawal.quantity && (
                        <Alert className="mt-2 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-300">
                            {withdrawal.quantity - parts[index].quantity_used} peças não serão vinculadas a este relatório.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Retirado em</Label>
                      <p className="font-medium">{new Date(withdrawal.withdrawal_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  {withdrawal.withdrawal_reason && (
                    <div className="mt-2">
                      <Label className="text-sm text-muted-foreground">Motivo da Retirada</Label>
                      <p className="text-sm">{withdrawal.withdrawal_reason}</p>
                    </div>
                  )}
                  {withdrawal.products?.purchase_price && (
                    <div className="mt-3 bg-background p-3 rounded-md text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Preço unitário:</span>
                        <span className="font-medium">R$ {withdrawal.products.purchase_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-muted-foreground">Custo usado neste relatório:</span>
                        <span className="font-semibold">
                          R$ {(withdrawal.products.purchase_price * parts[index].quantity_used).toFixed(2)}
                        </span>
                      </div>
                      {parts[index].quantity_used < withdrawal.quantity && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Custo não vinculado:</span>
                          <span>
                            R$ {(withdrawal.products.purchase_price * (withdrawal.quantity - parts[index].quantity_used)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          formData.equipment_code && !loadingWithdrawals && equipment && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma peça encontrada em "Retirada de Material" para este equipamento.
                Para registrar peças no relatório, primeiro faça a retirada em <strong>Gestão de Estoque → Retirada de Material</strong>.
              </AlertDescription>
            </Alert>
          )
        )}

        <Card>
          <CardHeader>
            <CardTitle>Laudo Técnico / Relatório Fotográfico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comments">Descrição do Serviço *</Label>
              <Textarea
                id="comments"
                rows={4}
                value={formData.service_comments}
                onChange={(e) => setFormData({ ...formData, service_comments: e.target.value })}
                placeholder="Descreva o serviço realizado"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fotos do Serviço (6 obrigatórias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 report-photos-grid">
              {photos.map((photo, index) => (
                <div key={index} className="space-y-2 border rounded-lg p-4 report-photo-item">
                  <Label>Foto {index + 1} *</Label>
                  {photo.preview ? (
                    <div className="relative">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full aspect-[12.34/6.83] object-cover rounded report-photo-img"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 print:hidden"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[12.34/6.83] border-2 border-dashed rounded cursor-pointer hover:bg-muted/50 print:hidden">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoChange(index, file);
                        }}
                      />
                    </label>
                  )}
                  <Textarea
                    placeholder="Comentário da foto *"
                    rows={2}
                    value={photo.comment}
                    onChange={(e) => handlePhotoCommentChange(index, e.target.value)}
                    required={!!photo.file}
                    className="report-photo-comment"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {additionalPhotos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fotos Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 report-photos-grid">
                {additionalPhotos.map((photo, index) => (
                  <div key={index} className="space-y-2 border rounded-lg p-4 report-photo-item">
                    <Label>Foto Adicional {index + 1}</Label>
                    {photo.preview ? (
                      <div className="relative">
                        <img
                          src={photo.preview}
                          alt={`Preview adicional ${index + 1}`}
                          className="w-full aspect-[12.34/6.83] object-cover rounded report-photo-img"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 print:hidden"
                          onClick={() => removeAdditionalPhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[12.34/6.83] border-2 border-dashed rounded cursor-pointer hover:bg-muted/50 print:hidden">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Clique para selecionar</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleAdditionalPhotoChange(index, file);
                          }}
                        />
                      </label>
                    )}
                    <Textarea
                      placeholder="Comentário da foto"
                      rows={2}
                      value={photo.comment}
                      onChange={(e) => handleAdditionalPhotoCommentChange(index, e.target.value)}
                      className="report-photo-comment"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center print:hidden">
          <Button type="button" variant="outline" onClick={addAdditionalPhoto}>
            Adicionar Mais Fotos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Considerações e Observações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="considerations">Considerações</Label>
              <Textarea
                id="considerations"
                rows={3}
                value={formData.considerations}
                onChange={(e) => setFormData({ ...formData, considerations: e.target.value })}
                placeholder="Considerações sobre o serviço"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observação</Label>
              <Textarea
                id="observations"
                rows={3}
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Observações gerais"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiver">Recebedor</Label>
                <Input
                  id="receiver"
                  value={formData.receiver}
                  onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                  placeholder="Nome do recebedor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Responsável</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
