import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2, Plus } from "lucide-react";
import { ReceiptItem } from "@/hooks/useReceipts";

interface ReceiptItemsTableProps {
  items: ReceiptItem[];
  onChange: (items: ReceiptItem[]) => void;
  disabled?: boolean;
}

export const ReceiptItemsTable = ({ items, onChange, disabled }: ReceiptItemsTableProps) => {
  const addItem = () => {
    onChange([
      ...items,
      {
        quantity: 1,
        specification: '',
        item_order: items.length + 1,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems.map((item, i) => ({ ...item, item_order: i + 1 })));
  };

  const updateItem = (index: number, field: 'quantity' | 'specification', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted grid grid-cols-12 gap-4 p-3 font-semibold text-sm">
          <div className="col-span-2">QUANT.</div>
          <div className="col-span-9">ESPECIFICAÇÃO</div>
          <div className="col-span-1"></div>
        </div>
        
        <div className="divide-y">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 p-3 items-center">
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
              <div className="col-span-9">
                <Input
                  value={item.specification}
                  onChange={(e) => updateItem(index, 'specification', e.target.value)}
                  placeholder="Descrição do equipamento"
                  disabled={disabled}
                  className="w-full"
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={disabled || items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
