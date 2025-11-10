import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ListLoader } from "@/components/LoadingStates";

interface LowStockProduct {
  id: string;
  code: string;
  name: string;
  quantity: number;
  min_quantity: number;
}

const fetchLowStockProducts = async (): Promise<LowStockProduct[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id, code, name, quantity, min_quantity")
    .is("deleted_at", null)
    .order("quantity", { ascending: true });

  if (error) throw error;
  
  // Filtrar produtos com estoque baixo ou zerado no client
  const lowStock = (data || []).filter(p => p.quantity <= p.min_quantity);
  return lowStock.slice(0, 10);
};

export const LowStockAlerts = () => {
  const navigate = useNavigate();
  const { data: lowStockProducts, isLoading } = useQuery({
    queryKey: ["low-stock-alerts"],
    queryFn: fetchLowStockProducts,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <ListLoader items={3} />
        </CardContent>
      </Card>
    );
  }

  const criticalProducts = lowStockProducts?.filter(p => p.quantity === 0) || [];
  const lowProducts = lowStockProducts?.filter(p => p.quantity > 0) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas de Estoque
            </CardTitle>
            <CardDescription>
              {criticalProducts.length} sem estoque, {lowProducts.length} estoque baixo
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/admin/products")}
          >
            Ver Todos
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lowStockProducts && lowStockProducts.length > 0 ? (
          <div className="space-y-3">
            {lowStockProducts.map((product) => {
              const isCritical = product.quantity === 0;
              const percentage = product.min_quantity > 0 
                ? Math.round((product.quantity / product.min_quantity) * 100)
                : 0;

              return (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/products`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Package className={`h-8 w-8 ${isCritical ? 'text-destructive' : 'text-yellow-600'}`} />
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Código: {product.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-bold ${isCritical ? 'text-destructive' : 'text-yellow-600'}`}>
                        {product.quantity} un
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mín: {product.min_quantity}
                      </p>
                    </div>
                    <Badge variant={isCritical ? "destructive" : "secondary"}>
                      {isCritical ? "SEM ESTOQUE" : `${percentage}%`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum alerta de estoque baixo</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
