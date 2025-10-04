import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, X } from "lucide-react";
import "@/styles/report-print.css";
import { useProductsQuery } from "@/hooks/useProductsQuery";

interface ReportPart {
  product_id: string;
  quantity_used: number;
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
  const { data: productsResponse } = useProductsQuery();
  const products = productsResponse?.data || [];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    equipment_code: "",
    equipment_name: "",
    work_site: "",
    company: "",
    technician_name: "",
    report_date: new Date().toISOString().split('T')[0],
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

  const addPart = () => {
    setParts([...parts, {
      product_id: "",
      quantity_used: 1,
      productName: "",
      productCode: "",
      purchasePrice: null
    }]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof ReportPart, value: any) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newParts[index].productName = product.name;
        newParts[index].productCode = product.code;
        newParts[index].purchasePrice = product.purchase_price;
      }
    }
    
    setParts(newParts);
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

    if (parts.length === 0) {
      toast.error("Adicione pelo menos uma peça utilizada!");
      return;
    }

    const invalidParts = parts.filter(part => !part.product_id || part.quantity_used <= 0);
    if (invalidParts.length > 0) {
      toast.error("Verifique as peças: todas devem ter produto e quantidade!");
      return;
    }

    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      const { data: reportData, error: reportError } = await supabase
        .from("reports")
        .insert([{
          ...formData,
          created_by: user.id,
        }])
        .select()
        .single();

      if (reportError) throw reportError;

      // Salvar as peças usadas
      const partsData = parts.map(part => ({
        report_id: reportData.id,
        product_id: part.product_id,
        quantity_used: part.quantity_used
      }));

      const { error: partsError } = await supabase
        .from("report_parts")
        .insert(partsData);

      if (partsError) throw partsError;

      await uploadPhotos(reportData.id);

      toast.success("Relatório criado com sucesso!");
      navigate("/reports");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <img src="/malta-logo.webp" alt="Malta Locações" className="h-12" />
        <div>
          <h1 className="text-3xl font-bold">Relatório Fotográfico de Avarias</h1>
          <p className="text-muted-foreground">Registre a saída de produtos e serviços executados</p>
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
                <Label htmlFor="company">Cliente *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Nome do cliente"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_site">Obra *</Label>
                <Input
                  id="work_site"
                  value={formData.work_site}
                  onChange={(e) => setFormData({ ...formData, work_site: e.target.value })}
                  placeholder="Local da obra"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_name">Equipamento *</Label>
                <Input
                  id="equipment_name"
                  value={formData.equipment_name}
                  onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                  placeholder="Nome do equipamento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_code">Patrimônio (PAT) *</Label>
                <Input
                  id="equipment_code"
                  value={formData.equipment_code}
                  onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
                  placeholder="Código do patrimônio"
                  required
                />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Peças Utilizadas na Manutenção</CardTitle>
            <Button type="button" onClick={addPart} size="sm">
              Adicionar Peça
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {parts.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma peça adicionada. Clique em "Adicionar Peça" para começar.
              </p>
            ) : (
              parts.map((part, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Peça {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePart(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Produto *</Label>
                        <Select
                          value={part.product_id}
                          onValueChange={(value) => updatePart(index, "product_id", value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.code} - {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade Utilizada *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={part.quantity_used}
                          onChange={(e) => updatePart(index, "quantity_used", Number(e.target.value))}
                          required
                        />
                      </div>
                    </div>

                    {part.purchasePrice !== null && (
                      <div className="bg-muted/50 p-3 rounded-md text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preço unitário:</span>
                          <span className="font-medium">R$ {part.purchasePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-muted-foreground">Custo total:</span>
                          <span className="font-semibold">R$ {(part.purchasePrice * part.quantity_used).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
