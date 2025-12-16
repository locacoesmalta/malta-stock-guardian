import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { MeasurementItem } from "@/hooks/useRentalMeasurements";
import { parseLocalDate, formatBelemDate } from "@/lib/dateUtils";

interface ExtendedMeasurementItem extends MeasurementItem {
  dias_reais?: number;
  monthly_price?: number;
  unit_quantity?: number;
}

interface MeasurementRentalsSectionProps {
  items: ExtendedMeasurementItem[];
  onUpdateItem: (index: number, field: keyof MeasurementItem, value: any) => void;
  subtotal: number;
  totalDays: number;
  readOnly?: boolean;
}

export function MeasurementRentalsSection({
  items,
  onUpdateItem,
  subtotal,
  totalDays,
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
      const startDate = formatBelemDate(parseLocalDate(start), "dd/MM/yy");
      const endDate = formatBelemDate(parseLocalDate(end), "dd/MM/yy");
      return `${startDate} a ${endDate}`;
    } catch {
      return "-";
    }
  };

  // Cálculo proporcional: UNIDADE × VALOR MENSAL × (QUANT. DIAS / totalDays)
  const calculateTotalPrice = (item: ExtendedMeasurementItem): number => {
    const unidade = item.unit_quantity || 1;
    const valorMensal = item.monthly_price || item.unit_price || 0;
    const quantDias = item.dias_reais || item.days_count || item.quantity || 0;
    
    if (totalDays === 0) return 0;
    return unidade * valorMensal * (quantDias / totalDays);
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
                <TableHead className="w-16">QUANT.</TableHead>
                <TableHead className="w-20">UNIDADE</TableHead>
                <TableHead>EQUIPAMENTOS</TableHead>
                <TableHead className="w-36">PERÍODO</TableHead>
                <TableHead className="w-24 text-center">QUANT. DIAS</TableHead>
                <TableHead className="w-32 text-right">VALOR MENSAL</TableHead>
                <TableHead className="w-32 text-right">VALOR TOTAL</TableHead>
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
                  const diasReais = item.dias_reais || item.days_count || item.quantity || 0;
                  const unidade = item.unit_quantity || 1;
                  const valorMensal = item.monthly_price || item.unit_price || 0;
                  const valorTotal = calculateTotalPrice(item);
                  const isMinimum = diasReais <= 15;
                  
                  return (
                    <TableRow key={item.id || `rental-${index}`}>
                      {/* QUANT. - Número sequencial */}
                      <TableCell className="font-medium">
                        {String(index + 1).padStart(2, '0')}
                      </TableCell>
                      
                      {/* UNIDADE */}
                      <TableCell className="text-center">
                        {unidade} UN
                      </TableCell>
                      
                      {/* EQUIPAMENTOS - Nome + PAT */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.description}</span>
                          {item.equipment_code && (
                            <span className="text-xs text-muted-foreground">
                              PAT {item.equipment_code}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* PERÍODO */}
                      <TableCell className="text-sm">
                        {formatPeriod(item.period_start, item.period_end)}
                      </TableCell>
                      
                      {/* QUANT. DIAS */}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{diasReais}</span>
                          {isMinimum && (
                            <Badge variant="outline" className="text-xs">
                              mín. 15
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* VALOR MENSAL */}
                      <TableCell className="text-right">
                        {readOnly ? (
                          formatCurrency(valorMensal)
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={valorMensal}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              onUpdateItem(index, 'monthly_price' as any, newPrice);
                              // Recalcular valor total
                              const newTotal = unidade * newPrice * (diasReais / totalDays);
                              onUpdateItem(index, 'total_price', newTotal);
                            }}
                            className="w-28 text-right h-8"
                          />
                        )}
                      </TableCell>
                      
                      {/* VALOR TOTAL */}
                      <TableCell className="text-right font-medium">
                        {formatCurrency(valorTotal)}
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
        
        {/* Legenda do cálculo */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">Cálculo do Valor Total:</p>
          <p>UNIDADE × VALOR MENSAL × (QUANT. DIAS ÷ {totalDays} dias do período)</p>
        </div>
      </CardContent>
    </Card>
  );
}
