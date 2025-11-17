import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  rotateImage,
  flipImage,
  standardizeImage,
  formatFileSize,
  calculateSizeReduction,
  type ProcessedImageResult,
} from "@/lib/imageProcessing";

interface PhotoEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoFile: File | null;
  photoPreview: string;
  photoIndex: number;
  onSaveEdit: (index: number, result: ProcessedImageResult) => void;
}

export const PhotoEditor = ({
  open,
  onOpenChange,
  photoFile,
  photoPreview,
  photoIndex,
  onSaveEdit,
}: PhotoEditorProps) => {
  const [processing, setProcessing] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(photoPreview);
  const [currentFile, setCurrentFile] = useState(photoFile);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset quando abrir o modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentPreview(photoPreview);
      setCurrentFile(photoFile);
      setHasChanges(false);
    }
    onOpenChange(open);
  };

  const handleRotate = async (degrees: 90 | 180 | 270) => {
    if (!currentFile) return;

    setProcessing(true);
    try {
      const result = await rotateImage(currentFile, degrees);
      
      // Criar novo File a partir do blob
      const newFile = new File([result.blob], currentFile.name, {
        type: result.blob.type,
      });

      setCurrentFile(newFile);
      setCurrentPreview(result.dataUrl);
      setHasChanges(true);

      toast.success(`Foto rotacionada ${degrees}°`);
    } catch (error) {
      console.error('Erro ao rotacionar:', error);
      toast.error('Erro ao rotacionar foto');
    } finally {
      setProcessing(false);
    }
  };

  const handleFlip = async (horizontal: boolean, vertical: boolean) => {
    if (!currentFile) return;

    setProcessing(true);
    try {
      const result = await flipImage(currentFile, horizontal, vertical);
      
      const newFile = new File([result.blob], currentFile.name, {
        type: result.blob.type,
      });

      setCurrentFile(newFile);
      setCurrentPreview(result.dataUrl);
      setHasChanges(true);

      const direction = horizontal ? 'horizontal' : 'vertical';
      toast.success(`Flip ${direction} aplicado`);
    } catch (error) {
      console.error('Erro ao aplicar flip:', error);
      toast.error('Erro ao aplicar flip');
    } finally {
      setProcessing(false);
    }
  };

  const handleStandardize = async () => {
    if (!currentFile) return;

    setProcessing(true);
    try {
      const result = await standardizeImage(currentFile);
      
      const newFile = new File([result.blob], currentFile.name, {
        type: result.blob.type,
      });

      setCurrentFile(newFile);
      setCurrentPreview(result.dataUrl);
      setHasChanges(true);

      const reduction = calculateSizeReduction(
        result.metadata.originalSizeBytes,
        result.metadata.processedSizeBytes
      );

      toast.success(
        `Padrão aplicado! Redução de ${reduction}% (${formatFileSize(result.metadata.processedSizeBytes)})`
      );
    } catch (error) {
      console.error('Erro ao padronizar:', error);
      toast.error('Erro ao padronizar foto');
    } finally {
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!currentFile || !hasChanges) {
      onOpenChange(false);
      return;
    }

    setProcessing(true);
    try {
      // Criar resultado final com metadata
      const result: ProcessedImageResult = {
        blob: currentFile,
        dataUrl: currentPreview,
        metadata: {
          originalWidth: 0,
          originalHeight: 0,
          processedWidth: 0,
          processedHeight: 0,
          originalSizeBytes: photoFile?.size || 0,
          processedSizeBytes: currentFile.size,
          rotationApplied: 0,
          flipHorizontal: false,
          flipVertical: false,
          processingApplied: true,
        },
      };

      onSaveEdit(photoIndex, result);
      toast.success('Edições salvas!');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar edições');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Foto {photoIndex + 1}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da imagem */}
          <div className="relative bg-muted rounded-lg overflow-hidden">
            <img
              src={currentPreview}
              alt={`Foto ${photoIndex + 1}`}
              className="w-full h-auto max-h-[60vh] object-contain"
            />
          </div>

          {/* Informações do arquivo */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Tamanho: {currentFile ? formatFileSize(currentFile.size) : '-'}
            </span>
            {photoFile && currentFile && currentFile.size !== photoFile.size && (
              <span className="text-success">
                ↓ {calculateSizeReduction(photoFile.size, currentFile.size)}% menor
              </span>
            )}
          </div>

          {/* Controles de edição */}
          <div className="space-y-3">
            {/* Rotação */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Rotação</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate(270)}
                  disabled={processing || !currentFile}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  90° ←
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate(90)}
                  disabled={processing || !currentFile}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  90° →
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate(180)}
                  disabled={processing || !currentFile}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  180°
                </Button>
              </div>
            </div>

            {/* Flip */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Espelhar</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFlip(true, false)}
                  disabled={processing || !currentFile}
                >
                  <FlipHorizontal2 className="h-4 w-4 mr-2" />
                  Horizontal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFlip(false, true)}
                  disabled={processing || !currentFile}
                >
                  <FlipVertical2 className="h-4 w-4 mr-2" />
                  Vertical
                </Button>
              </div>
            </div>

            {/* Padronização */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Padrão do Sistema</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleStandardize}
                disabled={processing || !currentFile}
                className="w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Aplicar Padrão (1920x1080, otimizado)
              </Button>
              <p className="text-xs text-muted-foreground">
                Redimensiona e otimiza a foto para o padrão do sistema
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={processing || !hasChanges}
          >
            {processing ? 'Processando...' : 'Salvar Edições'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
