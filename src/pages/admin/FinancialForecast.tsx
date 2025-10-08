import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useFinancialProducts } from "@/hooks/useFinancialProducts";
import { useFinancialAssets } from "@/hooks/useFinancialAssets";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Package, Wrench, DollarSign, AlertCircle, Printer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import "@/styles/financial-print.css";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function FinancialForecast() {
  const [selectedProductManufacturer, setSelectedProductManufacturer] = useState<string>("all");
  const [selectedAssetManufacturer, setSelectedAssetManufacturer] = useState<string>("all");

  const { 
    data: productsData, 
    isLoading: productsLoading 
  } = useFinancialProducts(selectedProductManufacturer);

  const { 
    data: assetsData, 
    isLoading: assetsLoading 
  } = useFinancialAssets(selectedAssetManufacturer);

  if (productsLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  const hasProductSalePrices = productsData?.summary.totalSaleValue && productsData.summary.totalSaleValue > 0;

  // Preparar dados para gráfico comparativo (top 10 fabricantes)
  const allManufacturers = Array.from(
    new Set([
      ...(productsData?.byManufacturer.map(p => p.manufacturer) || []),
      ...(assetsData?.byManufacturer.map(a => a.manufacturer) || []),
    ])
  );

  const comparativeData = allManufacturers.slice(0, 10).map(manufacturer => {
    const productData = productsData?.byManufacturer.find(p => p.manufacturer === manufacturer);
    const assetData = assetsData?.byManufacturer.find(a => a.manufacturer === manufacturer);

    return {
      manufacturer: manufacturer.length > 15 ? manufacturer.substring(0, 15) + '...' : manufacturer,
      compra: productData?.stockValue || 0,
      venda: productData?.saleValue || 0,
      patrimonio: assetData?.totalValue || 0,
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start print:block">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 print:hidden" />
            Previsão Financeira
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise de valores em estoque, venda e patrimônio de equipamentos
          </p>
          <p className="text-xs text-muted-foreground mt-1 print:block hidden">
            Gerado em: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Relatório
        </Button>
      </div>

      {/* SEÇÃO 1: PEÇAS E BENS DE CONSUMO */}
      <div className="space-y-4 page-break-before">
        <div className="flex items-center justify-between print:block">
          <h2 className="text-2xl font-semibold flex items-center gap-2 print:text-xl">
            <Package className="h-6 w-6 print:hidden" />
            Peças e Bens de Consumo
          </h2>
          <Select value={selectedProductManufacturer} onValueChange={setSelectedProductManufacturer}>
            <SelectTrigger className="w-[250px] print:hidden">
              <SelectValue placeholder="Selecione o fabricante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Fabricantes</SelectItem>
              {productsData?.manufacturers.map((manufacturer) => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!hasProductSalePrices && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum produto possui preço de venda cadastrado. Os valores de venda potencial não podem ser calculados.
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de Resumo - Produtos */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valores em Estoque</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(productsData?.summary.totalStockValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em preço de compra
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valores de Venda Potencial</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(productsData?.summary.totalSaleValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseado em preço de venda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem Potencial</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(productsData?.summary.totalMargin || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Diferença entre venda e compra
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Barras - Produtos */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Comparação: Estoque vs Venda Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={productsData?.byManufacturer || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="manufacturer" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="stockValue" fill="#0088FE" name="Valor em Estoque" />
                <Bar dataKey="saleValue" fill="#00C49F" name="Valor de Venda" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela Detalhada - Produtos */}
        <Card className="page-break-inside-avoid">
          <CardHeader>
            <CardTitle className="print:text-lg">Detalhamento por Fabricante</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fabricante</TableHead>
                  <TableHead className="text-right">Qtd Produtos</TableHead>
                  <TableHead className="text-right">Valor em Estoque</TableHead>
                  <TableHead className="text-right">Valor de Venda</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsData?.byManufacturer.map((item) => (
                  <TableRow key={item.manufacturer}>
                    <TableCell className="font-medium">{item.manufacturer}</TableCell>
                    <TableCell className="text-right">{item.productCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.stockValue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.saleValue)}</TableCell>
                    <TableCell className="text-right">
                      <span className={item.margin >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(item.margin)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 2: PATRIMÔNIO (EQUIPAMENTOS) */}
      <div className="space-y-4 page-break-before">
        <div className="flex items-center justify-between print:block">
          <h2 className="text-2xl font-semibold flex items-center gap-2 print:text-xl">
            <Wrench className="h-6 w-6 print:hidden" />
            Patrimônio (Equipamentos)
          </h2>
          <Select value={selectedAssetManufacturer} onValueChange={setSelectedAssetManufacturer}>
            <SelectTrigger className="w-[250px] print:hidden">
              <SelectValue placeholder="Selecione o fabricante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Fabricantes</SelectItem>
              {assetsData?.manufacturers.map((manufacturer) => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cards de Resumo - Equipamentos */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total em Equipamentos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(assetsData?.summary.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Soma dos valores unitários
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assetsData?.summary.totalAssets || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Com valor cadastrado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(assetsData?.summary.averageValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por equipamento
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Pizza - Equipamentos */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Distribuição do Valor Patrimonial</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={assetsData?.byManufacturer || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ manufacturer, percentage }) => `${manufacturer}: ${percentage.toFixed(1)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="totalValue"
                >
                  {assetsData?.byManufacturer.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabela Detalhada - Equipamentos */}
        <Card className="page-break-inside-avoid">
          <CardHeader>
            <CardTitle className="print:text-lg">Detalhamento por Fabricante</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fabricante</TableHead>
                  <TableHead className="text-right">Qtd Equipamentos</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Valor Médio</TableHead>
                  <TableHead className="text-right">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetsData?.byManufacturer.map((item) => (
                  <TableRow key={item.manufacturer}>
                    <TableCell className="font-medium">{item.manufacturer}</TableCell>
                    <TableCell className="text-right">{item.assetCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalValue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.averageValue)}</TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: ANÁLISE VISUAL COMPARATIVA */}
      <div className="space-y-4 print:hidden">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Análise Visual Comparativa
        </h2>

        <Card>
          <CardHeader>
            <CardTitle>Comparação: Produtos vs Patrimônio (Top 10 Fabricantes)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={comparativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="manufacturer" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="compra" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="Valor de Compra (Produtos)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="venda" 
                  stroke="#00C49F" 
                  strokeWidth={2}
                  name="Valor de Venda (Produtos)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="patrimonio" 
                  stroke="#FF8042" 
                  strokeWidth={2}
                  name="Valor Patrimonial (Equipamentos)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
