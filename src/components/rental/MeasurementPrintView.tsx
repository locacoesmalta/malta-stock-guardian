import { formatBRFromYYYYMMDD, formatBRShortFromYYYYMMDD } from "@/lib/dateUtils";
import { MeasurementItem } from "@/hooks/useRentalMeasurements";

interface MeasurementPrintViewProps {
  companyName: string;
  cnpj: string;
  contractNumber: string;
  measurementNumber: number;
  periodStart: string;
  periodEnd: string;
  totalDays: number;
  rentalItems: MeasurementItem[];
  demobilizationItems: MeasurementItem[];
  maintenanceItems: MeasurementItem[];
  subtotalRentals: number;
  subtotalDemobilization: number;
  subtotalMaintenance: number;
  totalValue: number;
  notes?: string;
}

export function MeasurementPrintView({
  companyName,
  cnpj,
  contractNumber,
  measurementNumber,
  periodStart,
  periodEnd,
  totalDays,
  rentalItems,
  demobilizationItems,
  maintenanceItems,
  subtotalRentals,
  subtotalDemobilization,
  subtotalMaintenance,
  totalValue,
  notes
}: MeasurementPrintViewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // SAFE: Formatar data SEM conversão timezone (manipulação de string)
  const formatDate = (dateStr: string) => {
    try {
      return formatBRFromYYYYMMDD(dateStr);
    } catch {
      return dateStr;
    }
  };

  // SAFE: Formatar período SEM conversão timezone (manipulação de string)
  const formatPeriod = (start?: string, end?: string) => {
    if (!start || !end) return "-";
    try {
      return `${formatBRShortFromYYYYMMDD(start)} a ${formatBRShortFromYYYYMMDD(end)}`;
    } catch {
      return "-";
    }
  };

  return (
    <div className="measurement-print-view p-8 bg-white text-black max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 border-b-2 border-black pb-4">
        <div className="flex items-center gap-4">
          <img src="/malta-logo.webp" alt="Malta" className="h-16 w-auto" />
          <div>
            <h1 className="text-xl font-bold">MALTA LOCAÇÕES</h1>
            <p className="text-sm text-gray-600">CNPJ: 55.108.613/0001-39</p>
            <p className="text-sm text-gray-600">R. União, 16a - Marco, Belém - PA</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            MEDIÇÃO Nº {String(measurementNumber).padStart(3, '0')}
          </div>
          <p className="text-sm">Data: {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-gray-100 p-4 rounded mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Cliente:</p>
            <p className="font-semibold">{companyName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CNPJ:</p>
            <p className="font-semibold">{cnpj}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contrato:</p>
            <p className="font-semibold">{contractNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Período:</p>
            <p className="font-semibold">
              {formatDate(periodStart)} a {formatDate(periodEnd)} ({totalDays} dias)
            </p>
          </div>
        </div>
      </div>

      {/* Rentals Section - só aparece se tiver itens */}
      {rentalItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-800 text-white px-3 py-2 mb-2">
            📦 ALUGUÉIS DE MÁQUINAS
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left w-12">ITEM</th>
                <th className="border p-2 text-left w-16">PAT</th>
                <th className="border p-2 text-left">DESCRIÇÃO</th>
                <th className="border p-2 text-center w-28">PERÍODO</th>
                <th className="border p-2 text-center w-12">DIAS</th>
                <th className="border p-2 text-right w-24">VL. UNIT.</th>
                <th className="border p-2 text-right w-24">VL. TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {rentalItems.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{String(index + 1).padStart(2, '0')}</td>
                  <td className="border p-2 font-mono">{item.equipment_code || "-"}</td>
                  <td className="border p-2">{item.description}</td>
                  <td className="border p-2 text-center text-xs">
                    {formatPeriod(item.period_start, item.period_end)}
                  </td>
                  <td className="border p-2 text-center">{item.days_count || 0}</td>
                  <td className="border p-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="border p-2 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={6} className="border p-2 text-right">Subtotal:</td>
                <td className="border p-2 text-right">{formatCurrency(subtotalRentals)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Demobilization Section - só aparece se tiver itens */}
      {demobilizationItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-800 text-white px-3 py-2 mb-2">
            🚚 DESMOBILIZAÇÃO
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left w-12">ITEM</th>
                <th className="border p-2 text-left">DESCRIÇÃO</th>
                <th className="border p-2 text-center w-16">QTD</th>
                <th className="border p-2 text-center w-12">UN</th>
                <th className="border p-2 text-right w-24">VL. UNIT.</th>
                <th className="border p-2 text-right w-24">VL. TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {demobilizationItems.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{String(index + 1).padStart(2, '0')}</td>
                  <td className="border p-2">{item.description}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-center">{item.unit}</td>
                  <td className="border p-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="border p-2 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={5} className="border p-2 text-right">Subtotal:</td>
                <td className="border p-2 text-right">{formatCurrency(subtotalDemobilization)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Maintenance Section - só aparece se tiver itens */}
      {maintenanceItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-800 text-white px-3 py-2 mb-2">
            🔧 MANUTENÇÃO
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left w-12">ITEM</th>
                <th className="border p-2 text-left">DESCRIÇÃO</th>
                <th className="border p-2 text-center w-16">QTD</th>
                <th className="border p-2 text-center w-12">UN</th>
                <th className="border p-2 text-right w-24">VL. UNIT.</th>
                <th className="border p-2 text-right w-24">VL. TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceItems.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{String(index + 1).padStart(2, '0')}</td>
                  <td className="border p-2">{item.description}</td>
                  <td className="border p-2 text-center">{item.quantity}</td>
                  <td className="border p-2 text-center">{item.unit}</td>
                  <td className="border p-2 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="border p-2 text-right font-semibold">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={5} className="border p-2 text-right">Subtotal:</td>
                <td className="border p-2 text-right">{formatCurrency(subtotalMaintenance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Total */}
      <div className="bg-primary text-white p-4 rounded text-right">
        <span className="text-xl font-bold">
          TOTAL GERAL: {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mt-6 p-4 border rounded">
          <p className="text-sm font-semibold mb-1">Observações:</p>
          <p className="text-sm text-gray-600">{notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>Malta Locações de Máquinas e Equipamentos</p>
        <p>(91) 98605-4851 | walter@maltalocacoes.com.br</p>
      </div>
    </div>
  );
}
