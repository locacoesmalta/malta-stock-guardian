import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { StockBadge } from "@/components/StockBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import { useProducts } from "@/hooks/useProducts";
import { productSchema } from "@/lib/validations";

interface Product {
  id: string;
  code: string;
  name: string;
  quantity: number;
  min_quantity: number;
  purchase_price: number | null;
  sale_price: number | null;
}

const Products = () => {
  const { user } = useAuth();
  const { products, loading, searchTerm, setSearchTerm, refetch } = useProducts();
  const { isOpen, confirm, handleConfirm, handleCancel, options } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    quantity: 0,
    min_quantity: 0,
    purchase_price: "",
    sale_price: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const productData = {
      code: formData.code,
      name: formData.name,
      quantity: Number(formData.quantity),
      min_quantity: Number(formData.min_quantity),
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
    };

    // Validate with Zod
    const validation = productSchema.safeParse(productData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Por favor, corrija os erros no formulário");
      return;
    }

    setSubmitting(true);

    try {
      const dataToSave = { ...productData, created_by: user?.id };
      
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(dataToSave)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("products")
          .insert([dataToSave]);

        if (error) throw error;
        toast.success("Produto cadastrado com sucesso!");
      }

      setOpen(false);
      setEditingProduct(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    confirm({
      title: "Excluir Produto",
      description: `Tem certeza que deseja excluir o produto "${name}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

          if (error) throw error;
          toast.success("Produto excluído com sucesso!");
          refetch();
        } catch (error: any) {
          toast.error("Erro ao excluir produto");
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      quantity: 0,
      min_quantity: 0,
      purchase_price: "",
      sale_price: "",
    });
    setErrors({});
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      quantity: product.quantity,
      min_quantity: product.min_quantity,
      purchase_price: product.purchase_price?.toString() || "",
      sale_price: product.sale_price?.toString() || "",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Produtos</h1>
          <p className="text-muted-foreground">Cadastre e gerencie os produtos do estoque</p>
        </div>
        <Dialog open={open} onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setEditingProduct(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Produto *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Quantidade Mínima *</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    min="0"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Preço de Compra (R$)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : editingProduct ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produtos Cadastrados</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando produtos...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto cadastrado
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Código: {product.code}
                    </div>
                    {(product.purchase_price || product.sale_price) && (
                      <div className="text-sm space-x-4">
                        {product.purchase_price && (
                          <span className="text-muted-foreground">
                            Compra: R$ {product.purchase_price.toFixed(2)}
                          </span>
                        )}
                        {product.sale_price && (
                          <span className="text-muted-foreground">
                            Venda: R$ {product.sale_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{product.quantity}</div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {product.min_quantity}
                      </div>
                    </div>
                    <StockBadge
                      quantity={product.quantity}
                      minQuantity={product.min_quantity}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={() => {}}
        title={options?.title || ""}
        description={options?.description || ""}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Products;
