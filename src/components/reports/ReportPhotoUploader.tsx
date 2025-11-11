import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Plus } from "lucide-react";

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
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fotos (6 obrigatórias) *</CardTitle>
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
                    <div className="relative">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => onRemovePhoto(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
                      <div className="relative">
                        <img
                          src={photo.preview}
                          alt={`Additional Preview ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => onRemoveAdditionalPhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
    </>
  );
};
