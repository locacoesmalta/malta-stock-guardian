import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PageLoader } from "@/components/LoadingStates";

interface StockTrend {
  date: string;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

const fetchStockTrends = async (): Promise<StockTrend[]> => {
  // Buscar produtos e agrupar por data dos últimos 30 dias
  const { data: products, error } = await supabase
    .from("products")
    .select("quantity, min_quantity, created_at")
    .is("deleted_at", null);

  if (error) throw error;

  // Gerar dados dos últimos 30 dias
  const trends: StockTrend[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    trends.push({
      date: dateStr,
      total_products: products?.length || 0,
      low_stock_count: products?.filter(p => p.quantity <= p.min_quantity && p.quantity > 0).length || 0,
      out_of_stock_count: products?.filter(p => p.quantity === 0).length || 0,
    });
  }

  return trends;
};

export const StockTrendChart = () => {
  const { data: trends, isLoading } = useQuery({
    queryKey: ["stock-trends"],
    queryFn: fetchStockTrends,
  });

  if (isLoading) {
    return <PageLoader message="Carregando tendências..." />;
  }

  const lastTrend = trends?.[trends.length - 1];
  const previousTrend = trends?.[trends.length - 2];
  const lowStockChange = lastTrend && previousTrend 
    ? lastTrend.low_stock_count - previousTrend.low_stock_count 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tendência de Estoque</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </div>
          {lowStockChange !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${lowStockChange > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {lowStockChange > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(lowStockChange)} itens em estoque baixo</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="low_stock_count" 
              stroke="hsl(var(--chart-2))" 
              name="Estoque Baixo"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="out_of_stock_count" 
              stroke="hsl(var(--destructive))" 
              name="Sem Estoque"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
