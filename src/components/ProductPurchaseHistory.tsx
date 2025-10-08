import { useMemo, useState } from "react";
import { useProductPurchases } from "@/hooks/useProductPurchases";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

export const ProductPurchaseHistory = ({
  open,
  onOpenChange,
  productId,
  productName,
}: Props) => {
  const { data: purchases, isLoading } = useProductPurchases(productId);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>("all");

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Filtrar e agrupar compras
  const { groupedByMonth, years } = useMemo(() => {
    if (!purchases) return { groupedByMonth: {}, years: [] };

    // Filtrar
    let filtered = purchases;
    if (selectedYear !== "all") {
      filtered = filtered.filter(p => 
        new Date(p.purchase_date).getFullYear().toString() === selectedYear
      );
    }
    if (selectedMonth !== "all") {
      filtered = filtered.filter(p => 
        (new Date(p.purchase_date).getMonth() + 1).toString() === selectedMonth
      );
    }
    if (selectedPaymentType !== "all") {
      filtered = filtered.filter(p => p.payment_type === selectedPaymentType);
    }

    // Agrupar por mês/ano
    const grouped: Record<string, typeof purchases> = {};
    filtered.forEach(purchase => {
      const date = new Date(purchase.purchase_date);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(purchase);
    });

    // Extrair anos únicos
    const uniqueYears = Array.from(
      new Set(purchases.map(p => new Date(p.purchase_date).getFullYear()))
    ).sort((a, b) => b - a);

    return { groupedByMonth: grouped, years: uniqueYears };
  }, [purchases, selectedYear, selectedMonth, selectedPaymentType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Compras - {productName}</DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Ano</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Mês</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {monthNames.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Pagamento</label>
            <Select value={selectedPaymentType} onValueChange={setSelectedPaymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Faturado">Faturado</SelectItem>
                <SelectItem value="Caixa">Caixa</SelectItem>
                <SelectItem value="Nivaldo">Nivaldo</SelectItem>
                <SelectItem value="Sabrina">Sabrina</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : Object.keys(groupedByMonth).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma compra encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByMonth).map(([monthYear, purchases]) => {
              const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
              const totalValue = purchases.reduce(
                (sum, p) => sum + (p.purchase_price || 0) * p.quantity,
                0
              );

              return (
                <Card key={monthYear}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {monthYear}
                      <span className="text-sm font-normal ml-4 text-muted-foreground">
                        Total: {totalQuantity} unidades | R$ {totalValue.toFixed(2)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Preço Compra</TableHead>
                          <TableHead>Preço Venda</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Operador</TableHead>
                          <TableHead>Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>
                              {format(new Date(purchase.purchase_date), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell>{purchase.quantity}</TableCell>
                            <TableCell>
                              {purchase.purchase_price
                                ? `R$ ${purchase.purchase_price.toFixed(2)}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {purchase.sale_price
                                ? `R$ ${purchase.sale_price.toFixed(2)}`
                                : "-"}
                            </TableCell>
                            <TableCell>{purchase.payment_type}</TableCell>
                            <TableCell>{purchase.operator_name || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {purchase.notes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
