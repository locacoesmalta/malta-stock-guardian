import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Plus, Edit, Loader2 } from "lucide-react";
import { PhotoEditor } from "./PhotoEditor";
import { toast } from "sonner";
import type { ProcessedImageResult } from "@/lib/imageProcessing";
import { urlToFile } from "@/lib/imageProcessing";

interface PhotoData {
  file: File | null;
  preview: string;
  comment: string;
}

interface ReportPhotoUploaderProps {
  photos: PhotoData[];
  additionalPhotos: PhotoData[];
  onPhotoChange: (index: number, file: File) => void;
  onPhotoCommentChange: (index: number, comment: string) => void;
  onRemovePhoto: (index: number) => void;
  onAdditionalPhotoChange: (index: number, file: File) => void;
  onAdditionalPhotoCommentChange: (index: number, comment: string) => void;
  onRemoveAdditionalPhoto: (index: number) => void;
  onAddAdditionalPhoto: () => void;
}

export const ReportPhotoUploader = ({
  photos,
  additionalPhotos,
  onPhotoChange,
  onPhotoCommentChange,
  onRemovePhoto,
  onAdditionalPhotoChange,
  onAdditionalPhotoCommentChange,
  onRemoveAdditionalPhoto,
  onAddAdditionalPhoto,
}: ReportPhotoUploaderProps) => {
  const [editingPhoto, setEditingPhoto] = useState<{
    index: number;
    file: File | null;
    preview: string;
    isAdditional: boolean;
  } | null>(null);
  const [loadingPhotoForEdit, setLoadingPhotoForEdit] = useState<number | null>(null);

  const handleEditPhoto = async (index: number, isAdditional: boolean = false) => {
    const photoList = isAdditional ? additionalPhotos : photos;
    const photo = photoList[index];
    
    // Se foto já tem File, abre editor direto
    if (photo.file) {
      setEditingPhoto({
        index,
        file: photo.file,
        preview: photo.preview,
        isAdditional,
      });
      return;
    }
    
    // Se foto só tem URL (foto antiga), converte para File
    if (photo.preview && !photo.file) {
      setLoadingPhotoForEdit(isAdditional ? index + 1000 : index); // +1000 para diferenciar additional
      try {
        const file = await urlToFile(photo.preview, `photo-${index + 1}.jpg`);
        setEditingPhoto({
          index,
          file,
          preview: photo.preview,
          isAdditional,
        });
      } catch (error) {
        console.error('Erro ao carregar foto:', error);
        toast.error("Erro ao carregar foto para edição");
      } finally {
        setLoadingPhotoForEdit(null);
      }
    }
  };

  const handleSaveEdit = (index: number, result: ProcessedImageResult) => {
    // Criar novo File a partir do blob processado
    const newFile = new File([result.blob], `photo_${index + 1}.jpg`, {
      type: result.blob.type,
    });

    if (editingPhoto?.isAdditional) {
      onAdditionalPhotoChange(index, newFile);
    } else {
      onPhotoChange(index, newFile);
    }

    setEditingPhoto(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fotos (4 obrigatórias) *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="space-y-2 p-4 border rounded-lg">
                <Label>Foto {index + 1} *</Label>
                <div className="space-y-2">
                  {!photo.preview ? (
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Clique para adicionar foto
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onPhotoChange(index, file);
                        }}
                      />
                    </label>
                  ) : (
                    <div className="relative group">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditPhoto(index, false)}
                          disabled={loadingPhotoForEdit === index}
                        >
                          {loadingPhotoForEdit === index ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => onRemovePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <Textarea
                    placeholder="Comentário da foto *"
                    value={photo.comment}
                    onChange={(e) => onPhotoCommentChange(index, e.target.value)}
                    className="min-h-[60px]"
                    required={!!photo.file}
                  />
                </div>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionalPhotos.map((photo, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <Label>Foto Adicional {index + 1}</Label>
                  <div className="space-y-2">
                    {!photo.preview ? (
                      <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Clique para adicionar foto
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onAdditionalPhotoChange(index, file);
                          }}
                        />
                      </label>
                    ) : (
                      <div className="relative group">
                        <img
                          src={photo.preview}
                          alt={`Additional Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditPhoto(index, true)}
                          disabled={loadingPhotoForEdit === index + 1000}
                        >
                          {loadingPhotoForEdit === index + 1000 ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Edit className="h-4 w-4" />
                          )}
                        </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => onRemoveAdditionalPhoto(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <Textarea
                      placeholder="Comentário da foto"
                      value={photo.comment}
                      onChange={(e) => onAdditionalPhotoCommentChange(index, e.target.value)}
                      className="min-h-[60px]"
                      required={!!photo.file}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={onAddAdditionalPhoto}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Foto Adicional
      </Button>

      {/* Photo Editor Modal */}
      {editingPhoto && (
        <PhotoEditor
          open={!!editingPhoto}
          onOpenChange={(open) => !open && setEditingPhoto(null)}
          photoFile={editingPhoto.file}
          photoPreview={editingPhoto.preview}
          photoIndex={editingPhoto.index}
          onSaveEdit={handleSaveEdit}
        />
      )}
    </>
  );
};
