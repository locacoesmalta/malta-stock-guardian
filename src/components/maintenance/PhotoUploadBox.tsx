import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";

export interface PhotoData {
  file: File | null;
  preview: string;
  comment: string;
}

interface PhotoUploadBoxProps {
  index: number;
  photo: PhotoData;
  onUpload: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onCommentChange: (index: number, comment: string) => void;
  onRemove: (index: number) => void;
  label: string;
}

export function PhotoUploadBox({
  index,
  photo,
  onUpload,
  onCommentChange,
  onRemove,
  label,
}: PhotoUploadBoxProps) {
  return (
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
}
