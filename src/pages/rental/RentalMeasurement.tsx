import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Printer, History, FileText, Calendar, Info } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MeasurementRentalsSection } from "@/components/rental/MeasurementRentalsSection";
import { MeasurementExtraSection } from "@/components/rental/MeasurementExtraSection";
import { MeasurementSummary } from "@/components/rental/MeasurementSummary";
import { MeasurementPrintView } from "@/components/rental/MeasurementPrintView";
import {
  useRentalEquipmentForMeasurement,
  useNextMeasurementNumber,
  useCreateMeasurement,
  MeasurementItem
} from "@/hooks/useRentalMeasurements";
import { getTodayLocalDate, parseLocalDate, getNowInBelem } from "@/lib/dateUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Calcula o período baseado na data de corte
function calculateMeasurementPeriod(cutDate: Date) {
  const periodEnd = cutDate;
  // Calcular mês anterior mantendo o mesmo dia (evita edge cases do subMonths)
  const periodStart = new Date(
    cutDate.getFullYear(),
    cutDate.getMonth() - 1,
    cutDate.getDate()
  );
  return { periodStart, periodEnd };
}

// Formata data para input date
function toDateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export default function RentalMeasurement() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPrintView, setShowPrintView] = useState(false);
  
  // Estado para data de corte
  const [cutDateStr, setCutDateStr] = useState<string>("");

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

  // Inicializar data de corte baseada no dia de corte do contrato
  useEffect(() => {
    if (company && !cutDateStr) {
      const diaCorte = company.dia_corte || 1;
      const today = getNowInBelem(); // Usar timezone correto de Belém
      let cutDate: Date;
      
      // Se hoje é antes do dia de corte, usar mês atual
      // Se hoje é depois do dia de corte, usar mês atual
      if (today.getDate() >= diaCorte) {
        cutDate = new Date(today.getFullYear(), today.getMonth(), diaCorte);
      } else {
        // Ainda não chegou o dia de corte deste mês, usar mês anterior
        cutDate = new Date(today.getFullYear(), today.getMonth() - 1, diaCorte);
      }
      
      setCutDateStr(toDateInputValue(cutDate));
    }
  }, [company, cutDateStr]);

  // Calcular período baseado na data de corte
  const { periodStart, periodEnd, totalDays } = useMemo(() => {
    if (!cutDateStr) {
      const today = parseLocalDate(getTodayLocalDate());
      const periodStart = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return { 
        periodStart, 
        periodEnd: today,
        totalDays: 31
      };
    }
    
    const cutDate = parseLocalDate(cutDateStr);
    const { periodStart, periodEnd } = calculateMeasurementPeriod(cutDate);
    
    // Calcular total de dias no período
    const diffTime = periodEnd.getTime() - periodStart.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { periodStart, periodEnd, totalDays: days };
  }, [cutDateStr]);

  // Fetch equipment com período calculado
  const { data: equipment, isLoading: loadingEquipment } = useRentalEquipmentForMeasurement(
    companyId || '',
    periodStart,
    periodEnd
  );

  // Fetch next measurement number
  const { data: nextNumber } = useNextMeasurementNumber(companyId || '');

  // Create mutation
  const createMeasurement = useCreateMeasurement();

  // State for items
  const [rentalItems, setRentalItems] = useState<MeasurementItem[]>([]);
  const [demobilizationItems, setDemobilizationItems] = useState<MeasurementItem[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<MeasurementItem[]>([]);
  const [notes, setNotes] = useState("");

  // Initialize rental items from equipment
  useEffect(() => {
    if (equipment && equipment.length > 0) {
      const items: MeasurementItem[] = equipment.map((eq, index) => ({
        rental_equipment_id: eq.id,
        category: 'rentals' as const,
        item_order: index + 1,
        equipment_code: eq.asset_code,
        description: eq.equipment_name,
        unit: 'DIA',
        quantity: eq.dias_cobrados,
        unit_price: eq.valor_diaria,
        total_price: eq.total_price,
        period_start: toDateInputValue(periodStart),
        period_end: toDateInputValue(periodEnd),
        days_count: eq.dias_cobrados,
        dias_reais: eq.dias_reais
      }));
      setRentalItems(items);
    } else {
      setRentalItems([]);
    }
  }, [equipment, periodStart, periodEnd]);

  // Calculate totals
  const subtotalRentals = rentalItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotalDemobilization = demobilizationItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotalMaintenance = maintenanceItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalValue = subtotalRentals + subtotalDemobilization + subtotalMaintenance;

  // Update rental item
  const handleUpdateRentalItem = (index: number, field: keyof MeasurementItem, value: any) => {
    setRentalItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update demobilization item
  const handleUpdateDemobItem = (index: number, field: keyof MeasurementItem, value: any) => {
    setDemobilizationItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update maintenance item
  const handleUpdateMaintenanceItem = (index: number, field: keyof MeasurementItem, value: any) => {
    setMaintenanceItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Add demobilization item
  const handleAddDemobItem = () => {
    setDemobilizationItems(prev => [
      ...prev,
      {
        category: 'demobilization',
        item_order: prev.length + 1,
        description: '',
        unit: 'UN',
        quantity: 1,
        unit_price: 0,
        total_price: 0
      }
    ]);
  };

  // Add maintenance item
  const handleAddMaintenanceItem = () => {
    setMaintenanceItems(prev => [
      ...prev,
      {
        category: 'maintenance',
        item_order: prev.length + 1,
        description: '',
        unit: 'UN',
        quantity: 1,
        unit_price: 0,
        total_price: 0
      }
    ]);
  };

  // Remove item
  const handleRemoveDemobItem = (index: number) => {
    setDemobilizationItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveMaintenanceItem = (index: number) => {
    setMaintenanceItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save measurement
  const handleSave = async () => {
    if (!companyId || !nextNumber || !user) return;

    const allItems = [
      ...rentalItems,
      ...demobilizationItems.map((item, i) => ({ ...item, item_order: i + 1 })),
      ...maintenanceItems.map((item, i) => ({ ...item, item_order: i + 1 }))
    ];

    await createMeasurement.mutateAsync({
      rental_company_id: companyId,
      measurement_number: nextNumber,
      measurement_date: getTodayLocalDate(),
      period_start: toDateInputValue(periodStart),
      period_end: toDateInputValue(periodEnd),
      total_days: totalDays,
      subtotal_rentals: subtotalRentals,
      subtotal_demobilization: subtotalDemobilization,
      subtotal_maintenance: subtotalMaintenance,
      total_value: totalValue,
      notes: notes || undefined,
      created_by: user.id,
      items: allItems
    });
  };

  // Generate PDF
  const handlePrint = async () => {
    setShowPrintView(true);
    
    setTimeout(async () => {
      const element = printRef.current;
      if (!element) return;

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`medicao-${company?.company_name}-${nextNumber}.pdf`);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setShowPrintView(false);
      }
    }, 100);
  };

  if (loadingCompany || loadingEquipment) {
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
          <BackButton fallbackPath="/rental-companies" />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Medição de Equipamentos
            </h1>
            <p className="text-muted-foreground">{company.company_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/rental-companies/${companyId}/measurements`)}
          >
            <History className="h-4 w-4 mr-2" />
            Histórico
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Gerar PDF
          </Button>
          <Button onClick={handleSave} disabled={createMeasurement.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Medição
          </Button>
        </div>
      </div>

      {/* Data de Corte */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Corte da Medição
              </Label>
              <Input
                type="date"
                value={cutDateStr}
                onChange={(e) => setCutDateStr(e.target.value)}
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Dia de corte do contrato: {company.dia_corte || 1}
              </p>
            </div>
            <div className="flex items-center justify-end">
              <div className="bg-background rounded-lg p-4 border">
                <p className="text-sm text-muted-foreground mb-1">Período da Medição</p>
                <p className="text-lg font-semibold">
                  {format(periodStart, "dd/MM/yyyy", { locale: ptBR })} a{" "}
                  {format(periodEnd, "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-primary font-medium">
                  {totalDays} dias
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fatura Nº</p>
              <p className="text-xl font-bold text-primary">
                {String(nextNumber || 1).padStart(3, '0')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium">{company.cnpj}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contrato</p>
              <p className="font-medium">{company.contract_number}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <MeasurementRentalsSection
        items={rentalItems}
        onUpdateItem={handleUpdateRentalItem}
        subtotal={subtotalRentals}
      />

      <MeasurementExtraSection
        title="Desmobilização"
        category="demobilization"
        items={demobilizationItems}
        onUpdateItem={handleUpdateDemobItem}
        onAddItem={handleAddDemobItem}
        onRemoveItem={handleRemoveDemobItem}
        subtotal={subtotalDemobilization}
      />

      <MeasurementExtraSection
        title="Manutenção"
        category="maintenance"
        items={maintenanceItems}
        onUpdateItem={handleUpdateMaintenanceItem}
        onAddItem={handleAddMaintenanceItem}
        onRemoveItem={handleRemoveMaintenanceItem}
        subtotal={subtotalMaintenance}
      />

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Observações gerais sobre a medição..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Summary */}
      <MeasurementSummary
        subtotalRentals={subtotalRentals}
        subtotalDemobilization={subtotalDemobilization}
        subtotalMaintenance={subtotalMaintenance}
        totalValue={totalValue}
      />

      {/* Print View (hidden) */}
      {showPrintView && (
        <div className="fixed left-[-9999px]">
          <div ref={printRef}>
            <MeasurementPrintView
              companyName={company.company_name}
              cnpj={company.cnpj}
              contractNumber={company.contract_number}
              measurementNumber={nextNumber || 1}
              periodStart={toDateInputValue(periodStart)}
              periodEnd={toDateInputValue(periodEnd)}
              totalDays={totalDays}
              rentalItems={rentalItems}
              demobilizationItems={demobilizationItems}
              maintenanceItems={maintenanceItems}
              subtotalRentals={subtotalRentals}
              subtotalDemobilization={subtotalDemobilization}
              subtotalMaintenance={subtotalMaintenance}
              totalValue={totalValue}
              notes={notes}
            />
          </div>
        </div>
      )}
    </div>
  );
}
