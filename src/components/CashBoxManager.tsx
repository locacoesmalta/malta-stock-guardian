import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useCashBox } from "@/hooks/useCashBox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Plus, X, Edit, Paperclip, Printer, Trash2, ChevronDown, ChevronUp, History } from "lucide-react";
import { useConfirm } from "@/hooks/useConfirm";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import "@/styles/cash-box-print.css";

export const CashBoxManager = () => {
  const {
    openCashBox,
    transactions,
    closedCashBoxes,
    isLoadingCashBox,
    isLoadingHistory,
    openCashBoxMutation,
    closeCashBoxMutation,
    addTransactionMutation,
    updateTransactionMutation,
    deleteTransactionMutation,
    deleteCashBoxMutation,
    calculateBalance,
    getTransactionsForCashBox,
  } = useCashBox();

  const { confirm, ConfirmDialog } = useConfirm();
  const { isAdmin } = useAuth();
  
  const [openDate, setOpenDate] = useState("");
  const [initialValue, setInitialValue] = useState("");
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [transactionType, setTransactionType] = useState<"entrada" | "saida" | "devolucao">("saida");
  const [transactionValue, setTransactionValue] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionObservations, setTransactionObservations] = useState("");
  const [transactionFile, setTransactionFile] = useState<File | null>(null);
  const [transactionInvoiceDate, setTransactionInvoiceDate] = useState("");
  
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editObservations, setEditObservations] = useState("");
  
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [historyTransactions, setHistoryTransactions] = useState<Record<string, any[]>>({});

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
      invoiceDate: transactionInvoiceDate || undefined,
    });
    
    setShowAddDialog(false);
    setTransactionType("saida");
    setTransactionValue("");
    setTransactionDescription("");
    setTransactionObservations("");
    setTransactionFile(null);
    setTransactionInvoiceDate("");
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;
    
    const confirmed = await confirm({
      title: "Confirmar Edição",
      description: "Tem certeza que deseja salvar as alterações nesta transação?",
    });
    
    if (!confirmed) return;
    
    await updateTransactionMutation.mutateAsync({
      id: editingTransaction.id,
      description: editDescription,
      observations: editObservations,
    });
    
    setShowEditDialog(false);
    setEditingTransaction(null);
    setEditDescription("");
    setEditObservations("");
  };

  const handlePrint = () => {
    window.print();
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

  const handleDeleteTransaction = async (transactionId: string) => {
    const confirmed = await confirm({
      title: "Excluir Transação",
      description: "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.",
    });
    
    if (confirmed) {
      await deleteTransactionMutation.mutateAsync(transactionId);
    }
  };

  const handleDeleteCashBox = async (cashBoxId: string) => {
    if (!isAdmin) {
      toast.error("Apenas superusuários podem excluir caixas!");
      return;
    }

    const confirmed = await confirm({
      title: "Excluir Caixa",
      description: "Tem certeza que deseja excluir este caixa? Todas as transações associadas também serão excluídas. Esta ação não pode ser desfeita.",
    });
    
    if (confirmed) {
      await deleteCashBoxMutation.mutateAsync(cashBoxId);
    }
  };

  const toggleHistoryExpanded = async (cashBoxId: string) => {
    const newExpanded = new Set(expandedHistoryIds);
    
    if (newExpanded.has(cashBoxId)) {
      newExpanded.delete(cashBoxId);
    } else {
      newExpanded.add(cashBoxId);
      // Buscar transações se ainda não foram carregadas
      if (!historyTransactions[cashBoxId]) {
        const trans = await getTransactionsForCashBox(cashBoxId);
        setHistoryTransactions(prev => ({ ...prev, [cashBoxId]: trans }));
      }
    }
    
    setExpandedHistoryIds(newExpanded);
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
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Nova Transação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      </div>
                      
                      <div>
                        <Label htmlFor="invoiceDate">Data da Nota</Label>
                        <Input
                          id="invoiceDate"
                          type="date"
                          value={transactionInvoiceDate}
                          onChange={(e) => setTransactionInvoiceDate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Pode ser uma data retroativa
                        </p>
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
                
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Caixa
                </Button>
              </div>

              {/* Área de impressão */}
              <div id="cash-box-print-area" className="hidden print:block">
                <div className="cash-box-print-header">
                  <h1>CAIXA DA MALTA</h1>
                  <p>Gestão do caixa diário da empresa</p>
                  <p>Impresso em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>

                <div className="cash-box-cards">
                  <div className="cash-box-card">
                    <div className="cash-box-card-label">Aberto em</div>
                    <div className="cash-box-card-value">{formatDate(openCashBox.opened_at)}</div>
                  </div>
                  <div className="cash-box-card">
                    <div className="cash-box-card-label">Valor Inicial</div>
                    <div className="cash-box-card-value">{formatCurrency(openCashBox.initial_value)}</div>
                  </div>
                  <div className="cash-box-card">
                    <div className="cash-box-card-label">Total em Transações</div>
                    <div className="cash-box-card-value">{transactions.length}</div>
                  </div>
                  <div className={`cash-box-card ${isLowBalance() ? "low-balance" : ""}`}>
                    <div className="cash-box-card-label">
                      Saldo Atual {isLowBalance() && "(⚠️ BAIXO)"}
                    </div>
                    <div className="cash-box-card-value">{formatCurrency(calculateBalance())}</div>
                  </div>
                </div>

                <div className="cash-box-transactions">
                  <h2>Histórico de Transações</h2>
                  {transactions.map((transaction, index) => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-number">{String(index + 1).padStart(2, '0')}</div>
                      <div className={`transaction-type ${transaction.type}`}>
                        {transaction.type === "entrada"
                          ? "ENTRADA"
                          : transaction.type === "saida"
                          ? "SAÍDA"
                          : "DEVOLUÇÃO"}
                      </div>
                      <div className="transaction-details">
                        <p className="transaction-description">
                          {transaction.description || "Sem descrição"}
                        </p>
                        {transaction.observations && (
                          <p className="transaction-observations">{transaction.observations}</p>
                        )}
                        <p className="transaction-date">{formatDate(transaction.created_at)}</p>
                      </div>
                      <div className="transaction-value">{formatCurrency(transaction.value)}</div>
                    </div>
                  ))}
                </div>

                {/* Seção de Fotos/Anexos */}
                {transactions.some(t => t.attachment_url) && (
                  <div className="cash-box-attachments">
                    <h2>Anexos das Transações</h2>
                    <div className="attachments-grid">
                      {transactions.map((transaction, index) => 
                        transaction.attachment_url && (
                      <div key={transaction.id} className="attachment-item">
                        <div className="attachment-number">
                          {String(index + 1).padStart(2, '0')} - {transaction.description || "Sem descrição"}
                          {transaction.invoice_date && (
                            <span className="text-xs ml-2">
                              (Nota: {format(new Date(transaction.invoice_date), "dd/MM/yyyy", { locale: ptBR })})
                            </span>
                          )}
                        </div>
                            {transaction.attachment_url.match(/\.(jpg|jpeg|png)$/i) ? (
                              <img 
                                src={transaction.attachment_url} 
                                alt={`Anexo ${index + 1}`}
                                className="attachment-image"
                              />
                            ) : (
                              <div className="attachment-file">
                                <p>Arquivo PDF anexado</p>
                                <p className="text-xs">{transaction.attachment_url}</p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="cash-box-print-footer">
                  <p>Malta Locações de Máquinas e Equipamentos</p>
                </div>
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
                      {transactions.map((transaction, index) => (
                        <div
                          key={transaction.id}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2 py-1 bg-muted rounded">
                                #{String(index + 1).padStart(2, '0')}
                              </span>
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
                            {transaction.invoice_date && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                📄 Data da Nota: {format(new Date(transaction.invoice_date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
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
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setEditDescription(transaction.description || "");
                                  setEditObservations(transaction.observations || "");
                                  setShowEditDialog(true);
                                }}
                                title="Editar transação"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                title="Excluir transação"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Caixas Fechados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Histórico de Caixas Fechados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Carregando histórico...
                    </p>
                  ) : closedCashBoxes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum caixa fechado no histórico
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {closedCashBoxes.map((cashBox) => {
                        const isExpanded = expandedHistoryIds.has(cashBox.id);
                        const cashBoxTrans = historyTransactions[cashBox.id] || [];
                        const finalBalance = calculateBalance(cashBox, cashBoxTrans);

                        return (
                          <Collapsible
                            key={cashBox.id}
                            open={isExpanded}
                            onOpenChange={() => toggleHistoryExpanded(cashBox.id)}
                          >
                            <Card>
                              <CardContent className="pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </CollapsibleTrigger>
                                      <div>
                                        <p className="font-medium">
                                          Aberto: {formatDate(cashBox.opened_at)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Fechado: {cashBox.closed_at ? formatDate(cashBox.closed_at) : "N/A"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Inicial: </span>
                                        <span className="font-medium">{formatCurrency(cashBox.initial_value)}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Final: </span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                          {formatCurrency(finalBalance)}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Transações: </span>
                                        <span className="font-medium">{cashBoxTrans.length}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteCashBox(cashBox.id)}
                                      title="Excluir caixa (somente admin)"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                <CollapsibleContent className="mt-4">
                                  {cashBoxTrans.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      Nenhuma transação neste caixa
                                    </p>
                                  ) : (
                                    <div className="space-y-2 border-t pt-4">
                                      {cashBoxTrans.map((transaction, index) => (
                                        <div
                                          key={transaction.id}
                                          className="flex justify-between items-start p-3 border rounded-lg bg-muted/30"
                                        >
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-bold px-2 py-1 bg-background rounded">
                                                #{String(index + 1).padStart(2, '0')}
                                              </span>
                                              <span
                                                className={`text-xs font-semibold px-2 py-1 rounded ${
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
                                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                  title="Ver anexo"
                                                >
                                                  <Paperclip className="h-3 w-3" />
                                                </a>
                                              )}
                                            </div>
                                            <p className="text-sm font-medium">
                                              {transaction.description || "Sem descrição"}
                                            </p>
                                            {transaction.observations && (
                                              <p className="text-xs text-muted-foreground mt-1">
                                                {transaction.observations}
                                              </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                              {formatDate(transaction.created_at)}
                                            </p>
                                          </div>
                                          <span className="font-bold text-lg">
                                            {formatCurrency(transaction.value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </CollapsibleContent>
                              </CardContent>
                            </Card>
                          </Collapsible>
                        );
                      })}
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
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editValue">Valor (R$) *</Label>
              <Input
                id="editValue"
                type="number"
                step="0.01"
                value={editingTransaction?.value || ""}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O valor não pode ser editado
              </p>
            </div>
            <div>
              <Label htmlFor="editDescription">Descrição</Label>
              <Input
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Descrição da transação"
              />
            </div>
            <div>
              <Label htmlFor="editObservations">Observações</Label>
              <Textarea
                id="editObservations"
                value={editObservations}
                onChange={(e) => setEditObservations(e.target.value)}
                placeholder="Observações adicionais"
                className="print-observations"
              />
            </div>
            <Button
              onClick={handleEditTransaction}
              disabled={updateTransactionMutation.isPending}
              className="w-full"
            >
              {updateTransactionMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
