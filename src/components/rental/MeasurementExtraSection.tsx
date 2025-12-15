import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Truck, Wrench } from "lucide-react";
import { MeasurementItem } from "@/hooks/useRentalMeasurements";

interface MeasurementExtraSectionProps {
  title: string;
  category: 'demobilization' | 'maintenance';
  items: MeasurementItem[];
  onUpdateItem: (index: number, field: keyof MeasurementItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  subtotal: number;
  readOnly?: boolean;
}

export function MeasurementExtraSection({
  title,
  category,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  subtotal,
  readOnly = false
}: MeasurementExtraSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const Icon = category === 'demobilization' ? Truck : Wrench;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={onAddItem}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-14">ITEM</TableHead>
                <TableHead>DESCRIÇÃO</TableHead>
                <TableHead className="w-20 text-center">QTD</TableHead>
                <TableHead className="w-16 text-center">UN</TableHead>
                <TableHead className="w-28 text-right">VL. UNIT.</TableHead>
                <TableHead className="w-28 text-right">VL. TOTAL</TableHead>
                {!readOnly && <TableHead className="w-14"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={readOnly ? 6 : 7} className="text-center text-muted-foreground py-8">
                    Nenhum item cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={item.id || `${category}-${index}`}>
                    <TableCell className="font-medium">
                      {String(index + 1).padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        item.description
                      ) : (
                        <Input
                          value={item.description}
                          onChange={(e) => onUpdateItem(index, 'description', e.target.value)}
                          placeholder="Descrição do item"
                          className="h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        item.quantity
                      ) : (
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQty = parseInt(e.target.value) || 1;
                            onUpdateItem(index, 'quantity', newQty);
                            onUpdateItem(index, 'total_price', newQty * item.unit_price);
                          }}
                          className="w-16 text-center h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {readOnly ? (
                        item.unit
                      ) : (
                        <Input
                          value={item.unit}
                          onChange={(e) => onUpdateItem(index, 'unit', e.target.value.toUpperCase())}
                          className="w-14 text-center h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        formatCurrency(item.unit_price)
                      ) : (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            onUpdateItem(index, 'unit_price', newPrice);
                            onUpdateItem(index, 'total_price', item.quantity * newPrice);
                          }}
                          className="w-24 text-right h-8"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total_price)}
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={readOnly ? 5 : 5} className="text-right">
                  Subtotal:
                </TableCell>
                <TableCell className="text-right text-primary">
                  {formatCurrency(subtotal)}
                </TableCell>
                {!readOnly && <TableCell></TableCell>}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
