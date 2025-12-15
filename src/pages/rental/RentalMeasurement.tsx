import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Printer, History, FileText } from "lucide-react";
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
import { getTodayLocalDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function RentalMeasurement() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPrintView, setShowPrintView] = useState(false);

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

  // Fetch equipment from contract
  const { data: equipment, isLoading: loadingEquipment } = useRentalEquipmentForMeasurement(companyId || '');

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
      const today = getTodayLocalDate();
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
        period_start: eq.pickup_date,
        period_end: today,
        days_count: eq.days_count
      }));
      setRentalItems(items);
    }
  }, [equipment]);

  // Calculate totals
  const subtotalRentals = rentalItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotalDemobilization = demobilizationItems.reduce((sum, item) => sum + item.total_price, 0);
  const subtotalMaintenance = maintenanceItems.reduce((sum, item) => sum + item.total_price, 0);
  const totalValue = subtotalRentals + subtotalDemobilization + subtotalMaintenance;

  // Calculate period
  const periodStart = rentalItems.length > 0
    ? rentalItems.reduce((min, item) => {
        if (!item.period_start) return min;
        return item.period_start < min ? item.period_start : min;
      }, rentalItems[0]?.period_start || getTodayLocalDate())
    : getTodayLocalDate();
  const periodEnd = getTodayLocalDate();
  const totalDays = Math.max(
    ...rentalItems.map(item => item.days_count || 0),
    1
  );

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
      period_start: periodStart,
      period_end: periodEnd,
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

      {/* Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div>
              <p className="text-sm text-muted-foreground">Período</p>
              <p className="font-medium">
                {format(new Date(periodStart), "dd/MM/yyyy", { locale: ptBR })} a{" "}
                {format(new Date(periodEnd), "dd/MM/yyyy", { locale: ptBR })}
                <span className="text-muted-foreground ml-1">({totalDays} dias)</span>
              </p>
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
              periodStart={periodStart}
              periodEnd={periodEnd}
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
