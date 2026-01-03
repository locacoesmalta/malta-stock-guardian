import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PATSearchInput, type AssetForPricing } from "./PATSearchInput";
import { usePricingCalculator } from "@/hooks/usePricingCalculator";
import { toast } from "@/hooks/use-toast";
import type { PricingCalculationInput, PricingCalculationResultExtended } from "@/types/pricing";
import { Calculator, Save, TrendingUp } from "lucide-react";

export const PricingCalculatorForm = () => {
  // Estados do formulário
  const [selectedAsset, setSelectedAsset] = useState<AssetForPricing | null>(null);
  const [locationType, setLocationType] = useState<'belem' | 'interior_para' | 'outros_estados'>('belem');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [rentalDays, setRentalDays] = useState<number>(15);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [includeEmployee, setIncludeEmployee] = useState<boolean>(false);
  const [employeeCost, setEmployeeCost] = useState<number>(0);

  // Estado do resultado
  const [calculationResult, setCalculationResult] = useState<PricingCalculationResultExtended | null>(null);
  const [lastInput, setLastInput] = useState<PricingCalculationInput | null>(null);

  const { calculatePricing, saveCalculation } = usePricingCalculator();

  const handleCalculate = async () => {
    if (!selectedAsset) {
      toast({ 
        title: "Atenção", 
        description: "Selecione um equipamento pelo PAT", 
        variant: "destructive" 
      });
      return;
    }

    const input: PricingCalculationInput = {
      asset_code: selectedAsset.asset_code,
      location_type: locationType,
      distance_km: distanceKm,
      rental_days: rentalDays,
      custom_profit_margin: profitMargin,
      employee_cost: employeeCost,
      include_employee: includeEmployee,
    };

    setLastInput(input);
    
    try {
      const result = await calculatePricing.mutateAsync(input);
      setCalculationResult(result);
    } catch (error) {
      // Toast já exibido pelo hook
    }
  };

  const handleSave = async () => {
    if (!calculationResult || !lastInput) return;

    try {
      await saveCalculation.mutateAsync({
        calculation: calculationResult,
        input: lastInput,
      });
    } catch (error) {
      // Toast já exibido pelo hook
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formulário de Entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Precificação
          </CardTitle>
          <CardDescription>
            Calcule o preço de locação considerando todos os custos operacionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca por PAT */}
          <PATSearchInput onAssetSelect={setSelectedAsset} />

          {selectedAsset && (
            <>
              <Separator />

              {/* Localização */}
              <div className="space-y-2">
                <Label htmlFor="location-type">Localização da Locação</Label>
                <Select 
                  value={locationType} 
                  onValueChange={(value: 'belem' | 'interior_para' | 'outros_estados') => setLocationType(value)}
                >
                  <SelectTrigger id="location-type">
                    <SelectValue placeholder="Selecione a localização" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belem">Belém</SelectItem>
                    <SelectItem value="interior_para">Interior do Pará</SelectItem>
                    <SelectItem value="outros_estados">Outros Estados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Distância */}
              <div className="space-y-2">
                <Label htmlFor="distance">Distância (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  min="0"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              {/* Dias de Locação */}
              <div className="space-y-2">
                <Label htmlFor="rental-days">Dias de Locação</Label>
                <Input
                  id="rental-days"
                  type="number"
                  min="1"
                  value={rentalDays}
                  onChange={(e) => setRentalDays(Number(e.target.value))}
                  placeholder="15"
                />
              </div>

              {/* Margem de Lucro */}
              <div className="space-y-2">
                <Label htmlFor="profit-margin">Margem de Lucro (%)</Label>
                <Input
                  id="profit-margin"
                  type="number"
                  min="0"
                  max="100"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(Number(e.target.value))}
                  placeholder="30"
                />
              </div>

              {/* Incluir Funcionário */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-employee"
                  checked={includeEmployee}
                  onCheckedChange={(checked) => setIncludeEmployee(checked as boolean)}
                />
                <Label htmlFor="include-employee" className="cursor-pointer">
                  Incluir custo de funcionário
                </Label>
              </div>

              {includeEmployee && (
                <div className="space-y-2">
                  <Label htmlFor="employee-cost">Custo Diário do Funcionário (R$)</Label>
                  <Input
                    id="employee-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={employeeCost}
                    onChange={(e) => setEmployeeCost(Number(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              )}

              <Button 
                onClick={handleCalculate} 
                className="w-full"
                disabled={calculatePricing.isPending}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {calculatePricing.isPending ? "Calculando..." : "Calcular Preço"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Resultado do Cálculo */}
      {calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resultado do Cálculo
            </CardTitle>
            <CardDescription>
              {calculationResult.equipment_name} - PAT: {calculationResult.asset_code}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Custos Detalhados */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Custos Operacionais:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>Depreciação:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.depreciation_cost)}</p>
                
                <p>Manutenção:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.maintenance_cost)}</p>
                
                <p>Transporte:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.transport_cost)}</p>
                
                <p>Operacional:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.operational_cost)}</p>
                
                {calculationResult.employee_cost > 0 && (
                  <>
                    <p>Funcionário:</p>
                    <p className="text-right font-medium">{formatCurrency(calculationResult.employee_cost)}</p>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Impostos */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Impostos:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p>ISS:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.tax_iss)}</p>
                
                <p>PIS:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.tax_pis)}</p>
                
                <p>COFINS:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.tax_cofins)}</p>
                
                <p>CSLL:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.tax_csll)}</p>
                
                <p>IRPJ:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.tax_irpj)}</p>
                
                <p className="font-medium">Total Impostos:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.tax_total)}</p>
              </div>
            </div>

            <Separator />

            {/* Totais */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="font-medium">Custo Total:</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.total_cost)}</p>
                
                <p>Margem de Lucro ({calculationResult.profit_margin_percentage}%):</p>
                <p className="text-right font-medium">{formatCurrency(calculationResult.profit_amount)}</p>
              </div>
            </div>

            <Separator />

            {/* Preço Sugerido */}
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Preço Sugerido:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(calculationResult.suggested_price)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Para {rentalDays} dias de locação
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              variant="outline" 
              className="w-full"
              disabled={saveCalculation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveCalculation.isPending ? "Salvando..." : "Salvar Cálculo no Histórico"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
