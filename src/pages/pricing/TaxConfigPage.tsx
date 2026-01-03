import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { PricingTaxConfig } from "@/types/pricing";

type EditingConfig = {
  id: string;
  iss_rate: number;
  pis_rate: number;
  cofins_rate: number;
  csll_rate: number;
  irpj_rate: number;
};

export default function TaxConfigPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<EditingConfig | null>(null);

  const { data: taxConfigs, isLoading } = useQuery({
    queryKey: ["tax-configs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_tax_config")
        .select("*")
        .eq("is_active", true)
        .order("location_type");
      if (error) throw error;
      return data as PricingTaxConfig[];
    },
  });

  const updateTaxConfig = useMutation({
    mutationFn: async (config: EditingConfig) => {
      const { data, error } = await supabase
        .from("pricing_tax_config")
        .update({
          iss_rate: config.iss_rate,
          pis_rate: config.pis_rate,
          cofins_rate: config.cofins_rate,
          csll_rate: config.csll_rate,
          irpj_rate: config.irpj_rate,
        })
        .eq("id", config.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-configs"] });
      toast({
        title: "Configuração atualizada!",
        description: "As alíquotas foram atualizadas com sucesso.",
      });
      setEditingConfig(null);
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar as alíquotas.",
        variant: "destructive",
      });
    },
  });

  const handleSave = (config: EditingConfig) => {
    updateTaxConfig.mutate(config);
  };

  const locationNames: Record<string, string> = {
    belem: "Belém",
    interior_para: "Interior do Pará",
    outros_estados: "Outros Estados",
  };

  const startEditing = (config: PricingTaxConfig) => {
    setEditingConfig({
      id: config.id,
      iss_rate: config.iss_rate,
      pis_rate: config.pis_rate,
      cofins_rate: config.cofins_rate,
      csll_rate: config.csll_rate,
      irpj_rate: config.irpj_rate,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pricing')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Configurações Fiscais</h1>
          <p className="text-muted-foreground">
            Configure as alíquotas de impostos por localização
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taxConfigs?.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <CardTitle>{locationNames[config.location_type] || config.location_type}</CardTitle>
              <CardDescription>Alíquotas aplicáveis para esta localização</CardDescription>
            </CardHeader>
            <CardContent>
              {editingConfig?.id === config.id ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <Label htmlFor="iss">ISS (%)</Label>
                      <Input
                        id="iss"
                        type="number"
                        step="0.01"
                        value={editingConfig.iss_rate}
                        onChange={(e) => setEditingConfig({ ...editingConfig, iss_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pis">PIS (%)</Label>
                      <Input
                        id="pis"
                        type="number"
                        step="0.01"
                        value={editingConfig.pis_rate}
                        onChange={(e) => setEditingConfig({ ...editingConfig, pis_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cofins">COFINS (%)</Label>
                      <Input
                        id="cofins"
                        type="number"
                        step="0.01"
                        value={editingConfig.cofins_rate}
                        onChange={(e) => setEditingConfig({ ...editingConfig, cofins_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="csll">CSLL (%)</Label>
                      <Input
                        id="csll"
                        type="number"
                        step="0.01"
                        value={editingConfig.csll_rate}
                        onChange={(e) => setEditingConfig({ ...editingConfig, csll_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="irpj">IRPJ (%)</Label>
                      <Input
                        id="irpj"
                        type="number"
                        step="0.01"
                        value={editingConfig.irpj_rate}
                        onChange={(e) => setEditingConfig({ ...editingConfig, irpj_rate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSave(editingConfig)} disabled={updateTaxConfig.isPending}>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingConfig(null)}>
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">ISS</p>
                      <p className="font-medium">{config.iss_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PIS</p>
                      <p className="font-medium">{config.pis_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">COFINS</p>
                      <p className="font-medium">{config.cofins_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CSLL</p>
                      <p className="font-medium">{config.csll_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">IRPJ</p>
                      <p className="font-medium">{config.irpj_rate}%</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => startEditing(config)}>
                    Editar Alíquotas
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
