import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Settings, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePricingHistory } from "@/hooks/usePricingCalculator";

export default function PricingDashboard() {
  const navigate = useNavigate();
  const { data: recentCalculations } = usePricingHistory();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Sistema de Precificação Inteligente</h1>
        <p className="text-muted-foreground">
          Calcule preços de locação considerando todos os custos operacionais e analise a viabilidade dos equipamentos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/pricing/calculator')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Calculadora de Preços
            </CardTitle>
            <CardDescription>
              Calcule o preço de locação de equipamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Acessar Calculadora</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/pricing/viability')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Análise de Viabilidade
            </CardTitle>
            <CardDescription>
              Analise se vale a pena reparar ou substituir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Analisar Equipamento</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/pricing/tax-config')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Configurações Fiscais
            </CardTitle>
            <CardDescription>
              Configure alíquotas de impostos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Configurar Impostos</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/pricing/asset-costs')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Custos Operacionais
            </CardTitle>
            <CardDescription>
              Configure custos por equipamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Gerenciar Custos</Button>
          </CardContent>
        </Card>
      </div>

      {recentCalculations && recentCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cálculos Recentes</CardTitle>
            <CardDescription>Últimos 5 cálculos de precificação realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCalculations.slice(0, 5).map((calc) => (
                <div key={calc.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">PAT: {calc.asset_code}</p>
                    <p className="text-sm text-muted-foreground">
                      {calc.rental_days} dias | {calc.location_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(calc.suggested_price)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(calc.calculation_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
