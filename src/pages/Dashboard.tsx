import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StockBadge } from "@/components/StockBadge";
import { Package, AlertTriangle, TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";
import { useProductsQuery } from "@/hooks/useProductsQuery";
import { BackButton } from "@/components/BackButton";

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: products = [], isLoading, error } = useProductsQuery();

  if (error) {
    toast.error("Erro ao carregar produtos");
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockProducts = products.filter(
    (p) => p.quantity <= p.min_quantity && p.quantity > 0
  );
  const outOfStockProducts = products.filter((p) => p.quantity <= 0);
  const totalProducts = products.length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="px-2 md:px-0 space-y-2">
        <BackButton />
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Visão geral do estoque Malta Locações
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 px-2 md:px-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{lowStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Sem Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{outOfStockProducts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mx-2 md:mx-0">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Produtos em Estoque</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm md:text-base"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-sm md:text-base text-muted-foreground">
              Carregando produtos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-sm md:text-base text-muted-foreground">
              Nenhum produto encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="font-medium text-sm md:text-base">{product.name}</div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      Código: {product.code}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <div className="text-left sm:text-right">
                      <div className="font-semibold text-sm md:text-base">{product.quantity}</div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {product.min_quantity}
                      </div>
                    </div>
                    <StockBadge
                      quantity={product.quantity}
                      minQuantity={product.min_quantity}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
