import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StockBadge } from "@/components/StockBadge";
import { Package, AlertTriangle, TrendingUp, Search } from "lucide-react";
import { toast } from "sonner";
import { useProductsQuery } from "@/hooks/useProductsQuery";
import { BackButton } from "@/components/BackButton";
import { StockTrendChart } from "@/components/dashboard/StockTrendChart";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { MaintenanceStatusChart } from "@/components/dashboard/MaintenanceStatusChart";
import { DataNormalizationCard } from "@/components/dashboard/DataNormalizationCard";
import { ActionableDashboard } from "@/components/dashboard/ActionableDashboard";

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
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <BackButton />
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visão geral do estoque Malta Locações
        </p>
      </div>

      {/* Ações Pendentes - ONDA 1 */}
      <ActionableDashboard />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{lowStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Sem Estoque</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{outOfStockProducts.length}</div>
          </CardContent>
        </Card>

        <DataNormalizationCard />
      </div>

      {/* Novos gráficos e alertas interativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StockTrendChart />
        <MaintenanceStatusChart />
      </div>

      <LowStockAlerts />

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Produtos em Estoque</CardTitle>
          <div className="relative mt-3 sm:mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm sm:text-base"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
              Carregando produtos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-muted-foreground">
              Nenhum produto encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-4"
                >
                  <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base break-words">{product.name}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Código: {product.code}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="font-semibold text-sm sm:text-base">{product.quantity}</div>
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
