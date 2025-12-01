import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useReceipts } from "@/hooks/useReceipts";
import { BackButton } from "@/components/BackButton";
import { Loader2, FileBarChart, Download, Eye } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export const ReceiptMovementReport = () => {
  const navigate = useNavigate();
  const { receipts, isLoading } = useReceipts();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrega' | 'devolucao'>('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  // Filtrar comprovantes
  const filteredReceipts = receipts?.filter((receipt) => {
    const receiptDate = new Date(receipt.receipt_date);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const matchesSearch = 
      receipt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.work_site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receipt_number.toString().includes(searchTerm) ||
      receipt.received_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || receipt.receipt_type === typeFilter;
    const matchesDate = receiptDate >= start && receiptDate <= end;
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Estatísticas
  const stats = {
    total: filteredReceipts?.length || 0,
    entregas: filteredReceipts?.filter(r => r.receipt_type === 'entrega').length || 0,
    devolucoes: filteredReceipts?.filter(r => r.receipt_type === 'devolucao').length || 0,
  };

  // Agrupar por cliente
  const byClient = filteredReceipts?.reduce((acc, receipt) => {
    const client = receipt.client_name;
    if (!acc[client]) {
      acc[client] = { entregas: 0, devolucoes: 0, total: 0 };
    }
    if (receipt.receipt_type === 'entrega') acc[client].entregas++;
    if (receipt.receipt_type === 'devolucao') acc[client].devolucoes++;
    acc[client].total++;
    return acc;
  }, {} as Record<string, { entregas: number; devolucoes: number; total: number }>);

  const handleExport = () => {
    if (!filteredReceipts) return;

    const csvContent = [
      ['Número', 'Tipo', 'Cliente', 'Obra', 'Data', 'Recebido Por', 'CPF'].join(','),
      ...filteredReceipts.map(r => [
        r.receipt_number,
        r.receipt_type === 'entrega' ? 'Entrega' : 'Devolução',
        r.client_name,
        r.work_site,
        format(new Date(r.receipt_date), 'dd/MM/yyyy'),
        r.received_by
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-comprovantes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5" />
            Relatório de Movimentação de Comprovantes
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Cliente, obra, número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="devolucao">Devolução</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total de Comprovantes</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Entregas</p>
                  <p className="text-3xl font-bold text-green-600">{stats.entregas}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Devoluções</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.devolucoes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex justify-end">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Tabela de Movimentações */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Recebido Por</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma movimentação encontrada para o período selecionado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReceipts?.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono">{receipt.receipt_number}</TableCell>
                      <TableCell>
                        <Badge variant={receipt.receipt_type === 'entrega' ? 'default' : 'secondary'}>
                          {receipt.receipt_type === 'entrega' ? 'Entrega' : 'Devolução'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(receipt.receipt_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{receipt.client_name}</TableCell>
                      <TableCell>{receipt.work_site}</TableCell>
                      <TableCell>{receipt.received_by}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/receipts/view/${receipt.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo por Cliente */}
          {byClient && Object.keys(byClient).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo por Cliente</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Entregas</TableHead>
                      <TableHead className="text-center">Devoluções</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(byClient)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([client, data]) => (
                        <TableRow key={client}>
                          <TableCell className="font-medium">{client}</TableCell>
                          <TableCell className="text-center text-green-600">{data.entregas}</TableCell>
                          <TableCell className="text-center text-blue-600">{data.devolucoes}</TableCell>
                          <TableCell className="text-center font-semibold">{data.total}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptMovementReport;
