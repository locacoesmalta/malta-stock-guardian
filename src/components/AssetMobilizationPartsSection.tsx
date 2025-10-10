import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductSelector } from "@/components/ProductSelector";
import { useProducts } from "@/hooks/useProducts";
import { useAssetMobilizationParts } from "@/hooks/useAssetMobilizationParts";
import { Trash2, DollarSign, TrendingUp } from "lucide-react";
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
}

export const AssetMobilizationPartsSection = ({ assetId, assetCode }: AssetMobilizationPartsSectionProps) => {
  const { allProducts } = useProducts();
  const { 
    mobilizationParts, 
    totalMobilizationCost, 
    isLoading, 
    addMobilizationPart, 
    removeMobilizationPart, 
    isAdding 
  } = useAssetMobilizationParts(assetId);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Quando seleciona um produto, preenche automaticamente os dados do cadastro
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    
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

  const calculatedTotal = quantity && unitCost 
    ? (parseInt(quantity) * parseFloat(unitCost)).toFixed(2)
    : "0.00";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId || !unitCost || !purchaseDate) {
      return;
    }

    const quantityNum = parseInt(quantity);
    const unitCostNum = parseFloat(unitCost);
    
    if (quantityNum <= 0 || unitCostNum <= 0) {
      return;
    }

    addMobilizationPart({
      asset_id: assetId,
      product_id: selectedProductId,
      quantity: quantityNum,
      unit_cost: unitCostNum,
      purchase_date: purchaseDate,
      notes: notes.trim() || undefined,
    });

    setSelectedProductId("");
    setQuantity("1");
    setUnitCost("");
    setPurchaseDate("");
    setPaymentType("");
    setNotes("");
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      removeMobilizationPart(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Peças de Mobilização - Custos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Registre peças compradas para mobilizar o equipamento {assetCode} e torná-lo funcional
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product">Produto *</Label>
                  <ProductSelector
                    products={allProducts}
                    value={selectedProductId}
                    onValueChange={handleProductChange}
                    placeholder="Buscar por código ou nome..."
                    required
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

              {quantity && unitCost && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Custo Total Calculado: <span className="text-lg">R$ {calculatedTotal}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre a compra..."
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isAdding || !selectedProductId || !unitCost || !purchaseDate}>
                {isAdding ? "Adicionando..." : "Adicionar Peça"}
              </Button>
            </form>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando peças...</div>
            ) : mobilizationParts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma peça de mobilização registrada
              </div>
            ) : (
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
                    {mobilizationParts.map((part) => (
                      <TableRow key={part.id}>
                        <TableCell className="font-medium">{part.products.code}</TableCell>
                        <TableCell>{part.products.name}</TableCell>
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
            )}
          </CardContent>
        </Card>

        {mobilizationParts.length > 0 && (
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Total Geral de Mobilização</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  R$ {totalMobilizationCost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Peça de Mobilização"
        description="Tem certeza que deseja remover esta peça da lista de mobilização? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </>
  );
};
