import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ProductSelector } from "@/components/ProductSelector";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import { useProducts } from "@/hooks/useProducts";
import { withdrawalSchema } from "@/lib/validations";


interface WithdrawalItem {
  product_id: string;
  quantity: number;
  productName: string;
  productCode: string;
  availableQuantity: number;
}

const MaterialWithdrawal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, loading: loadingProducts } = useProducts();
  const { isOpen, confirm, handleConfirm, handleCancel, options } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [equipmentCode, setEquipmentCode] = useState("");
  const [workSite, setWorkSite] = useState("");
  const [company, setCompany] = useState("");
  const [items, setItems] = useState<WithdrawalItem[]>([]);

  const addItem = () => {
    setItems([...items, {
      product_id: "",
      quantity: 1,
      productName: "",
      productCode: "",
      availableQuantity: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof WithdrawalItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].productCode = product.code;
        newItems[index].availableQuantity = product.quantity;
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!equipmentCode || !workSite || !company) {
      toast.error("Preencha todos os campos obrigatórios: PAT do Equipamento, Obra e Empresa!");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item!");
      return;
    }

    // Validate each item
    const invalidItems = items.filter(
      item => !item.product_id || item.quantity <= 0 || item.quantity > item.availableQuantity
    );

    if (invalidItems.length > 0) {
      toast.error("Verifique os itens: quantidades inválidas ou superiores ao estoque disponível!");
      return;
    }

    // Validate with Zod
    const validationErrors: string[] = [];
    items.forEach((item, index) => {
      const validation = withdrawalSchema.safeParse({
        product_id: item.product_id,
        quantity: item.quantity,
        withdrawal_date: withdrawalDate,
        withdrawal_reason: withdrawalReason,
      });
      
      if (!validation.success) {
        validationErrors.push(`Item ${index + 1}: ${validation.error.errors[0].message}`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    confirm({
      title: "Confirmar Retirada",
      description: `Confirma a retirada de ${items.length} ${items.length === 1 ? 'produto' : 'produtos'}? O estoque será atualizado automaticamente.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          const withdrawals = items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            withdrawn_by: user?.id,
            withdrawal_reason: withdrawalReason,
            withdrawal_date: withdrawalDate,
            equipment_code: equipmentCode,
            work_site: workSite,
            company: company
          }));

          const { error } = await supabase
            .from("material_withdrawals")
            .insert(withdrawals);

          if (error) throw error;

          toast.success("Retirada de material registrada com sucesso!");
          navigate("/inventory/history");
        } catch (error: any) {
          toast.error(error.message || "Erro ao registrar retirada");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Retirada de Material</h1>
        <p className="text-muted-foreground">Registre a saída de produtos do estoque</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Retirada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment">PAT do Equipamento *</Label>
                <Input
                  id="equipment"
                  type="text"
                  value={equipmentCode}
                  onChange={(e) => setEquipmentCode(e.target.value)}
                  placeholder="Digite o PAT do equipamento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workSite">Obra *</Label>
                <Input
                  id="workSite"
                  type="text"
                  value={workSite}
                  onChange={(e) => setWorkSite(e.target.value)}
                  placeholder="Digite a obra"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Digite a empresa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data da Retirada *</Label>
                <Input
                  id="date"
                  type="date"
                  value={withdrawalDate}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Retirada</Label>
              <Textarea
                id="reason"
                rows={3}
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="Descreva o motivo da retirada..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produtos</CardTitle>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
              </p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Produto *</Label>
                      <ProductSelector
                        products={products}
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, "product_id", value)}
                        showStock={true}
                        required={true}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantidade *</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(index, "quantity", Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.availableQuantity}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          className="text-center"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(index, "quantity", Math.min(item.availableQuantity, item.quantity + 1))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.product_id && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Estoque atual: {item.availableQuantity}
                          </p>
                          <p className="text-xs font-medium text-warning">
                            Após retirada: {item.availableQuantity - item.quantity}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || items.length === 0}>
            {loading ? "Salvando..." : "Registrar Retirada"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={() => {}}
        title={options?.title || ""}
        description={options?.description || ""}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default MaterialWithdrawal;
