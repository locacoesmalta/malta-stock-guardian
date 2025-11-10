import { useAssetsStats } from "@/hooks/useAssetsStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PageLoader } from "@/components/LoadingStates";

const COLORS = {
  liberadosLocacao: "hsl(var(--chart-1))",
  locados: "hsl(var(--chart-2))",
  emManutencao: "hsl(var(--chart-3))",
};

export const MaintenanceStatusChart = () => {
  const { data: stats, isLoading } = useAssetsStats();

  if (isLoading) {
    return <PageLoader message="Carregando status..." />;
  }

  const chartData = [
    { name: "Disponível/Liberado", value: stats?.liberadosLocacao || 0, color: COLORS.liberadosLocacao },
    { name: "Locados", value: stats?.locados || 0, color: COLORS.locados },
    { name: "Em Manutenção", value: stats?.emManutencao || 0, color: COLORS.emManutencao },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Equipamentos</CardTitle>
        <CardDescription>Distribuição atual de {stats?.total || 0} equipamentos</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
