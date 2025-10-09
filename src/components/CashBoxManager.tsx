import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCashBox } from "@/hooks/useCashBox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Plus, X, Edit, Paperclip } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";

export const CashBoxManager = () => {
  const {
    openCashBox,
    transactions,
    isLoadingCashBox,
    openCashBoxMutation,
    closeCashBoxMutation,
    addTransactionMutation,
    updateTransactionMutation,
    calculateBalance,
  } = useCashBox();

  const { confirm, ConfirmDialog } = useConfirm();
  
  const [openDate, setOpenDate] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [transactionType, setTransactionType] = useState<"entrada" | "saida" | "devolucao">("entrada");
  const [transactionValue, setTransactionValue] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionObservations, setTransactionObservations] = useState("");
  const [transactionFile, setTransactionFile] = useState<File | null>(null);
  
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editObservations, setEditObservations] = useState("");

  const handleOpenCashBox = async () => {
    if (!openDate || !initialValue) return;
    
    await openCashBoxMutation.mutateAsync({
      openedAt: openDate,
      initialValue: parseFloat(initialValue),
    });
    
    setShowOpenDialog(false);
    setOpenDate("");
    setInitialValue("");
  };

  const handleCloseCashBox = async () => {
    if (!openCashBox) return;
    
    const confirmed = await confirm({
      title: "Finalizar Caixa",
      description: "Tem certeza que deseja finalizar este caixa? Esta ação não pode ser desfeita.",
    });
    
    if (confirmed) {
      await closeCashBoxMutation.mutateAsync(openCashBox.id);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionValue) return;
    
    await addTransactionMutation.mutateAsync({
      type: transactionType,
      value: parseFloat(transactionValue),
      description: transactionDescription,
      observations: transactionObservations,
      attachmentFile: transactionFile || undefined,
    });
    
    setShowAddDialog(false);
    setTransactionType("entrada");
    setTransactionValue("");
    setTransactionDescription("");
    setTransactionObservations("");
    setTransactionFile(null);
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;
    
    await updateTransactionMutation.mutateAsync({
      id: editingTransaction.id,
      observations: editObservations,
    });
    
    setShowEditDialog(false);
    setEditingTransaction(null);
    setEditObservations("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  if (isLoadingCashBox) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <ConfirmDialog />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Caixa da Malta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!openCashBox ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum caixa aberto no momento</p>
              <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Abrir Caixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abrir Novo Caixa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="openDate">Data de Abertura *</Label>
                      <Input
                        id="openDate"
                        type="datetime-local"
                        value={openDate}
                        onChange={(e) => setOpenDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="initialValue">Valor Inicial (R$) *</Label>
                      <Input
                        id="initialValue"
                        type="number"
                        step="0.01"
                        value={initialValue}
                        onChange={(e) => setInitialValue(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      onClick={handleOpenCashBox}
                      disabled={!openDate || !initialValue || openCashBoxMutation.isPending}
                      className="w-full"
                    >
                      Abrir Caixa
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Aberto em</p>
                  <p className="font-medium">{formatDate(openCashBox.opened_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Inicial</p>
                  <p className="font-medium">{formatCurrency(openCashBox.initial_value)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Atual</p>
                  <p className="font-bold text-lg">{formatCurrency(calculateBalance())}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Transação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Transação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="type">Tipo *</Label>
                        <Select value={transactionType} onValueChange={(value: any) => setTransactionType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                            <SelectItem value="devolucao">Devolução</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="value">Valor (R$) *</Label>
                        <Input
                          id="value"
                          type="number"
                          step="0.01"
                          value={transactionValue}
                          onChange={(e) => setTransactionValue(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                          id="description"
                          value={transactionDescription}
                          onChange={(e) => setTransactionDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="observations">Observações</Label>
                        <Textarea
                          id="observations"
                          value={transactionObservations}
                          onChange={(e) => setTransactionObservations(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="file">Anexar Arquivo (PDF, PNG, JPG)</Label>
                        <Input
                          id="file"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setTransactionFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      <Button
                        onClick={handleAddTransaction}
                        disabled={!transactionValue || addTransactionMutation.isPending}
                        className="w-full"
                      >
                        Adicionar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="destructive" onClick={handleCloseCashBox} disabled={closeCashBoxMutation.isPending}>
                  <X className="h-4 w-4 mr-2" />
                  Finalizar Caixa
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Transações</h3>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma transação registrada</p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                transaction.type === "entrada"
                                  ? "text-green-600"
                                  : transaction.type === "saida"
                                  ? "text-red-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {transaction.type === "entrada"
                                ? "ENTRADA"
                                : transaction.type === "saida"
                                ? "SAÍDA"
                                : "DEVOLUÇÃO"}
                            </span>
                            {transaction.attachment_url && (
                              <a
                                href={transaction.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Paperclip className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm">{transaction.description || "Sem descrição"}</p>
                          {transaction.observations && (
                            <p className="text-xs text-muted-foreground mt-1">{transaction.observations}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatCurrency(transaction.value)}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setEditObservations(transaction.observations || "");
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Observações</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editObservations">Observações</Label>
              <Textarea
                id="editObservations"
                value={editObservations}
                onChange={(e) => setEditObservations(e.target.value)}
              />
            </div>
            <Button
              onClick={handleEditTransaction}
              disabled={updateTransactionMutation.isPending}
              className="w-full"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
