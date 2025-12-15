import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator } from "lucide-react";

interface MeasurementSummaryProps {
  subtotalRentals: number;
  subtotalDemobilization: number;
  subtotalMaintenance: number;
  totalValue: number;
}

export function MeasurementSummary({
  subtotalRentals,
  subtotalDemobilization,
  subtotalMaintenance,
  totalValue
}: MeasurementSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Resumo da Medição</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Aluguéis de Máquinas:</span>
            <span>{formatCurrency(subtotalRentals)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Desmobilização:</span>
            <span>{formatCurrency(subtotalDemobilization)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Manutenção:</span>
            <span>{formatCurrency(subtotalMaintenance)}</span>
          </div>
          
          <Separator className="my-3" />
          
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg">TOTAL GERAL:</span>
            <span className="font-bold text-2xl text-primary">
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
