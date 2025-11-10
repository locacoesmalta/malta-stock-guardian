import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Download,
  RefreshCw,
  Search,
  Package,
  Calendar,
} from "lucide-react";
import { usePredictivePurchases, PredictiveProduct } from "@/hooks/usePredictivePurchases";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const PredictivePurchases = () => {
  const { data, isLoading, refetch } = usePredictivePurchases();
  const [searchTerm, setSearchTerm] = useState("");
  const [criticalityFilter, setCriticalityFilter] = useState<string>("all");
  const [trendFilter, setTrendFilter] = useState<string>("all");

  const products = data?.products || [];
  const summary = data?.summary || {
    criticalCount: 0,
    alertCount: 0,
    growingCount: 0,
    totalEstimatedCost: 0,
  };

  // Filtrar produtos
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCriticality =
      criticalityFilter === "all" || p.criticality === criticalityFilter;
    const matchesTrend = trendFilter === "all" || p.trend === trendFilter;
    return matchesSearch && matchesCriticality && matchesTrend;
  });

  // Produtos críticos e alertas
  const criticalProducts = filteredProducts.filter(
    (p) => p.criticality === "critical"
  );
  const alertProducts = filteredProducts.filter((p) => p.criticality === "alert");
  const growingProducts = filteredProducts.filter(
    (p) => p.trend === "accelerated_growth" || p.trend === "growing"
  );

  // Produtos para sugestão de compra otimizada (críticos e alertas)
  const purchaseSuggestions = filteredProducts.filter(
    (p) => p.criticality === "critical" || p.criticality === "alert"
  );

  // Top 5 produtos para o gráfico de evolução
  const top5Products = products.slice(0, 5);

  // Preparar dados para o gráfico de evolução mensal
  const monthlyData = top5Products.length > 0
    ? top5Products[0].monthlyConsumption.map((month, idx) => {
        const dataPoint: any = { month: month.month };
        top5Products.forEach((product) => {
          dataPoint[product.name] = product.monthlyConsumption[idx]?.quantity || 0;
        });
        return dataPoint;
      })
    : [];

  // Função para exportar CSV
  const exportToCSV = () => {
    const headers = [
      "Código",
      "Nome do Produto",
      "Estoque Atual",
      "Consumo Médio/Mês",
      "Dias Restantes",
      "Criticidade",
      "Tendência",
      "Quantidade Sugerida",
      "Custo Estimado",
      "Justificativa",
    ];

    const rows = purchaseSuggestions.map((p) => [
      p.code,
      p.name,
      p.currentStock,
      p.monthlyAverage.toFixed(1),
      p.daysUntilStockout,
      p.criticality,
      p.trend,
      p.suggestedQuantity,
      p.estimatedCost.toFixed(2),
      p.justification,
    ]);

    // Adicionar linha de total
    const totalQuantity = purchaseSuggestions.reduce(
      (sum, p) => sum + p.suggestedQuantity,
      0
    );
    const totalCost = purchaseSuggestions.reduce(
      (sum, p) => sum + p.estimatedCost,
      0
    );
    rows.push([
      "",
      "TOTAL",
      "",
      "",
      "",
      "",
      "",
      totalQuantity.toString(),
      totalCost.toFixed(2),
      "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `compras-sugeridas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getCriticalityBadge = (criticality: PredictiveProduct["criticality"]) => {
    const config = {
      critical: { label: "Crítico", className: "bg-red-100 text-red-700 border-red-300" },
      alert: { label: "Alerta", className: "bg-orange-100 text-orange-700 border-orange-300" },
      attention: { label: "Atenção", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
      normal: { label: "Normal", className: "bg-green-100 text-green-700 border-green-300" },
    };
    const { label, className } = config[criticality];
    return <Badge className={className}>{label}</Badge>;
  };

  const getTrendBadge = (trend: PredictiveProduct["trend"], growthRate: number) => {
    const config = {
      accelerated_growth: {
        icon: <TrendingUp className="w-3 h-3" />,
        label: `Acelerado +${growthRate.toFixed(0)}%`,
        className: "bg-purple-100 text-purple-800",
      },
      growing: {
        icon: <TrendingUp className="w-3 h-3" />,
        label: `Crescendo +${growthRate.toFixed(0)}%`,
        className: "bg-blue-100 text-blue-800",
      },
      stable: {
        icon: <ArrowRight className="w-3 h-3" />,
        label: "Estável",
        className: "bg-gray-100 text-gray-800",
      },
      declining: {
        icon: <TrendingDown className="w-3 h-3" />,
        label: `Declínio ${growthRate.toFixed(0)}%`,
        className: "bg-slate-100 text-slate-800",
      },
    };
    const { icon, label, className } = config[trend];
    return (
      <Badge className={className}>
        {icon}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackButton />
        <div className="text-center py-8">Carregando análise preditiva...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-8 h-8" />
              Dashboard Preditivo de Compras
            </h1>
            <p className="text-muted-foreground">
              Análise inteligente dos últimos 6 meses
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.criticalCount}
            </div>
            <p className="text-xs text-muted-foreground">Ação imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.alertCount}
            </div>
            <p className="text-xs text-muted-foreground">15-30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Crescendo</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.growingCount}
            </div>
            <p className="text-xs text-muted-foreground">Tendência alta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Custo Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalEstimatedCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <p className="text-xs text-muted-foreground">Total sugerido</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Criticidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Criticidades</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="alert">Alerta</SelectItem>
                <SelectItem value="attention">Atenção</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={trendFilter} onValueChange={setTrendFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tendência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Tendências</SelectItem>
                <SelectItem value="accelerated_growth">Crescimento Acelerado</SelectItem>
                <SelectItem value="growing">Em Crescimento</SelectItem>
                <SelectItem value="stable">Estável</SelectItem>
                <SelectItem value="declining">Em Declínio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Produtos Críticos */}
      {criticalProducts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Produtos Críticos - Ação Imediata Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Dias Restantes</TableHead>
                  <TableHead>Consumo Médio/Mês</TableHead>
                  <TableHead>Tendência</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.currentStock}</TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700">
                        {product.daysUntilStockout} dias
                      </Badge>
                    </TableCell>
                    <TableCell>{product.monthlyAverage.toFixed(1)}</TableCell>
                    <TableCell>
                      {getTrendBadge(product.trend, product.growthRate)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Button size="sm" variant="default">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Comprar {product.suggestedQuantity} unids
                        </Button>
                        <div className="text-xs text-muted-foreground">
                          {product.estimatedCost.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Produtos em Crescimento */}
      {growingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Produtos com Crescimento Acelerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Tendência</TableHead>
                  <TableHead>Variação</TableHead>
                  <TableHead>Previsão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {growingProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.currentStock}</TableCell>
                    <TableCell>
                      {getTrendBadge(product.trend, product.growthRate)}
                    </TableCell>
                    <TableCell>
                      {product.firstHalfAverage.toFixed(1)} →{" "}
                      {product.secondHalfAverage.toFixed(1)}/mês
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Comprar em {product.daysUntilStockout - 15} dias</div>
                        <div className="text-muted-foreground">
                          {format(product.suggestedPurchaseDate, "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Evolução */}
      {top5Products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Consumo (6 meses) - Top 5 Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {top5Products.map((product, idx) => (
                  <Line
                    key={product.id}
                    type="monotone"
                    dataKey={product.name}
                    stroke={`hsl(${idx * 72}, 70%, 50%)`}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sugestão de Compra Otimizada */}
      {purchaseSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Sugestão de Compra Otimizada
              </CardTitle>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar Lista
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quant. Sugerida</TableHead>
                  <TableHead>Valor Estimado</TableHead>
                  <TableHead>Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseSuggestions.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {product.suggestedQuantity}
                    </TableCell>
                    <TableCell>
                      {product.estimatedCost.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {product.justification}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>TOTAL</TableCell>
                  <TableCell>
                    {purchaseSuggestions.reduce(
                      (sum, p) => sum + p.suggestedQuantity,
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {purchaseSuggestions
                      .reduce((sum, p) => sum + p.estimatedCost, 0)
                      .toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum produto encontrado com os filtros selecionados.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictivePurchases;
