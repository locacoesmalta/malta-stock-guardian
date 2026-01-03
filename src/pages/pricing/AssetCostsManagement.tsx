import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATSearchInput, AssetForPricing } from "@/components/pricing/PATSearchInput";
import { formatPAT } from "@/lib/patUtils";

export default function AssetCostsManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedAsset, setSelectedAsset] = useState<AssetForPricing | null>(null);
  const [formData, setFormData] = useState({
    depreciation_months: 36,
    monthly_maintenance_cost: 150,
    operational_cost_per_hour: 5,
    transport_cost_per_km: 2.5,
    employee_cost_per_day: 150,
    profit_margin_percentage: 30,
    corrective_maintenance_margin: 15,
  });

  const { data: existingCosts } = useQuery({
    queryKey: ["asset-costs", selectedAsset?.asset_code],
    queryFn: async () => {
      if (!selectedAsset) return null;
      const normalizedPAT = formatPAT(selectedAsset.asset_code);
      if (!normalizedPAT) return null;
      
      const { data, error } = await supabase
        .from("pricing_asset_costs")
        .select("*")
        .eq("asset_code", normalizedPAT)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!selectedAsset,
  });

  useEffect(() => {
    if (existingCosts) {
      setFormData({
        depreciation_months: existingCosts.depreciation_months,
        monthly_maintenance_cost: Number(existingCosts.monthly_maintenance_cost),
        operational_cost_per_hour: Number(existingCosts.operational_cost_per_hour),
        transport_cost_per_km: Number(existingCosts.transport_cost_per_km),
        employee_cost_per_day: Number(existingCosts.employee_cost_per_day),
        profit_margin_percentage: Number(existingCosts.profit_margin_percentage),
        corrective_maintenance_margin: Number(existingCosts.corrective_maintenance_margin),
      });
    }
  }, [existingCosts]);

  const saveCosts = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!selectedAsset) throw new Error("Nenhum equipamento selecionado");
      const normalizedPAT = formatPAT(selectedAsset.asset_code);
      if (!normalizedPAT) throw new Error("PAT inválido");
      
      const { data: result, error } = await supabase
        .from("pricing_asset_costs")
        .upsert({
          asset_code: normalizedPAT,
          ...data,
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-costs"] });
      toast({
        title: "Custos salvos!",
        description: "Os custos operacionais foram salvos com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!selectedAsset) {
      toast({
        title: "Erro",
        description: "Selecione um equipamento primeiro",
        variant: "destructive",
      });
      return;
    }
    saveCosts.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pricing')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Custos Operacionais</h1>
          <p className="text-muted-foreground">
            Configure os custos operacionais de cada equipamento
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Equipamento</CardTitle>
          <CardDescription>Digite o PAT do equipamento para configurar seus custos</CardDescription>
        </CardHeader>
        <CardContent>
          <PATSearchInput onAssetSelect={setSelectedAsset} />
        </CardContent>
      </Card>

      {selectedAsset && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedAsset.equipment_name}</CardTitle>
            <CardDescription>PAT: {selectedAsset.asset_code} | {selectedAsset.manufacturer}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="depreciation_months">Vida Útil (meses)</Label>
                <Input
                  id="depreciation_months"
                  type="number"
                  value={formData.depreciation_months}
                  onChange={(e) => setFormData({ ...formData, depreciation_months: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Tempo estimado até depreciação total</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_maintenance_cost">Custo de Manutenção Mensal (R$)</Label>
                <Input
                  id="monthly_maintenance_cost"
                  type="number"
                  step="0.01"
                  value={formData.monthly_maintenance_cost}
                  onChange={(e) => setFormData({ ...formData, monthly_maintenance_cost: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Custo médio mensal de manutenção preventiva</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operational_cost_per_hour">Custo Operacional por Hora (R$)</Label>
                <Input
                  id="operational_cost_per_hour"
                  type="number"
                  step="0.01"
                  value={formData.operational_cost_per_hour}
                  onChange={(e) => setFormData({ ...formData, operational_cost_per_hour: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Combustível ou energia elétrica por hora</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transport_cost_per_km">Custo de Transporte por KM (R$)</Label>
                <Input
                  id="transport_cost_per_km"
                  type="number"
                  step="0.01"
                  value={formData.transport_cost_per_km}
                  onChange={(e) => setFormData({ ...formData, transport_cost_per_km: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Custo por quilômetro rodado</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_cost_per_day">Custo Diário de Funcionário (R$)</Label>
                <Input
                  id="employee_cost_per_day"
                  type="number"
                  step="0.01"
                  value={formData.employee_cost_per_day}
                  onChange={(e) => setFormData({ ...formData, employee_cost_per_day: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Diária do operador (se aplicável)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profit_margin_percentage">Margem de Lucro Padrão (%)</Label>
                <Input
                  id="profit_margin_percentage"
                  type="number"
                  step="0.1"
                  value={formData.profit_margin_percentage}
                  onChange={(e) => setFormData({ ...formData, profit_margin_percentage: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Margem de lucro padrão para este equipamento</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corrective_maintenance_margin">Margem para Manutenção Corretiva (%)</Label>
                <Input
                  id="corrective_maintenance_margin"
                  type="number"
                  step="0.1"
                  value={formData.corrective_maintenance_margin}
                  onChange={(e) => setFormData({ ...formData, corrective_maintenance_margin: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">Margem aplicada em manutenções corretivas</p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saveCosts.isPending} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {saveCosts.isPending ? "Salvando..." : existingCosts ? "Atualizar Custos" : "Salvar Custos"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
