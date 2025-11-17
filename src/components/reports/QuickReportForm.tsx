import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatPAT } from "@/lib/patUtils";
import { getTodayLocalDate } from "@/lib/dateUtils";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { useWithdrawalsByPAT } from "@/hooks/useWithdrawalsByPAT";
import { useSmartAutofill } from "@/hooks/useSmartAutofill";
import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuickReportFormProps {
  initialPat?: string;
  onComplete?: () => void;
}

interface PhotoData {
  file: File | null;
  preview: string;
  comment: string;
}

export const QuickReportForm = ({ initialPat, onComplete }: QuickReportFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    equipment_code: initialPat || "",
    equipment_name: "",
    company: "",
    work_site: "",
    technician_name: "",
    report_date: getTodayLocalDate(),
    service_comments: "",
  });

  const [photos, setPhotos] = useState<PhotoData[]>([
    { file: null, preview: "", comment: "" },
    { file: null, preview: "", comment: "" },
  ]);

  const [selectedParts, setSelectedParts] = useState<string[]>([]);

  // Buscar dados do equipamento
  const { data: equipment } = useEquipmentByPAT(formData.equipment_code);
  
  // Buscar retiradas pendentes
  const { data: withdrawals = [] } = useWithdrawalsByPAT(
    formatPAT(formData.equipment_code) || ""
  );

  // Auto-preenchimento inteligente
  const { data: autofillData } = useSmartAutofill(formatPAT(formData.equipment_code) || null);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto-preencher com dados do equipamento
  useEffect(() => {
    if (equipment) {
      setFormData((prev) => ({
        ...prev,
        equipment_name: equipment.equipment_name,
        company: equipment.rental_company || equipment.maintenance_company || prev.company,
        work_site: equipment.rental_work_site || equipment.maintenance_work_site || prev.work_site,
      }));
    }
  }, [equipment]);

  // Mostrar sugestões quando houver dados de autofill
  useEffect(() => {
    if (autofillData && currentStep === 2) {
      setShowSuggestions(true);
    }
  }, [autofillData, currentStep]);

  // Pré-selecionar todas as peças pendentes
  useEffect(() => {
    if (withdrawals && withdrawals.length > 0 && selectedParts.length === 0) {
      setSelectedParts(withdrawals.map((w) => w.id));
    }
  }, [withdrawals]);

  const applySuggestion = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    toast.success("Sugestão aplicada!");
  };

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep === 1 && !formData.equipment_code) {
      toast.error("Digite o código PAT do equipamento");
      return;
    }
    if (currentStep === 2) {
      if (!formData.company || !formData.work_site || !formData.technician_name) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
    }
    if (currentStep === 3 && selectedParts.length === 0) {
      toast.error("Selecione pelo menos uma peça");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePhotoChange = (index: number, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => {
          const newPhotos = [...prev];
          newPhotos[index] = {
            ...newPhotos[index],
            file,
            preview: reader.result as string,
          };
          return newPhotos;
        });
      };
      reader.readAsDataURL(file);
    } else {
      setPhotos((prev) => {
        const newPhotos = [...prev];
        newPhotos[index] = { file: null, preview: "", comment: "" };
        return newPhotos;
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    if (!formData.service_comments) {
      toast.error("Descreva os serviços executados");
      return;
    }

    const uploadedPhotos = photos.filter((p) => p.file !== null);
    if (uploadedPhotos.length === 0) {
      toast.error("Adicione pelo menos 1 foto");
      return;
    }

    setLoading(true);

    try {
      // 1. Criar relatório
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .insert({
          equipment_code: formatPAT(formData.equipment_code) || "",
          equipment_name: formData.equipment_name,
          company: formData.company,
          work_site: formData.work_site,
          technician_name: formData.technician_name,
          report_date: formData.report_date,
          service_comments: formData.service_comments,
          created_by: user.id,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // 2. Associar peças selecionadas
      const selectedWithdrawals = withdrawals.filter((w) =>
        selectedParts.includes(w.id)
      );

      const partsToInsert = selectedWithdrawals.map((w) => ({
        report_id: reportData.id,
        product_id: w.product_id,
        quantity_used: w.remaining_quantity,
        withdrawal_id: w.id,
      }));

      const { error: partsError } = await supabase
        .from("report_parts")
        .insert(partsToInsert);

      if (partsError) throw partsError;

      // 3. Marcar retiradas como usadas
      const { error: updateError } = await supabase
        .from("material_withdrawals")
        .update({ used_in_report_id: reportData.id })
        .in("id", selectedParts);

      if (updateError) throw updateError;

      // 4. Upload de fotos
      for (let i = 0; i < uploadedPhotos.length; i++) {
        const photo = uploadedPhotos[i];
        if (!photo.file) continue;

        const fileExt = photo.file.name.split(".").pop();
        const fileName = `${reportData.id}_${i + 1}.${fileExt}`;
        const filePath = `reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("report-photos")
          .upload(filePath, photo.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("report-photos")
          .getPublicUrl(filePath);

        await supabase.from("report_photos").insert({
          report_id: reportData.id,
          photo_url: urlData.publicUrl,
          photo_comment: photo.comment || `Foto ${i + 1}`,
          photo_order: i + 1,
        });
      }

      toast.success("Relatório criado com sucesso!");
      
      if (onComplete) {
        onComplete();
      } else {
        navigate("/reports/list");
      }
    } catch (error: any) {
      console.error("Erro ao criar relatório:", error);
      toast.error(error.message || "Erro ao criar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Etapa {currentStep} de {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Etapa 1: Equipamento */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Identificar Equipamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_code">Código PAT *</Label>
              <Input
                id="equipment_code"
                value={formData.equipment_code}
                onChange={(e) =>
                  setFormData({ ...formData, equipment_code: e.target.value })
                }
                placeholder="Digite o PAT"
                autoFocus
              />
            </div>

            {equipment && (
              <Alert>
                <AlertDescription>
                  <strong>{equipment.equipment_name}</strong>
                  <br />
                  {equipment.manufacturer} {equipment.model}
                </AlertDescription>
              </Alert>
            )}

            {autofillData && autofillData.pending_parts_count > 0 && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>{autofillData.pending_parts_count} peças pendentes</strong> para
                  este equipamento
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Etapa 2: Dados Básicos */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {showSuggestions && autofillData && (
              <Alert className="bg-primary/5 border-primary/20">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-primary">
                      Sugestões baseadas no histórico
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {autofillData.last_company && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() =>
                            applySuggestion("company", autofillData.last_company!)
                          }
                        >
                          Cliente: {autofillData.last_company}
                        </Badge>
                      </div>
                    )}
                    {autofillData.last_work_site && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() =>
                            applySuggestion("work_site", autofillData.last_work_site!)
                          }
                        >
                          Obra: {autofillData.last_work_site}
                        </Badge>
                      </div>
                    )}
                    {autofillData.last_technician && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10"
                          onClick={() =>
                            applySuggestion(
                              "technician_name",
                              autofillData.last_technician!
                            )
                          }
                        >
                          Técnico: {autofillData.last_technician}
                        </Badge>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Cliente *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Nome do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_site">Obra *</Label>
                <Input
                  id="work_site"
                  value={formData.work_site}
                  onChange={(e) =>
                    setFormData({ ...formData, work_site: e.target.value })
                  }
                  placeholder="Nome da obra"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician_name">Técnico Responsável *</Label>
              <Input
                id="technician_name"
                value={formData.technician_name}
                onChange={(e) =>
                  setFormData({ ...formData, technician_name: e.target.value })
                }
                placeholder="Nome do técnico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report_date">Data do Relatório *</Label>
              <Input
                id="report_date"
                type="date"
                value={formData.report_date}
                onChange={(e) =>
                  setFormData({ ...formData, report_date: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 3: Peças Usadas */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Peças Usadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {withdrawals.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhuma peça pendente encontrada para este equipamento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {withdrawals.map((w) => {
                  const isNonCataloged = w.withdrawal_reason?.startsWith("[PRODUTO NÃO CATALOGADO]");
                  const customDescription = isNonCataloged 
                    ? w.withdrawal_reason?.replace("[PRODUTO NÃO CATALOGADO] ", "") 
                    : null;

                  return (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent"
                      onClick={() => {
                        setSelectedParts((prev) =>
                          prev.includes(w.id)
                            ? prev.filter((id) => id !== w.id)
                            : [...prev, w.id]
                        );
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedParts.includes(w.id)}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium">{w.products.name}</div>
                          {isNonCataloged && (
                            <Badge variant="outline" className="text-xs">
                              Não Catalogado
                            </Badge>
                          )}
                        </div>
                        {isNonCataloged ? (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Descrição:</span> {customDescription} • Qtd: {w.remaining_quantity}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {w.products.code} • Qtd: {w.remaining_quantity}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Etapa 4: Fotos e Finalização */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Fotos e Descrição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service_comments">Serviços Executados *</Label>
              <Textarea
                id="service_comments"
                value={formData.service_comments}
                onChange={(e) =>
                  setFormData({ ...formData, service_comments: e.target.value })
                }
                placeholder="Descreva brevemente os serviços realizados"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos (mínimo 1, máximo 2)</Label>
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="space-y-2">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      {photo.preview ? (
                        <div className="relative">
                          <img
                            src={photo.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => handlePhotoChange(index, null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handlePhotoChange(index, e.target.files?.[0] || null)
                            }
                          />
                          <div className="text-muted-foreground">
                            Foto {index + 1}
                          </div>
                        </label>
                      )}
                    </div>
                    {photo.preview && (
                      <Input
                        placeholder="Comentário da foto"
                        value={photo.comment}
                        onChange={(e) =>
                          setPhotos((prev) => {
                            const newPhotos = [...prev];
                            newPhotos[index].comment = e.target.value;
                            return newPhotos;
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de Navegação */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1 || loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        {currentStep < totalSteps ? (
          <Button onClick={handleNext} disabled={loading}>
            Próximo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Finalizar"}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
