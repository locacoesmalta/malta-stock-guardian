import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BackButton } from "@/components/BackButton";
import { usePartsConsumptionReport } from "@/hooks/usePartsConsumptionReport";
import { Download, ChevronDown, ChevronRight, TrendingUp, Package, DollarSign, Wrench } from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const PartsConsumptionReport = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<string>(
    format(subMonths(new Date(), 6), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [expandedEquipments, setExpandedEquipments] = useState<Set<string>>(new Set());

  const { data, isLoading } = usePartsConsumptionReport({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    brandFilter: brandFilter || undefined,
    typeFilter: typeFilter || undefined,
  });

  const toggleEquipment = (assetCode: string) => {
    setExpandedEquipments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetCode)) {
        newSet.delete(assetCode);
      } else {
        newSet.add(assetCode);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    if (!data) return;

    const csvRows: string[] = [];
    
    // Cabeçalho
    csvRows.push("Fabricante,Equipamento,Modelo,PAT,Código Peça,Nome Peça,Quantidade,Custo Total,Média Mensal,Retiradas");

    // Dados
    data.equipments.forEach(equipment => {
      equipment.parts.forEach(part => {
        csvRows.push([
          equipment.manufacturer,
          equipment.equipment_name,
          equipment.model || "N/A",
          equipment.asset_code,
          part.product_code,
          part.product_name,
          part.total_quantity,
          part.total_cost.toFixed(2),
          part.monthly_average.toFixed(2),
          part.withdrawal_count,
        ].join(","));
      });
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-consumo-pecas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getConsumptionLevel = (monthlyAverage: number): { color: string; label: string } => {
    if (monthlyAverage >= 10) return { color: "text-destructive", label: "Alto" };
    if (monthlyAverage >= 5) return { color: "text-orange-500", label: "Moderado" };
    return { color: "text-green-500", label: "Baixo" };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <BackButton />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">📊 Relatório de Consumo de Peças</h1>
        <p className="text-muted-foreground">
          Análise detalhada do consumo de peças por equipamento
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-filter">Marca</Label>
              <Input
                id="brand-filter"
                placeholder="Filtrar por marca..."
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type-filter">Tipo</Label>
              <Input
                id="type-filter"
                placeholder="Filtrar por tipo..."
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button onClick={exportToCSV} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipamentos</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.total_equipments || 0}</div>
            <p className="text-xs text-muted-foreground">Com consumo no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peças Únicas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.summary.total_unique_parts || 0}</div>
            <p className="text-xs text-muted-foreground">Tipos diferentes consumidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.total_quantity.toLocaleString("pt-BR") || 0}
            </div>
            <p className="text-xs text-muted-foreground">Unidades consumidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(data?.summary.total_cost || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Em peças consumidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Peças Mais Consumidas */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Peças Mais Consumidas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.topParts || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="product_code"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.product_name}</p>
                        <p className="text-sm">Código: {payload[0].payload.product_code}</p>
                        <p className="text-sm">Quantidade: {payload[0].value}</p>
                        <p className="text-sm">
                          Custo: {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(payload[0].payload.total_cost)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="total_quantity" fill="hsl(var(--primary))" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Consumo Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Consumo Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.monthlyData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(value) => {
                  const [year, month] = value.split("-");
                  return format(new Date(parseInt(year), parseInt(month) - 1), "MMM/yy", {
                    locale: ptBR,
                  });
                }}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">
                          {format(
                            new Date(payload[0].payload.month + "-01"),
                            "MMMM 'de' yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                        <p className="text-sm">
                          Custo: {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(payload[0].value as number)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Custo Total"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada por Equipamento */}
      <Card>
        <CardHeader>
          <CardTitle>Consumo Detalhado por Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.equipments.map((equipment) => (
              <Collapsible
                key={equipment.asset_code}
                open={expandedEquipments.has(equipment.asset_code)}
                onOpenChange={() => toggleEquipment(equipment.asset_code)}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4 flex-1">
                        {expandedEquipments.has(equipment.asset_code) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div className="text-left">
                          <CardTitle className="text-lg">
                            {equipment.manufacturer} {equipment.equipment_name}{" "}
                            {equipment.model && `- ${equipment.model}`}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">PAT: {equipment.asset_code}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <p className="text-muted-foreground">Qtd Total</p>
                          <p className="font-semibold">{equipment.total_quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Custo Total</p>
                          <p className="font-semibold">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(equipment.total_cost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Peças</p>
                          <p className="font-semibold">{equipment.parts.length}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Peça</TableHead>
                            <TableHead className="text-right">Quantidade</TableHead>
                            <TableHead className="text-right">Custo Total</TableHead>
                            <TableHead className="text-right">Média/Mês</TableHead>
                            <TableHead className="text-right">Retiradas</TableHead>
                            <TableHead className="text-center">Nível</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {equipment.parts.map((part) => {
                            const level = getConsumptionLevel(part.monthly_average);
                            return (
                              <TableRow
                                key={part.product_id}
                                className="cursor-pointer hover:bg-accent/50"
                                onClick={() => navigate(`/admin/products`)}
                              >
                                <TableCell className="font-mono text-sm">{part.product_code}</TableCell>
                                <TableCell>{part.product_name}</TableCell>
                                <TableCell className="text-right font-semibold">
                                  {part.total_quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  {new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(part.total_cost)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {part.monthly_average.toFixed(1)}
                                </TableCell>
                                <TableCell className="text-right">{part.withdrawal_count}×</TableCell>
                                <TableCell className="text-center">
                                  <span className={`text-sm font-semibold ${level.color}`}>
                                    {level.label}
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartsConsumptionReport;
