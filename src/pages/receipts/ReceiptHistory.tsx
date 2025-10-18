import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useConfirm } from "@/hooks/useConfirm";
import { BackButton } from "@/components/BackButton";
import { Loader2, Eye, Trash2, Plus, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const ReceiptHistory = () => {
  const navigate = useNavigate();
  const { receipts, isLoading, deleteReceipt } = useReceipts();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrega' | 'devolucao'>('all');
  const { confirm, ConfirmDialog } = useConfirm();

  const filteredReceipts = receipts?.filter((receipt) => {
    const matchesSearch = 
      receipt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.work_site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receipt_number.toString().includes(searchTerm);
    
    const matchesType = typeFilter === 'all' || receipt.receipt_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Excluir comprovante",
      description: "Tem certeza que deseja excluir este comprovante? Esta ação não pode ser desfeita.",
    });

    if (confirmed) {
      deleteReceipt.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ConfirmDialog />
      <BackButton />

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Comprovantes
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/receipts/delivery/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrega
              </Button>
              <Button onClick={() => navigate('/receipts/return/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Devolução
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por cliente, obra ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={typeFilter === 'entrega' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('entrega')}
              >
                Entrega
              </Button>
              <Button
                variant={typeFilter === 'devolucao' ? 'default' : 'outline'}
                onClick={() => setTypeFilter('devolucao')}
              >
                Devolução
              </Button>
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Recebido por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum comprovante encontrado
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
                      <TableCell>{receipt.client_name}</TableCell>
                      <TableCell>{receipt.work_site}</TableCell>
                      <TableCell>
                        {format(new Date(receipt.receipt_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{receipt.received_by}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/receipts/view/${receipt.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(receipt.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptHistory;
