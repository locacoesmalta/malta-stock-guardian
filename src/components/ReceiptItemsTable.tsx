import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Trash2, Plus, AlertTriangle, Upload, X, Image as ImageIcon } from "lucide-react";
import { ReceiptItem } from "@/hooks/useReceipts";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { Alert, AlertDescription } from "./ui/alert";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "./ui/label";

interface ReceiptItemsTableProps {
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
  disabled?: boolean;
  onEquipmentFound?: (client: string, workSite: string) => void;
  onValidationChange?: (hasInvalidPAT: boolean) => void;
}

export const ReceiptItemsTable = ({ items, onChange, disabled, onEquipmentFound, onValidationChange }: ReceiptItemsTableProps) => {
  
  // Verificar se há PATs inválidos
  useEffect(() => {
    const hasInvalid = items.some(item => {
      const hasPAT = item.pat_code && item.pat_code.length >= 3;
      return hasPAT && !item.specification; // Se tem PAT mas não tem especificação, é inválido
    });
    onValidationChange?.(hasInvalid);
  }, [items, onValidationChange]);
  const addItem = () => {
    onChange([
      ...items,
      {
        quantity: 1,
        specification: '',
        item_order: items.length + 1,
        pat_code: '',
        photos: [],
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems.map((item, i) => ({ ...item, item_order: i + 1 })));
  };

  const updateItem = (index: number, field: 'quantity' | 'specification' | 'pat_code' | 'equipment_comments' | 'photos', value: string | number | string[]) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <ReceiptItemRow
          key={index}
          item={item}
          index={index}
          updateItem={updateItem}
          removeItem={removeItem}
          disabled={disabled}
          itemsLength={items.length}
          onEquipmentFound={onEquipmentFound}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Equipamento
      </Button>
    </div>
  );
};

interface ReceiptItemRowProps {
  item: ReceiptItem;
  index: number;
  updateItem: (index: number, field: 'quantity' | 'specification' | 'pat_code' | 'equipment_comments' | 'photos', value: string | number | string[]) => void;
  removeItem: (index: number) => void;
  disabled?: boolean;
  itemsLength: number;
  onEquipmentFound?: (client: string, workSite: string) => void;
}

const ReceiptItemRow = ({ 
  item, 
  index, 
  updateItem, 
  removeItem, 
  disabled, 
  itemsLength,
  onEquipmentFound 
}: ReceiptItemRowProps) => {
  const { data: equipment, isLoading } = useEquipmentByPAT(item.pat_code || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (equipment && onEquipmentFound && index === 0) {
      // Determinar cliente e obra baseado no location_type
      let client = '';
      let workSite = '';

      if (equipment.location_type === 'locacao' && equipment.rental_company && equipment.rental_work_site) {
        client = equipment.rental_company;
        workSite = equipment.rental_work_site;
      } else if (equipment.location_type === 'em_manutencao' && equipment.maintenance_company && equipment.maintenance_work_site) {
        client = equipment.maintenance_company;
        workSite = equipment.maintenance_work_site;
      }

      if (client && workSite) {
        onEquipmentFound(client, workSite);
      }

      // Preencher especificação automaticamente apenas se estiver vazio
      const newSpecification = `${equipment.equipment_name} - ${equipment.manufacturer}${equipment.model ? ` - ${equipment.model}` : ''}`;
      if (!item.specification || item.specification.trim() === '') {
        updateItem(index, 'specification', newSpecification);
      }
    }
  }, [equipment?.id]);

  // Limpar especificação quando PAT é apagado
  useEffect(() => {
    if (!item.pat_code || item.pat_code.trim() === '') {
      if (item.specification) {
        updateItem(index, 'specification', '');
      }
    }
  }, [item.pat_code]);

  const showNotFoundAlert = item.pat_code && item.pat_code.length >= 3 && !isLoading && !equipment;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentPhotos = item.photos || [];
    if (currentPhotos.length >= 4) {
      toast.error('Máximo de 4 fotos por equipamento');
      return;
    }

    setUploadingPhoto(true);
    const newPhotos: string[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, 4 - currentPhotos.length); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `receipt-photos/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('receipt-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipt-photos')
          .getPublicUrl(filePath);

        newPhotos.push(publicUrl);
      }

      updateItem(index, 'photos', [...currentPhotos, ...newPhotos]);
      toast.success('Fotos enviadas com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload das fotos');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (photoIndex: number) => {
    const currentPhotos = item.photos || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== photoIndex);
    updateItem(index, 'photos', newPhotos);
  };

  const currentPhotos = item.photos || [];
  const missingPhotos = 4 - currentPhotos.length;

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Equipamento {index + 1}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeItem(index)}
          disabled={disabled || itemsLength === 1}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3">
          <Label htmlFor={`pat-${index}`}>PAT *</Label>
          <Input
            id={`pat-${index}`}
            value={item.pat_code || ''}
            onChange={(e) => updateItem(index, 'pat_code', e.target.value.toUpperCase())}
            placeholder="000000"
            disabled={disabled}
            className={`${showNotFoundAlert ? 'border-destructive' : ''}`}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`quantity-${index}`}>Quantidade *</Label>
          <Input
            id={`quantity-${index}`}
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
            disabled={disabled}
          />
        </div>
        <div className="md:col-span-7">
          <Label htmlFor={`specification-${index}`}>Especificação *</Label>
          <Input
            id={`specification-${index}`}
            value={item.specification}
            onChange={(e) => updateItem(index, 'specification', e.target.value)}
            placeholder="Descrição do equipamento"
            disabled={disabled || isLoading}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor={`comments-${index}`}>Comentários</Label>
        <Textarea
          id={`comments-${index}`}
          value={item.equipment_comments || ''}
          onChange={(e) => updateItem(index, 'equipment_comments', e.target.value)}
          placeholder="Comentários sobre o equipamento (opcional)"
          disabled={disabled}
          rows={2}
        />
      </div>
      
      {showNotFoundAlert && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            PAT não encontrado no sistema. Por favor, procure o administrador do sistema para cadastrar este equipamento antes de continuar.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>
          Fotos do Equipamento * 
          <span className="text-sm text-muted-foreground ml-2">
            ({currentPhotos.length}/4 fotos)
          </span>
        </Label>
        
        {currentPhotos.length < 4 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById(`photo-upload-${index}`)?.click()}
              disabled={disabled || uploadingPhoto}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadingPhoto ? 'Enviando...' : `Adicionar Foto${missingPhotos > 1 ? 's' : ''} (${missingPhotos} restante${missingPhotos > 1 ? 's' : ''})`}
            </Button>
            <input
              id={`photo-upload-${index}`}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={disabled || uploadingPhoto}
            />
          </div>
        )}

        {currentPhotos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {currentPhotos.map((photo, photoIndex) => (
              <div key={photoIndex} className="relative group">
                <img
                  src={photo}
                  alt={`Foto ${photoIndex + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photoIndex)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {currentPhotos.length < 4 && (
          <p className="text-xs text-muted-foreground">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Obrigatório anexar 4 fotos do equipamento
          </p>
        )}
      </div>
    </div>
  );
};
