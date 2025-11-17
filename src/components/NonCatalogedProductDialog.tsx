import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NonCatalogedProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (description: string, quantity: number) => void;
}

export const NonCatalogedProductDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: NonCatalogedProductDialogProps) => {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (description.trim().length < 10) {
      setError("A descrição deve ter no mínimo 10 caracteres");
      return;
    }
    if (quantity < 1) {
      setError("A quantidade deve ser maior que zero");
      return;
    }

    onConfirm(description.trim(), quantity);
    setDescription("");
    setQuantity(1);
    setError("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setDescription("");
    setQuantity(1);
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Produto Não Catalogado</DialogTitle>
          <DialogDescription>
            Descreva o produto que ainda não está cadastrado no sistema. Esta informação será vinculada ao PAT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Use este recurso apenas para produtos que ainda não foram cadastrados. 
              Cadastre o produto assim que possível para melhor controle de estoque.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="description">
              Descrição do Produto <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Ex: Vedação de borracha 50mm para cilindro hidráulico"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError("");
              }}
              rows={4}
              className={error ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres. Seja específico para facilitar o cadastro posterior.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantidade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(parseInt(e.target.value) || 1);
                setError("");
              }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Adicionar Produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
