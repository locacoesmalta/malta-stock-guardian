import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { MeasurementItem } from "@/hooks/useRentalMeasurements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExtendedMeasurementItem extends MeasurementItem {
  dias_reais?: number;
}

interface MeasurementRentalsSectionProps {
  items: ExtendedMeasurementItem[];
  onUpdateItem: (index: number, field: keyof MeasurementItem, value: any) => void;
  subtotal: number;
  readOnly?: boolean;
}

export function MeasurementRentalsSection({
  items,
  onUpdateItem,
  subtotal,
  readOnly = false
}: MeasurementRentalsSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPeriod = (start?: string, end?: string) => {
    if (!start || !end) return "-";
    try {
      const startDate = format(new Date(start), "dd/MM/yy", { locale: ptBR });
      const endDate = format(new Date(end), "dd/MM/yy", { locale: ptBR });
      return `${startDate} a ${endDate}`;
    } catch {
      return "-";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-primary" />
          Aluguéis de Máquinas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-14">ITEM</TableHead>
                <TableHead className="w-20">PAT</TableHead>
                <TableHead>DESCRIÇÃO</TableHead>
                <TableHead className="w-32">PERÍODO</TableHead>
                <TableHead className="w-24 text-center">DIAS</TableHead>
                <TableHead className="w-28 text-right">VL. UNIT.</TableHead>
                <TableHead className="w-28 text-right">VL. TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum equipamento no período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => {
                  const diasReais = item.dias_reais || item.quantity;
                  const diasCobrados = item.days_count || item.quantity;
                  const isMinimum = diasReais <= 15 && diasCobrados === 15;
                  
                  return (
                    <TableRow key={item.id || index}>
                      <TableCell className="font-medium">
                        {String(index + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.equipment_code || "-"}
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-sm">
                        {formatPeriod(item.period_start, item.period_end)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isMinimum ? (
                            <>
                              <span className="text-muted-foreground line-through text-xs">
                                {diasReais}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {diasCobrados} (mín)
                              </Badge>
                            </>
                          ) : (
                            <span>{diasCobrados}</span>
                          )}
                        </div>
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
                              onUpdateItem(index, 'total_price', newPrice * (item.days_count || 1));
                            }}
                            className="w-24 text-right h-8"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total_price)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={6} className="text-right">
                  Subtotal:
                </TableCell>
                <TableCell className="text-right text-primary">
                  {formatCurrency(subtotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
