import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Eye, Plus, FileText } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRentalMeasurements } from "@/hooks/useRentalMeasurements";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RentalMeasurementHistory() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  // Fetch company data
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['rental-company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rental_companies')
        .select('*')
        .eq('id', companyId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId
  });

  // Fetch measurements
  const { data: measurements, isLoading: loadingMeasurements } = useRentalMeasurements(companyId || '');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (loadingCompany || loadingMeasurements) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">Empresa não encontrada</p>
        <Button variant="outline" onClick={() => navigate('/rental-companies')}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackPath={`/rental-companies/${companyId}/measurement`} />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Histórico de Medições
            </h1>
            <p className="text-muted-foreground">{company.company_name}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/rental-companies/${companyId}/measurement`)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Medição
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medições Realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Nº</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Aluguéis</TableHead>
                <TableHead className="text-right">Desmob.</TableHead>
                <TableHead className="text-right">Manut.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!measurements || measurements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma medição encontrada
                  </TableCell>
                </TableRow>
              ) : (
                measurements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono font-bold">
                      {String(m.measurement_number).padStart(3, '0')}
                    </TableCell>
                    <TableCell>{formatDate(m.measurement_date)}</TableCell>
                    <TableCell>
                      {formatDate(m.period_start)} a {formatDate(m.period_end)}
                      <span className="text-muted-foreground ml-1">
                        ({m.total_days} dias)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.subtotal_rentals || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.subtotal_demobilization || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.subtotal_maintenance || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(m.total_value || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/rental-companies/${companyId}/measurements/${m.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
