import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subMonths, differenceInDays, format } from "date-fns";

export interface PredictiveProduct {
  id: string;
  code: string;
  name: string;
  manufacturer: string | null;
  currentStock: number;
  minQuantity: number;
  purchasePrice: number | null;
  
  // Métricas calculadas
  totalConsumed: number;
  monthlyAverage: number;
  dailyAverage: number;
  daysUntilStockout: number;
  
  // Tendência
  firstHalfAverage: number;
  secondHalfAverage: number;
  growthRate: number;
  trend: "accelerated_growth" | "growing" | "stable" | "declining";
  
  // Criticidade
  criticality: "critical" | "alert" | "attention" | "normal";
  
  // Sugestões
  suggestedQuantity: number;
  estimatedCost: number;
  suggestedPurchaseDate: Date;
  justification: string;
  priority: "maximum" | "high" | "medium" | "low";
  
  // Consumo mensal para gráfico
  monthlyConsumption: Array<{ month: string; quantity: number }>;
}

export interface PredictiveSummary {
  criticalCount: number;
  alertCount: number;
  growingCount: number;
  totalEstimatedCost: number;
}

const fetchPredictivePurchases = async (): Promise<{
  products: PredictiveProduct[];
  summary: PredictiveSummary;
}> => {
  const sixMonthsAgo = subMonths(new Date(), 6);
  const threeMonthsAgo = subMonths(new Date(), 3);

  // Buscar todos os produtos
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (productsError) throw productsError;
  if (!products) return { products: [], summary: { criticalCount: 0, alertCount: 0, growingCount: 0, totalEstimatedCost: 0 } };

  // Buscar todas as retiradas dos últimos 6 meses (exceto vendas)
  const { data: withdrawals, error: withdrawalsError } = await supabase
    .from("material_withdrawals")
    .select("product_id, quantity, withdrawal_date")
    .gte("withdrawal_date", format(sixMonthsAgo, "yyyy-MM-dd"))
    .neq("equipment_code", "VENDA");

  if (withdrawalsError) throw withdrawalsError;

  const predictiveProducts: PredictiveProduct[] = [];
  let criticalCount = 0;
  let alertCount = 0;
  let growingCount = 0;
  let totalEstimatedCost = 0;

  for (const product of products) {
    // Filtrar retiradas deste produto
    const productWithdrawals = (withdrawals || []).filter(
      (w) => w.product_id === product.id
    );

    if (productWithdrawals.length === 0) continue; // Ignorar produtos sem histórico

    // Calcular consumo total
    const totalConsumed = productWithdrawals.reduce(
      (sum, w) => sum + w.quantity,
      0
    );

    // Calcular consumo médio mensal e diário
    const monthlyAverage = totalConsumed / 6;
    const dailyAverage = monthlyAverage / 30;

    // Calcular dias até acabar o estoque
    const daysUntilStockout = dailyAverage > 0 
      ? Math.floor(product.quantity / dailyAverage)
      : 999;

    // Calcular tendência (primeiros 3 meses vs últimos 3 meses)
    const firstHalfWithdrawals = productWithdrawals.filter(
      (w) => new Date(w.withdrawal_date) < threeMonthsAgo
    );
    const secondHalfWithdrawals = productWithdrawals.filter(
      (w) => new Date(w.withdrawal_date) >= threeMonthsAgo
    );

    const firstHalfTotal = firstHalfWithdrawals.reduce(
      (sum, w) => sum + w.quantity,
      0
    );
    const secondHalfTotal = secondHalfWithdrawals.reduce(
      (sum, w) => sum + w.quantity,
      0
    );

    const firstHalfAverage = firstHalfTotal / 3;
    const secondHalfAverage = secondHalfTotal / 3;

    const growthRate =
      firstHalfAverage > 0
        ? ((secondHalfAverage - firstHalfAverage) / firstHalfAverage) * 100
        : 0;

    // Classificar tendência
    let trend: PredictiveProduct["trend"];
    if (growthRate > 20) trend = "accelerated_growth";
    else if (growthRate > 10) trend = "growing";
    else if (growthRate > -10) trend = "stable";
    else trend = "declining";

    // Classificar criticidade
    let criticality: PredictiveProduct["criticality"];
    if (daysUntilStockout < 15) {
      criticality = "critical";
      criticalCount++;
    } else if (daysUntilStockout < 30) {
      criticality = "alert";
      alertCount++;
    } else if (daysUntilStockout < 60) {
      criticality = "attention";
    } else {
      criticality = "normal";
    }

    // Contar produtos em crescimento
    if (trend === "accelerated_growth" || trend === "growing") {
      growingCount++;
    }

    // Calcular quantidade sugerida
    let suggestedQuantity: number;
    if (criticality === "critical" && trend === "accelerated_growth") {
      suggestedQuantity = Math.ceil(monthlyAverage * 4); // 4 meses
    } else if (criticality === "critical") {
      suggestedQuantity = Math.ceil(monthlyAverage * 3); // 3 meses
    } else if (trend === "accelerated_growth") {
      suggestedQuantity = Math.ceil(monthlyAverage * 2.5); // 2.5 meses
    } else {
      suggestedQuantity = Math.ceil(monthlyAverage * 2); // 2 meses
    }

    // Calcular custo estimado
    const estimatedCost = suggestedQuantity * (product.purchase_price || 0);
    totalEstimatedCost += estimatedCost;

    // Calcular data sugerida para compra (15 dias antes de acabar)
    const daysBeforePurchase = Math.max(0, daysUntilStockout - 15);
    const suggestedPurchaseDate = new Date();
    suggestedPurchaseDate.setDate(
      suggestedPurchaseDate.getDate() + daysBeforePurchase
    );

    // Determinar prioridade
    let priority: PredictiveProduct["priority"];
    if (criticality === "critical" && trend === "accelerated_growth") {
      priority = "maximum";
    } else if (criticality === "critical") {
      priority = "high";
    } else if (criticality === "alert") {
      priority = "medium";
    } else {
      priority = "low";
    }

    // Justificativa
    let justification = "";
    if (criticality === "critical" && trend === "accelerated_growth") {
      justification = `Crítico + Crescimento Acelerado (+${growthRate.toFixed(0)}%)`;
    } else if (criticality === "critical") {
      justification = `Crítico - Estoque acaba em ${daysUntilStockout} dias`;
    } else if (trend === "accelerated_growth") {
      justification = `Crescimento Acelerado (+${growthRate.toFixed(0)}%)`;
    } else if (trend === "growing") {
      justification = `Em Crescimento (+${growthRate.toFixed(0)}%)`;
    } else {
      justification = "Reposição de estoque padrão";
    }

    // Calcular consumo mensal para gráfico
    const monthlyConsumption: Array<{ month: string; quantity: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = subMonths(new Date(), i);
      const monthEnd = subMonths(new Date(), i - 1);
      const monthWithdrawals = productWithdrawals.filter((w) => {
        const date = new Date(w.withdrawal_date);
        return date >= monthStart && date < monthEnd;
      });
      const monthTotal = monthWithdrawals.reduce(
        (sum, w) => sum + w.quantity,
        0
      );
      monthlyConsumption.push({
        month: format(monthStart, "MMM/yy"),
        quantity: monthTotal,
      });
    }

    predictiveProducts.push({
      id: product.id,
      code: product.code,
      name: product.name,
      manufacturer: product.manufacturer,
      currentStock: product.quantity,
      minQuantity: product.min_quantity,
      purchasePrice: product.purchase_price,
      totalConsumed,
      monthlyAverage,
      dailyAverage,
      daysUntilStockout,
      firstHalfAverage,
      secondHalfAverage,
      growthRate,
      trend,
      criticality,
      suggestedQuantity,
      estimatedCost,
      suggestedPurchaseDate,
      justification,
      priority,
      monthlyConsumption,
    });
  }

  // Ordenar por prioridade e criticidade
  predictiveProducts.sort((a, b) => {
    const priorityOrder = { maximum: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.daysUntilStockout - b.daysUntilStockout;
  });

  return {
    products: predictiveProducts,
    summary: {
      criticalCount,
      alertCount,
      growingCount,
      totalEstimatedCost,
    },
  };
};

export const usePredictivePurchases = () => {
  return useQuery({
    queryKey: ["predictive-purchases"],
    queryFn: fetchPredictivePurchases,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
