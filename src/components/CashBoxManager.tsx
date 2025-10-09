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

  const isLowBalance = () => {
    if (!openCashBox) return false;
    const currentBalance = calculateBalance();
    const threshold = openCashBox.initial_value * 0.1;
    return currentBalance <= threshold;
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Aberto em</p>
                      <p className="font-medium">{formatDate(openCashBox.opened_at)}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Valor Inicial</p>
                      <p className="font-bold text-xl">{formatCurrency(openCashBox.initial_value)}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Total em Transações</p>
                      <p className="font-medium text-lg">{transactions.length}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={isLowBalance() ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Saldo Atual
                        {isLowBalance() && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                            (⚠️ BAIXO)
                          </span>
                        )}
                      </p>
                      <p className={`font-bold text-2xl ${isLowBalance() ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                        {formatCurrency(calculateBalance())}
                      </p>
                    </div>
                  </CardContent>
                </Card>
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma transação registrada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded ${
                                  transaction.type === "entrada"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : transaction.type === "saida"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
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
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Ver anexo"
                                >
                                  <Paperclip className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                            <p className="text-sm font-medium mt-1 truncate">
                              {transaction.description || "Sem descrição"}
                            </p>
                            {transaction.observations && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {transaction.observations}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <span className="font-bold text-lg whitespace-nowrap">
                              {formatCurrency(transaction.value)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingTransaction(transaction);
                                setEditObservations(transaction.observations || "");
                                setShowEditDialog(true);
                              }}
                              title="Editar observações"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
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
