import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductSearchCombobox } from "@/components/ProductSearchCombobox";
import { useProducts } from "@/hooks/useProducts";
import { useAssetSpareParts } from "@/hooks/useAssetSpareParts";
import { Trash2, Package } from "lucide-react";
import { formatBelemDate } from "@/lib/dateUtils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AssetSparePartsSectionProps {
  assetId: string;
  assetCode: string;
}

export const AssetSparePartsSection = ({ assetId, assetCode }: AssetSparePartsSectionProps) => {
  const { allProducts } = useProducts();
  const { spareParts, isLoading, addSparePart, removeSparePart, isAdding } = useAssetSpareParts(assetId);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId) {
      return;
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      return;
    }

    addSparePart({
      asset_id: assetId,
      product_id: selectedProductId,
      quantity: quantityNum,
      notes: notes.trim() || undefined,
    });

    setSelectedProductId("");
    setQuantity("1");
    setNotes("");
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      removeSparePart(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Peças de Reposição - Estoque Futuro
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Registre peças que vieram com o equipamento {assetCode} para reposição futura
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product">Produto *</Label>
                <ProductSearchCombobox
                  products={allProducts}
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre a peça..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isAdding || !selectedProductId}>
              {isAdding ? "Adicionando..." : "Adicionar Peça"}
            </Button>
          </form>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando peças...</div>
          ) : spareParts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma peça de reposição registrada
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spareParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-medium">{part.products.code}</TableCell>
                      <TableCell>{part.products.name}</TableCell>
                      <TableCell className="text-center">{part.quantity}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {part.notes || "-"}
                      </TableCell>
                      <TableCell>{part.profiles?.full_name || "Usuário"}</TableCell>
                      <TableCell>
                        {formatBelemDate(part.registered_at, "dd/MM/yyyy HH:mm")}
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Peça de Reposição"
        description="Tem certeza que deseja remover esta peça da lista de reposição? Esta ação não pode ser desfeita."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Remover"
        cancelText="Cancelar"
      />
    </>
  );
};
