import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProductSearchCombobox } from "@/components/ProductSearchCombobox";
import { AssetSearchCombobox } from "@/components/AssetSearchCombobox";
import { useProducts } from "@/hooks/useProducts";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { useAssetMobilizationParts } from "@/hooks/useAssetMobilizationParts";
import { useAssetMobilizationExpenses } from "@/hooks/useAssetMobilizationExpenses";
import { Trash2, DollarSign, TrendingUp, Package, Wrench, Plane, Truck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssetMobilizationPartsSectionProps {
  assetId: string;
  assetCode: string;
  assetUnitValue?: number;
  assetPurchaseDate?: string;
}

export const AssetMobilizationPartsSection = ({ 
  assetId, 
  assetCode,
  assetUnitValue,
  assetPurchaseDate,
}: AssetMobilizationPartsSectionProps) => {
  const { allProducts } = useProducts();
  const { data: allAssets = [] } = useAssetsQuery();
  const { 
    mobilizationParts, 
    totalMobilizationCost, 
    isLoading, 
    addMobilizationPart, 
    removeMobilizationPart, 
    isAdding 
  } = useAssetMobilizationParts(assetId);
  
  const {
    mobilizationExpenses,
    totalExpensesCost,
    isLoading: isLoadingExpenses,
    addMobilizationExpense,
    removeMobilizationExpense,
    isAdding: isAddingExpense,
  } = useAssetMobilizationExpenses(assetId);
  
  const [itemType, setItemType] = useState<"product" | "asset" | "expense">("product");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Estados para despesas
  const [expenseType, setExpenseType] = useState<"" | "travel" | "shipment">("");
  const [collaboratorName, setCollaboratorName] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [sentBy, setSentBy] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [expenseValue, setExpenseValue] = useState("");

  // Filtrar apenas assets que não são o próprio asset atual
  const availableAssets = allAssets.filter(a => a.id !== assetId);

  // Quando seleciona um produto, preenche automaticamente os dados do cadastro
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedAssetId("");
    
    const selectedProduct = allProducts.find(p => p.id === productId);
    if (selectedProduct) {
      // Preenche o custo unitário (usa purchase_price se disponível)
      const cost = selectedProduct.purchase_price || selectedProduct.sale_price || 0;
      setUnitCost(cost.toString());
      
      // Preenche a data de compra (última data cadastrada)
      if (selectedProduct.last_purchase_date) {
        setPurchaseDate(selectedProduct.last_purchase_date);
      } else {
        setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
      }
      
      // Preenche o tipo de pagamento
      setPaymentType(selectedProduct.payment_type || "");
    }
  };

  // Quando seleciona um equipamento PAT, preenche automaticamente os dados
  const handleAssetChange = (assetId: string) => {
    setSelectedAssetId(assetId);
    setSelectedProductId("");
    
    const selectedAsset = availableAssets.find(a => a.id === assetId);
    if (selectedAsset) {
      // Preenche o custo unitário
      const cost = selectedAsset.unit_value || 0;
      setUnitCost(cost.toString());
      
      // Preenche a data de compra
      if (selectedAsset.purchase_date) {
        setPurchaseDate(selectedAsset.purchase_date);
      } else {
        setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
      }
      
      // Preenche o tipo de pagamento
      setPaymentType("");
    }
  };

  const calculatedTotal = quantity && unitCost 
    ? (parseInt(quantity) * parseFloat(unitCost)).toFixed(2)
    : "0.00";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (itemType === "expense") {
      // Validar despesas
      if (!expenseType || !expenseValue) {
        return;
      }
      
      const valueNum = parseFloat(expenseValue);
      if (valueNum <= 0) {
        return;
      }

      if (expenseType === "travel") {
        if (!collaboratorName || !travelDate || !returnDate) {
          return;
        }
        
        addMobilizationExpense({
          asset_id: assetId,
          expense_type: "travel",
          value: valueNum,
          collaborator_name: collaboratorName,
          travel_date: travelDate,
          return_date: returnDate,
        });
      } else if (expenseType === "shipment") {
        if (!sentBy || !shipmentDate || !receivedBy) {
          return;
        }
        
        addMobilizationExpense({
          asset_id: assetId,
          expense_type: "shipment",
          value: valueNum,
          sent_by: sentBy,
          shipment_date: shipmentDate,
          received_by: receivedBy,
        });
      }

      // Limpar campos de despesas
      setExpenseType("");
      setCollaboratorName("");
      setTravelDate("");
      setReturnDate("");
      setSentBy("");
      setShipmentDate("");
      setReceivedBy("");
      setExpenseValue("");
    } else {
      // Validar produtos/equipamentos
      if ((!selectedProductId && !selectedAssetId) || !unitCost || !purchaseDate) {
        return;
      }

      const quantityNum = parseInt(quantity);
      const unitCostNum = parseFloat(unitCost);
      
      if (quantityNum <= 0 || unitCostNum <= 0) {
        return;
      }

      addMobilizationPart({
        asset_id: assetId,
        product_id: selectedProductId || undefined,
        mobilization_asset_id: selectedAssetId || undefined,
        quantity: quantityNum,
        unit_cost: unitCostNum,
        purchase_date: purchaseDate,
        notes: notes.trim() || undefined,
      });

      setSelectedProductId("");
      setSelectedAssetId("");
      setQuantity("1");
      setUnitCost("");
      setPurchaseDate("");
      setPaymentType("");
      setNotes("");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      // Verificar se é uma despesa ou item de mobilização
      const isExpense = mobilizationExpenses.some(e => e.id === deleteId);
      
      if (isExpense) {
        removeMobilizationExpense(deleteId);
      } else {
        removeMobilizationPart(deleteId);
      }
      
      setDeleteId(null);
    }
  };

  // Calcular custo total incluindo o equipamento principal e despesas
  const totalWithMainAsset = assetUnitValue 
    ? totalMobilizationCost + totalExpensesCost + assetUnitValue 
    : totalMobilizationCost + totalExpensesCost;

  // Separar itens de produtos e equipamentos
  const productParts = mobilizationParts.filter(part => part.product_id);
  const assetParts = mobilizationParts.filter(part => part.mobilization_asset_id);

  return (
    <>
      <div className="space-y-6">
        {/* Card com custo do equipamento principal */}
        {assetUnitValue !== undefined && assetUnitValue !== null && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Equipamento Principal - {assetCode}</h3>
                    <p className="text-sm text-muted-foreground">Custo base do equipamento</p>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    R$ {assetUnitValue.toFixed(2)}
                  </span>
                </div>
                {assetPurchaseDate && (
                  <div className="text-sm text-muted-foreground">
                    Data de compra: {format(new Date(assetPurchaseDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Custos de Mobilização
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Registre peças e equipamentos usados para mobilizar o equipamento {assetCode}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs value={itemType} onValueChange={(v) => setItemType(v as "product" | "asset" | "expense")} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="product" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produto/Peça
                  </TabsTrigger>
                  <TabsTrigger value="asset" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Equipamento PAT
                  </TabsTrigger>
                  <TabsTrigger value="expense" className="flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Despesas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="product" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="product">Produto *</Label>
                      <ProductSearchCombobox
                        products={allProducts}
                        value={selectedProductId}
                        onValueChange={handleProductChange}
                        placeholder="Buscar por código ou nome..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unitCost">Custo Unitário (R$) *</Label>
                      <Input
                        id="unitCost"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={unitCost}
                        placeholder="0.00"
                        disabled
                        className="bg-muted"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Preenchido automaticamente do cadastro</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Data da Compra *</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={purchaseDate}
                        disabled
                        className="bg-muted"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Última data do cadastro</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentType">Tipo de Pagamento</Label>
                      <Input
                        id="paymentType"
                        type="text"
                        value={paymentType}
                        disabled
                        className="bg-muted"
                        placeholder="Não informado"
                      />
                      <p className="text-xs text-muted-foreground">Do cadastro do produto</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="asset" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="asset">Equipamento PAT *</Label>
                      <AssetSearchCombobox
                        assets={availableAssets}
                        value={selectedAssetId}
                        onValueChange={handleAssetChange}
                        placeholder="Buscar por PAT ou nome..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity-asset">Quantidade *</Label>
                      <Input
                        id="quantity-asset"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unitCost-asset">Custo Unitário (R$) *</Label>
                      <Input
                        id="unitCost-asset"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={unitCost}
                        placeholder="0.00"
                        disabled
                        className="bg-muted"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Valor do cadastro do equipamento</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate-asset">Data da Compra *</Label>
                      <Input
                        id="purchaseDate-asset"
                        type="date"
                        value={purchaseDate}
                        disabled
                        className="bg-muted"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Data do cadastro do equipamento</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="paymentType-asset">Tipo de Pagamento</Label>
                      <Input
                        id="paymentType-asset"
                        type="text"
                        value={paymentType}
                        disabled
                        className="bg-muted"
                        placeholder="Não informado"
                      />
                      <p className="text-xs text-muted-foreground">Do cadastro do equipamento</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="expense" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label>Tipo de Despesa *</Label>
                      <RadioGroup value={expenseType} onValueChange={(v) => setExpenseType(v as "" | "travel" | "shipment")}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="travel" id="travel" />
                          <Label htmlFor="travel" className="font-normal cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Plane className="h-4 w-4" />
                              Despesa de Viagem
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="shipment" id="shipment" />
                          <Label htmlFor="shipment" className="font-normal cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Envio de Equipamento
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {expenseType === "travel" && (
                      <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="collaboratorName">Nome do Colaborador *</Label>
                          <Input
                            id="collaboratorName"
                            type="text"
                            value={collaboratorName}
                            onChange={(e) => setCollaboratorName(e.target.value)}
                            placeholder="Nome completo"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="travelDate">Data da Viagem *</Label>
                          <Input
                            id="travelDate"
                            type="date"
                            value={travelDate}
                            onChange={(e) => setTravelDate(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="returnDate">Data de Retorno *</Label>
                          <Input
                            id="returnDate"
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expenseValue">Valor em Reais (R$) *</Label>
                          <Input
                            id="expenseValue"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={expenseValue}
                            onChange={(e) => setExpenseValue(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {expenseType === "shipment" && (
                      <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="sentBy">Enviado por *</Label>
                          <Input
                            id="sentBy"
                            type="text"
                            value={sentBy}
                            onChange={(e) => setSentBy(e.target.value)}
                            placeholder="Nome ou empresa responsável"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="shipmentDate">Data de Envio *</Label>
                          <Input
                            id="shipmentDate"
                            type="date"
                            value={shipmentDate}
                            onChange={(e) => setShipmentDate(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="receivedBy">Pessoa que Recebeu *</Label>
                          <Input
                            id="receivedBy"
                            type="text"
                            value={receivedBy}
                            onChange={(e) => setReceivedBy(e.target.value)}
                            placeholder="Nome completo"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="expenseValueShipment">Valor em Reais (R$) *</Label>
                          <Input
                            id="expenseValueShipment"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={expenseValue}
                            onChange={(e) => setExpenseValue(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {itemType !== "expense" && quantity && unitCost && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Custo Total Calculado: <span className="text-lg">R$ {calculatedTotal}</span>
                  </p>
                </div>
              )}

              {itemType !== "expense" && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informações adicionais..."
                    rows={3}
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={
                  itemType === "expense" 
                    ? isAddingExpense || !expenseType || !expenseValue 
                    : isAdding || (!selectedProductId && !selectedAssetId) || !unitCost || !purchaseDate
                }
              >
                {itemType === "expense" 
                  ? (isAddingExpense ? "Adicionando..." : "Adicionar Despesa")
                  : (isAdding ? "Adicionando..." : "Adicionar Item")
                }
              </Button>
            </form>

            {(isLoading || isLoadingExpenses) ? (
              <div className="text-center py-8 text-muted-foreground">Carregando itens...</div>
            ) : mobilizationParts.length === 0 && mobilizationExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum item de mobilização ou despesa registrado
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tabela de Produtos */}
                {productParts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Produtos/Peças
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-center">Qtd</TableHead>
                            <TableHead className="text-right">Unit. (R$)</TableHead>
                            <TableHead className="text-right">Total (R$)</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Obs</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {productParts.map((part) => (
                            <TableRow key={part.id}>
                              <TableCell className="font-medium">{part.products?.code}</TableCell>
                              <TableCell>{part.products?.name}</TableCell>
                              <TableCell className="text-center">{part.quantity}</TableCell>
                              <TableCell className="text-right">
                                {Number(part.unit_cost).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {Number(part.total_cost).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {format(new Date(part.purchase_date), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {part.notes || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(part.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Tabela de Equipamentos PAT */}
                {assetParts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Equipamentos PAT
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>PAT</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead className="text-center">Qtd</TableHead>
                            <TableHead className="text-right">Unit. (R$)</TableHead>
                            <TableHead className="text-right">Total (R$)</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Obs</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assetParts.map((part) => (
                            <TableRow key={part.id}>
                              <TableCell className="font-medium">{part.mobilization_asset?.asset_code}</TableCell>
                              <TableCell>{part.mobilization_asset?.equipment_name}</TableCell>
                              <TableCell className="text-center">{part.quantity}</TableCell>
                              <TableCell className="text-right">
                                {Number(part.unit_cost).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {Number(part.total_cost).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {format(new Date(part.purchase_date), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {part.notes || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(part.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Tabela de Despesas */}
                {mobilizationExpenses.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Despesas de Viagem/Envio
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Detalhes</TableHead>
                            <TableHead className="text-right">Valor (R$)</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mobilizationExpenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {expense.expense_type === 'travel' ? (
                                    <>
                                      <Plane className="h-4 w-4" />
                                      <span>Viagem</span>
                                    </>
                                  ) : (
                                    <>
                                      <Truck className="h-4 w-4" />
                                      <span>Envio</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {expense.expense_type === 'travel' ? (
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Colaborador:</strong> {expense.collaborator_name}</div>
                                    <div>
                                      <strong>Período:</strong>{' '}
                                      {expense.travel_date && format(new Date(expense.travel_date), "dd/MM/yyyy", { locale: ptBR })}
                                      {' até '}
                                      {expense.return_date && format(new Date(expense.return_date), "dd/MM/yyyy", { locale: ptBR })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1 text-sm">
                                    <div><strong>Enviado por:</strong> {expense.sent_by}</div>
                                    <div><strong>Recebido por:</strong> {expense.received_by}</div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {Number(expense.value).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {expense.expense_type === 'travel' 
                                  ? (expense.travel_date && format(new Date(expense.travel_date), "dd/MM/yyyy", { locale: ptBR }))
                                  : (expense.shipment_date && format(new Date(expense.shipment_date), "dd/MM/yyyy", { locale: ptBR }))
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(expense.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {(mobilizationParts.length > 0 || mobilizationExpenses.length > 0 || (assetUnitValue !== undefined && assetUnitValue !== null)) && (
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {mobilizationParts.length > 0 && (
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm font-medium">Subtotal (Peças e Equipamentos)</span>
                    <span className="text-lg font-semibold">
                      R$ {totalMobilizationCost.toFixed(2)}
                    </span>
                  </div>
                )}
                
                {mobilizationExpenses.length > 0 && (
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm font-medium">Subtotal (Despesas)</span>
                    <span className="text-lg font-semibold">
                      R$ {totalExpensesCost.toFixed(2)}
                    </span>
                  </div>
                )}
                
                {assetUnitValue !== undefined && assetUnitValue !== null && (
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm font-medium">Equipamento Principal</span>
                    <span className="text-lg font-semibold">
                      R$ {assetUnitValue.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">Custo Total Completo</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    R$ {totalWithMainAsset.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Item de Mobilização"
        description="Tem certeza que deseja remover este item da lista de mobilização? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </>
  );
};
