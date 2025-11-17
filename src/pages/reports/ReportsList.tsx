import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Printer, Search, ChevronDown, ChevronUp, Link as LinkIcon, Package, Pencil } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BackButton } from "@/components/BackButton";
import { useReportsWithTraceability } from "@/hooks/useReportsWithTraceability";
import { ReportPartsTraceability } from "@/components/ReportPartsTraceability";
import { formatBRFromYYYYMMDD } from "@/lib/dateUtils";

const ReportsList = () => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [equipmentCodeFilter, setEquipmentCodeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useReportsWithTraceability({
    startDate,
    endDate,
    equipmentCode: equipmentCodeFilter,
    searchTerm,
  });

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const handlePrint = (report: typeof reports[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sortedPhotos = [...report.report_photos].sort((a, b) => a.photo_order - b.photo_order);

    const totalCost = report.report_parts.reduce((sum, part) => {
      const price = part.products.purchase_price || 0;
      return sum + (price * part.quantity_used);
    }, 0);

    const partsTable = report.report_parts.map((part) => {
      const unitPrice = part.products.purchase_price || 0;
      const lineCost = unitPrice * part.quantity_used;
      const hasTraceability = part.withdrawal_id && part.material_withdrawals;
      
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${part.products.code}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">
            ${part.products.name}
            ${hasTraceability ? '<br/><small style="color: #059669;">✓ Rastreável</small>' : ''}
          </td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${part.quantity_used}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${unitPrice.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${lineCost.toFixed(2)}</td>
        </tr>
        ${hasTraceability ? `
          <tr style="background: #f0fdf4;">
            <td colspan="5" style="padding: 8px; border: 1px solid #ddd; font-size: 12px;">
              <strong>Rastreabilidade:</strong> 
              Retirada em ${formatBRFromYYYYMMDD(part.material_withdrawals!.withdrawal_date)} - 
              Obra: ${part.material_withdrawals!.work_site} - 
              Empresa: ${part.material_withdrawals!.company}
              ${part.material_withdrawals!.withdrawal_reason ? ` - ${part.material_withdrawals!.withdrawal_reason}` : ''}
            </td>
          </tr>
        ` : ''}
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório - ${report.equipment_code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            h2 { color: #374151; margin-top: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .info-item { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            .parts-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .parts-table th { background: #f3f4f6; padding: 10px; border: 1px solid #ddd; text-align: left; }
            .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .photo-item { page-break-inside: avoid; }
            .photo-item img { width: 100%; max-height: 300px; object-fit: contain; border: 1px solid #ddd; }
            .photo-comment { margin-top: 8px; font-size: 14px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Malta Locações - Relatório de Manutenção</h1>
          
          <div class="info-grid">
          <div class="info-item"><strong>Código PAT:</strong> ${report.equipment_code}</div>
            <div class="info-item"><strong>Equipamento:</strong> ${report.equipment_name || 'N/A'}</div>
            <div class="info-item"><strong>Obra:</strong> ${report.work_site}</div>
            <div class="info-item"><strong>Empresa:</strong> ${report.company}</div>
            <div class="info-item"><strong>Funcionário:</strong> ${report.technician_name}</div>
            <div class="info-item"><strong>Data:</strong> ${formatBRFromYYYYMMDD(report.report_date)}</div>
          </div>

          <div style="margin: 20px 0;">
            <strong>Comentários do Serviço:</strong>
            <p>${report.service_comments}</p>
          </div>

          <h2>Peças Utilizadas</h2>
          <table class="parts-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Peça</th>
                <th>Quantidade</th>
                <th style="text-align: right;">Preço Unit.</th>
                <th style="text-align: right;">Custo Total</th>
              </tr>
            </thead>
            <tbody>
              ${partsTable}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6; font-weight: bold;">
                <td colspan="4" style="padding: 10px; border: 1px solid #ddd; text-align: right;">CUSTO TOTAL:</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">R$ ${totalCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <h2>Fotos do Serviço</h2>
          <div class="photos">
            ${sortedPhotos.map((photo, index) => `
              <div class="photo-item">
                <h3>Foto ${index + 1}</h3>
                <img src="${photo.signedUrl || photo.photo_url}" alt="Foto ${index + 1}" />
                <div class="photo-comment">${photo.photo_comment}</div>
              </div>
            `).join('')}
          </div>

          <button class="no-print" onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Imprimir
          </button>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackButton />
        <h1 className="text-3xl font-bold">Histórico de Relatórios</h1>
        <p className="text-muted-foreground">Visualize e filtre os relatórios gerados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por obra, empresa, técnico ou PAT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment-code">Código PAT</Label>
              <Input
                id="equipment-code"
                placeholder="Filtrar por PAT"
                value={equipmentCodeFilter}
                onChange={(e) => setEquipmentCodeFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setEquipmentCodeFilter("");
                  setSearchTerm("");
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios ({reports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando relatórios...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum relatório encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const isExpanded = expandedReportId === report.id;
                const totalCost = report.report_parts.reduce((sum, part) => {
                  const price = part.products.purchase_price || 0;
                  return sum + (price * part.quantity_used);
                }, 0);

                return (
                  <div
                    key={report.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Compact Header - Always Visible */}
                    <div className="p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base truncate">
                            PAT: {report.equipment_code}
                            {report.equipment_name && ` - ${report.equipment_name}`}
                          </div>
                          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatBRFromYYYYMMDD(report.report_date)}
                            </span>
                            <span>Obra: {report.work_site}</span>
                            <span>Empresa: {report.company}</span>
                            <span className="font-medium">Custo: R$ {totalCost.toFixed(2)}</span>
                            {report.report_parts.some(p => p.withdrawal_id) && (
                              <Badge variant="outline" className="text-green-700 border-green-700">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Rastreável
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reports/edit/${report.id}`);
                            }}
                            title="Editar este relatório"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/inventory/withdrawal?pat=${report.equipment_code}`);
                            }}
                            title="Retirar Peças para este equipamento"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrint(report)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleReportExpansion(report.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content - Only visible when expanded */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 border-t">
                        <div className="text-sm">
                          <span className="font-medium">Funcionário:</span> {report.technician_name}
                        </div>

                        <ReportPartsTraceability parts={report.report_parts} />

                        <div className="border-t pt-3">
                          <div className="font-medium text-sm mb-2">Comentários do Serviço:</div>
                          <p className="text-sm text-muted-foreground">{report.service_comments}</p>
                        </div>

                        <div className="border-t pt-3">
                          <div className="font-medium text-sm mb-3">Fotos ({report.report_photos.length}):</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {report.report_photos
                              .sort((a, b) => a.photo_order - b.photo_order)
                              .map((photo, index) => (
                                <div key={index} className="space-y-1">
                                  <img
                                    src={photo.signedUrl || photo.photo_url}
                                    alt={`Foto ${index + 1}`}
                                    className="w-full h-32 object-cover rounded border"
                                  />
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {photo.photo_comment}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsList;
