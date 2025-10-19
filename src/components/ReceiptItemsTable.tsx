import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2, Plus, AlertTriangle } from "lucide-react";
import { ReceiptItem } from "@/hooks/useReceipts";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { Alert, AlertDescription } from "./ui/alert";
import { useEffect } from "react";

interface ReceiptItemsTableProps {
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
  disabled?: boolean;
  onEquipmentFound?: (client: string, workSite: string) => void;
}

export const ReceiptItemsTable = ({ items, onChange, disabled, onEquipmentFound }: ReceiptItemsTableProps) => {
  const addItem = () => {
    onChange([
      ...items,
      {
        quantity: 1,
        specification: '',
        item_order: items.length + 1,
        pat_code: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems.map((item, i) => ({ ...item, item_order: i + 1 })));
  };

  const updateItem = (index: number, field: 'quantity' | 'specification' | 'pat_code', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted grid grid-cols-12 gap-2 p-3 font-semibold text-sm">
          <div className="col-span-2">PAT *</div>
          <div className="col-span-2">QUANT.</div>
          <div className="col-span-7">ESPECIFICAÇÃO</div>
          <div className="col-span-1"></div>
        </div>
        
        <div className="divide-y">
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
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Item
      </Button>
    </div>
  );
};

interface ReceiptItemRowProps {
  item: ReceiptItem;
  index: number;
  updateItem: (index: number, field: 'quantity' | 'specification' | 'pat_code', value: string | number) => void;
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

      // Preencher especificação automaticamente
      const specification = `${equipment.equipment_name} - ${equipment.manufacturer}${equipment.model ? ` - ${equipment.model}` : ''}`;
      updateItem(index, 'specification', specification);
    }
  }, [equipment, onEquipmentFound, index, updateItem]);

  const showNotFoundAlert = item.pat_code && item.pat_code.length >= 3 && !isLoading && !equipment;

  return (
    <div className="p-3 space-y-2">
      <div className="grid grid-cols-12 gap-2 items-start">
        <div className="col-span-2">
          <Input
            value={item.pat_code || ''}
            onChange={(e) => updateItem(index, 'pat_code', e.target.value.toUpperCase())}
            placeholder="000000"
            disabled={disabled}
            className={`w-full ${showNotFoundAlert ? 'border-destructive' : ''}`}
          />
        </div>
        <div className="col-span-2">
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
            disabled={disabled}
            className="w-full"
          />
        </div>
        <div className="col-span-7">
          <Input
            value={item.specification}
            onChange={(e) => updateItem(index, 'specification', e.target.value)}
            placeholder="Descrição do equipamento"
            disabled={disabled || isLoading}
            className="w-full"
          />
        </div>
        <div className="col-span-1">
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
      </div>
      
      {showNotFoundAlert && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            PAT não encontrado no sistema. Por favor, procure o administrador do sistema para cadastrar este equipamento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
