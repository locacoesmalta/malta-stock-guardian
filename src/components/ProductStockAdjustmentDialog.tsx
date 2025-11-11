import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  code: string;
  name: string;
  quantity: number;
}

interface ProductStockAdjustmentDialogProps {
  open: boolean;
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ProductStockAdjustmentDialog = ({
  open,
  product,
  onOpenChange,
  onSuccess,
}: ProductStockAdjustmentDialogProps) => {
  const { user } = useAuth();
  const [adjustmentData, setAdjustmentData] = useState({
    newQuantity: 0,
    reason: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!product || adjustmentData.newQuantity < 0) {
      toast.error("Quantidade inválida");
      return;
    }

    if (!adjustmentData.reason) {
      toast.error("Selecione o motivo do ajuste");
      return;
    }

    setSubmitting(true);

    try {
      const quantityChange = adjustmentData.newQuantity - product.quantity;

      // 1. Registrar ajuste no histórico
      const { error: adjustmentError } = await supabase
        .from("product_stock_adjustments")
        .insert([{
          product_id: product.id,
          adjusted_by: user?.id,
          previous_quantity: product.quantity,
          new_quantity: adjustmentData.newQuantity,
          quantity_change: quantityChange,
          reason: adjustmentData.reason,
          notes: adjustmentData.notes || null,
        }]);

      if (adjustmentError) throw adjustmentError;

      // 2. Atualizar quantidade do produto
      const { error: updateError } = await supabase
        .from("products")
        .update({ quantity: adjustmentData.newQuantity })
        .eq("id", product.id);

      if (updateError) throw updateError;

      toast.success(`Estoque ajustado! Nova quantidade: ${adjustmentData.newQuantity}`);
      
      // Resetar e fechar
      setAdjustmentData({ newQuantity: 0, reason: "", notes: "" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao ajustar estoque:", error);
      toast.error("Erro ao ajustar estoque");
    } finally {
      setSubmitting(false);
    }
  };

  // Resetar quando o dialog abrir com novo produto
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && product) {
      setAdjustmentData({
        newQuantity: product.quantity,
        reason: "",
        notes: "",
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque - {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quantidade Atual */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Quantidade Atual:</p>
            <p className="text-2xl font-bold text-primary">{product?.quantity || 0}</p>
          </div>

          {/* Nova Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="new_quantity">Nova Quantidade *</Label>
            <Input
              id="new_quantity"
              type="number"
              min="0"
              value={adjustmentData.newQuantity}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, newQuantity: Number(e.target.value) })}
              required
            />
            {product && adjustmentData.newQuantity !== product.quantity && (
              <p className="text-sm text-muted-foreground">
                Diferença: {adjustmentData.newQuantity - product.quantity > 0 ? '+' : ''}
                {adjustmentData.newQuantity - product.quantity}
              </p>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Ajuste *</Label>
            <Select
              value={adjustmentData.reason}
              onValueChange={(value) => setAdjustmentData({ ...adjustmentData, reason: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Correção de inventário">Correção de inventário</SelectItem>
                <SelectItem value="Perda/Quebra">Perda/Quebra</SelectItem>
                <SelectItem value="Devolução">Devolução</SelectItem>
                <SelectItem value="Entrada sem nota">Entrada sem nota</SelectItem>
                <SelectItem value="Ajuste de cadastro">Ajuste de cadastro</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Detalhes sobre o ajuste (opcional)"
              value={adjustmentData.notes}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !adjustmentData.reason}
          >
            {submitting ? "Ajustando..." : "Confirmar Ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
