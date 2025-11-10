import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { EquipmentBrandSelector } from "@/components/EquipmentBrandSelector";
import { EquipmentTypeSelector } from "@/components/EquipmentTypeSelector";
import { EquipmentModelSelector } from "@/components/EquipmentModelSelector";
import { AlertCircle, CheckCircle2, Package } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  manufacturer: string | null;
  equipment_brand: string | null;
  equipment_type: string | null;
  equipment_model: string | null;
}

const ProductsMigration = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [compatibilityData, setCompatibilityData] = useState({
    equipment_brand: "",
    equipment_type: "",
    equipment_model: "",
    is_universal: false,
  });

  // Buscar produtos sem compatibilidade definida
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["products-without-compatibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, manufacturer, equipment_brand, equipment_type, equipment_model")
        .is("equipment_brand", null)
        .is("equipment_type", null)
        .is("equipment_model", null)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
  });

  const handleOpenDialog = (product: Product) => {
    setSelectedProduct(product);
    setCompatibilityData({
      equipment_brand: "",
      equipment_type: "",
      equipment_model: "",
      is_universal: false,
    });
    setDialogOpen(true);
  };

  const handleMarkAsUniversal = async (productId: string) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          equipment_brand: null,
          equipment_type: null,
          equipment_model: null,
        })
        .eq("id", productId);

      if (error) throw error;

      toast.success("Produto marcado como universal!");
      refetch();
    } catch (error) {
      console.error("Erro ao marcar como universal:", error);
      toast.error("Erro ao atualizar produto");
    }
  };

  const handleSaveCompatibility = async () => {
    if (!selectedProduct) return;

    if (!compatibilityData.is_universal && !compatibilityData.equipment_brand) {
      toast.error("Selecione a marca do equipamento ou marque como universal");
      return;
    }

    if (!compatibilityData.is_universal && !compatibilityData.equipment_type) {
      toast.error("Selecione o tipo de equipamento");
      return;
    }

    setUpdating(true);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          equipment_brand: compatibilityData.is_universal ? null : (compatibilityData.equipment_brand || null),
          equipment_type: compatibilityData.is_universal ? null : (compatibilityData.equipment_type || null),
          equipment_model: compatibilityData.is_universal ? null : (compatibilityData.equipment_model || null),
        })
        .eq("id", selectedProduct.id);

      if (error) throw error;

      toast.success("Compatibilidade definida com sucesso!");
      setDialogOpen(false);
      setSelectedProduct(null);
      refetch();
    } catch (error) {
      console.error("Erro ao salvar compatibilidade:", error);
      toast.error("Erro ao salvar compatibilidade");
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAllAsUniversal = async () => {
    if (products.length === 0) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja marcar todos os ${products.length} produtos como universais?`
    );

    if (!confirmed) return;

    setUpdating(true);

    try {
      const productIds = products.map((p) => p.id);

      const { error } = await supabase
        .from("products")
        .update({
          equipment_brand: null,
          equipment_type: null,
          equipment_model: null,
        })
        .in("id", productIds);

      if (error) throw error;

      toast.success(`${products.length} produtos marcados como universais!`);
      refetch();
    } catch (error) {
      console.error("Erro ao marcar produtos como universais:", error);
      toast.error("Erro ao atualizar produtos");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-2xl sm:text-3xl font-bold mt-4">Migração de Compatibilidade</h1>
            <p className="text-muted-foreground mt-2">
              Defina a compatibilidade de equipamentos para produtos existentes
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6" />
                <div>
                  <CardTitle>Produtos sem Compatibilidade</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isLoading ? "Carregando..." : `${products.length} produtos precisam de configuração`}
                  </p>
                </div>
              </div>
              {products.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsUniversal}
                  disabled={updating}
                >
                  Marcar Todos como Universais
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando produtos...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">Tudo configurado!</p>
                <p className="text-muted-foreground">
                  Todos os produtos já possuem compatibilidade definida
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{product.code}</h4>
                          <Badge variant="outline" className="text-xs">
                            {product.name}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Fabricante: {product.manufacturer || "Não informado"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsUniversal(product.id)}
                        >
                          Marcar como Universal
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                        >
                          Definir Compatibilidade
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Definir Compatibilidade</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedProduct?.code} - {selectedProduct?.name}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_universal"
                checked={compatibilityData.is_universal}
                onCheckedChange={(checked) => {
                  setCompatibilityData({
                    ...compatibilityData,
                    is_universal: checked as boolean,
                    equipment_brand: checked ? "" : compatibilityData.equipment_brand,
                    equipment_type: checked ? "" : compatibilityData.equipment_type,
                    equipment_model: checked ? "" : compatibilityData.equipment_model,
                  });
                }}
              />
              <Label htmlFor="is_universal" className="font-semibold cursor-pointer">
                Peça Universal (compatível com todos os equipamentos)
              </Label>
            </div>

            {!compatibilityData.is_universal && (
              <div className="space-y-4 pl-6 border-l-2 border-border">
                <div className="space-y-2">
                  <Label>Marca do Equipamento Compatível *</Label>
                  <EquipmentBrandSelector
                    value={compatibilityData.equipment_brand}
                    onChange={(value) =>
                      setCompatibilityData({
                        ...compatibilityData,
                        equipment_brand: value,
                        equipment_type: "",
                        equipment_model: "",
                      })
                    }
                  />
                </div>

                {compatibilityData.equipment_brand && (
                  <div className="space-y-2">
                    <Label>Tipo de Equipamento *</Label>
                    <EquipmentTypeSelector
                      brand={compatibilityData.equipment_brand}
                      value={compatibilityData.equipment_type}
                      onChange={(value) =>
                        setCompatibilityData({
                          ...compatibilityData,
                          equipment_type: value,
                          equipment_model: "",
                        })
                      }
                    />
                  </div>
                )}

                {compatibilityData.equipment_type && (
                  <div className="space-y-2">
                    <Label>Modelo Específico (opcional)</Label>
                    <EquipmentModelSelector
                      brand={compatibilityData.equipment_brand}
                      type={compatibilityData.equipment_type}
                      value={compatibilityData.equipment_model}
                      onChange={(value) =>
                        setCompatibilityData({
                          ...compatibilityData,
                          equipment_model: value,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe vazio para compatibilidade com qualquer modelo deste tipo
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedProduct(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveCompatibility} disabled={updating}>
              {updating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsMigration;
