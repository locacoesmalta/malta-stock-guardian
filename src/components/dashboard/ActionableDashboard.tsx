import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertCircle,
  Clock,
  Package,
  Wrench,
  FileText,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { formatPAT } from "@/lib/patUtils";

interface ActionableItem {
  id: string;
  title: string;
  count: number;
  urgency: "high" | "medium" | "low";
  icon: any;
  action: () => void;
  details?: string[];
}

export const ActionableDashboard = () => {
  const navigate = useNavigate();

  // Buscar peças pendentes (sem relatório)
  const { data: pendingParts = [] } = useQuery({
    queryKey: ["pending-parts-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_withdrawals_with_remaining")
        .select("equipment_code, products(name, code), remaining_quantity")
        .eq("is_archived", false)
        .gt("remaining_quantity", 0)
        .order("withdrawal_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Buscar produtos com estoque baixo
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, code, quantity, min_quantity")
        .is("deleted_at", null)
        .order("quantity", { ascending: true });

      if (error) throw error;
      return (data || []).filter((p) => p.quantity <= p.min_quantity && p.quantity > 0);
    },
    refetchInterval: 30000,
  });

  // Buscar produtos sem estoque
  const { data: outOfStockProducts = [] } = useQuery({
    queryKey: ["out-of-stock-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, code, min_quantity")
        .is("deleted_at", null)
        .lte("quantity", 0)
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Buscar manutenções pendentes (equipamentos em manutenção há mais de 7 dias)
  const { data: overdueMaintenance = [] } = useQuery({
    queryKey: ["overdue-maintenance"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_code, equipment_name, maintenance_arrival_date")
        .eq("location_type", "manutencao")
        .is("deleted_at", null)
        .lt("maintenance_arrival_date", sevenDaysAgo.toISOString())
        .order("maintenance_arrival_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Agrupar peças pendentes por equipamento
  const groupedPendingParts = pendingParts.reduce((acc, item) => {
    const pat = formatPAT(item.equipment_code) || item.equipment_code;
    if (!acc[pat]) {
      acc[pat] = [];
    }
    acc[pat].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const actions: ActionableItem[] = [
    {
      id: "pending-parts",
      title: "Peças Sem Relatório",
      count: Object.keys(groupedPendingParts).length,
      urgency: "high",
      icon: Package,
      action: () => navigate("/reports/quick"),
      details: Object.entries(groupedPendingParts)
        .slice(0, 3)
        .map(([pat, parts]) => `PAT ${pat}: ${parts.length} peça(s)`),
    },
    {
      id: "out-of-stock",
      title: "Produtos Sem Estoque",
      count: outOfStockProducts.length,
      urgency: "high",
      icon: AlertCircle,
      action: () => navigate("/admin/products"),
      details: outOfStockProducts
        .slice(0, 3)
        .map((p) => `${p.code} - ${p.name}`),
    },
    {
      id: "low-stock",
      title: "Estoque Baixo",
      count: lowStockProducts.length,
      urgency: "medium",
      icon: TrendingDown,
      action: () => navigate("/admin/products"),
      details: lowStockProducts
        .slice(0, 3)
        .map((p) => `${p.code}: ${p.quantity}/${p.min_quantity}`),
    },
    {
      id: "overdue-maintenance",
      title: "Manutenções Atrasadas",
      count: overdueMaintenance.length,
      urgency: "medium",
      icon: Wrench,
      action: () => navigate("/assets/list?status=manutencao"),
      details: overdueMaintenance
        .slice(0, 3)
        .map((a) => `PAT ${a.asset_code} - ${a.equipment_name}`),
    },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20";
      case "medium":
        return "bg-warning/10 border-warning text-warning hover:bg-warning/20";
      case "low":
        return "bg-primary/10 border-primary text-primary hover:bg-primary/20";
      default:
        return "bg-muted border-border text-foreground hover:bg-muted/80";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Ações Pendentes</h2>
        <p className="text-muted-foreground">
          Itens que requerem sua atenção imediata
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                action.count > 0 ? getUrgencyColor(action.urgency) : ""
              }`}
              onClick={action.action}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <CardTitle className="text-base font-medium">
                    {action.title}
                  </CardTitle>
                </div>
                <Badge
                  variant={action.count > 0 ? "default" : "secondary"}
                  className="text-lg font-bold"
                >
                  {action.count}
                </Badge>
              </CardHeader>
              <CardContent>
                {action.count > 0 ? (
                  <div className="space-y-2">
                    <ul className="text-sm space-y-1">
                      {action.details?.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                    {action.count > 3 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        +{action.count - 3} outro(s)
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.action();
                      }}
                    >
                      Ver Todos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    ✓ Tudo em dia!
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
