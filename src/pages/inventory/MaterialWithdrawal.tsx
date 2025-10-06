import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { ProductSelector } from "@/components/ProductSelector";
import { useConfirm } from "@/hooks/useConfirm";
import { useProducts } from "@/hooks/useProducts";
import { withdrawalSchema } from "@/lib/validations";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { formatPAT } from "@/lib/patUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";


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
  const { products } = useProducts();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().split('T')[0]);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [equipmentCode, setEquipmentCode] = useState("");
  const [workSite, setWorkSite] = useState("");
  const [company, setCompany] = useState("");
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [equipmentName, setEquipmentName] = useState("");

  // Buscar informações do equipamento pelo PAT
  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(equipmentCode);

  // Preencher informações automaticamente quando o equipamento for encontrado
  useEffect(() => {
    if (equipment) {
      setEquipmentName(equipment.equipment_name);
      
      // Priorizar LOCAÇÃO primeiro, depois MANUTENÇÃO
      if (equipment.location_type === "LOCAÇÃO") {
        if (equipment.rental_company) {
          setCompany(equipment.rental_company);
        }
        if (equipment.rental_work_site) {
          setWorkSite(equipment.rental_work_site);
        }
      } else if (equipment.location_type === "MANUTENÇÃO") {
        if (equipment.maintenance_company) {
          setCompany(equipment.maintenance_company);
        }
        if (equipment.maintenance_work_site) {
          setWorkSite(equipment.maintenance_work_site);
        }
      }
      // Se não tiver locação ou manutenção ativas, deixa os campos vazios para preenchimento manual
    } else if (!equipmentCode) {
      // Limpa os campos se o PAT for apagado
      setEquipmentName("");
      setWorkSite("");
      setCompany("");
    }
  }, [equipment, equipmentCode]);

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

    // Validar se o PAT é válido
    const formattedPAT = formatPAT(equipmentCode);
    if (!formattedPAT) {
      toast.error("PAT inválido! O PAT deve conter apenas números (máximo 6 dígitos).");
      return;
    }

    // Validar se o equipamento existe
    if (!equipment) {
      toast.error("Equipamento não encontrado! Verifique o PAT digitado.");
      return;
    }

    if (!workSite || !company) {
      toast.error("Preencha todos os campos obrigatórios: Obra e Empresa!");
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

    const confirmed = await confirm({
      title: "Confirmar Retirada",
      description: `Confirma a retirada de ${items.length} ${items.length === 1 ? 'produto' : 'produtos'}? O estoque será atualizado automaticamente.`,
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const withdrawals = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        withdrawn_by: user?.id,
        withdrawal_reason: withdrawalReason,
        withdrawal_date: withdrawalDate,
        equipment_code: formattedPAT,
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
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Retirada de Material</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Registre a saída de produtos do estoque</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Informações da Retirada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment" className="text-xs sm:text-sm">PAT do Equipamento * (6 dígitos)</Label>
                <div className="relative">
                  <Input
                    id="equipment"
                    type="text"
                    value={equipmentCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove não-números
                      if (value.length <= 6) {
                        setEquipmentCode(value);
                      }
                      if (!value) {
                        setEquipmentName("");
                        setWorkSite("");
                        setCompany("");
                      }
                    }}
                    onBlur={(e) => {
                      const formatted = formatPAT(e.target.value);
                      if (formatted) {
                        setEquipmentCode(formatted);
                      }
                    }}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="text-sm font-mono"
                  />
                  {loadingEquipment && equipmentCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
                {equipmentCode && !loadingEquipment && (
                  equipment ? (
                    <Alert className="mt-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                        Equipamento encontrado: {equipment.equipment_name}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="mt-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                        Equipamento não encontrado. Verifique o PAT.
                      </AlertDescription>
                    </Alert>
                  )
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workSite" className="text-xs sm:text-sm">Obra *</Label>
                <Input
                  id="workSite"
                  type="text"
                  value={workSite}
                  onChange={(e) => setWorkSite(e.target.value)}
                  placeholder="Digite a obra"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs sm:text-sm">Empresa *</Label>
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Digite a empresa"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs sm:text-sm">Data da Retirada *</Label>
                <Input
                  id="date"
                  type="date"
                  value={withdrawalDate}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs sm:text-sm">Motivo da Retirada</Label>
              <Textarea
                id="reason"
                rows={3}
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="Descreva o motivo da retirada..."
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Produtos</CardTitle>
            <Button type="button" onClick={addItem} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-sm sm:text-base text-muted-foreground py-8">
                Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
              </p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm sm:text-base">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Produto *</Label>
                      <ProductSelector
                        products={products}
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, "product_id", value)}
                        showStock={true}
                        required={true}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Quantidade *</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(index, "quantity", Math.max(1, item.quantity - 1))}
                          className="flex-shrink-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.availableQuantity}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          className="text-center text-sm"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(index, "quantity", Math.min(item.availableQuantity, item.quantity + 1))}
                          className="flex-shrink-0"
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

        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="text-xs sm:text-sm"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || items.length === 0} className="text-xs sm:text-sm">
            {loading ? "Salvando..." : "Registrar Retirada"}
          </Button>
        </div>
      </form>

      <ConfirmDialog />
    </div>
  );
};

export default MaterialWithdrawal;
