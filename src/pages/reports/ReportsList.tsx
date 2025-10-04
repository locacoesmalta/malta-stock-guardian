import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, FileText, Printer, Search, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Report {
  id: string;
  report_date: string;
  work_site: string;
  company: string;
  technician_name: string;
  service_comments: string;
  equipment_code: string;
  equipment_name: string | null;
  report_parts: Array<{
    products: {
      code: string;
      name: string;
      purchase_price: number | null;
    };
    quantity_used: number;
  }>;
  report_photos: Array<{
    photo_url: string;
    photo_comment: string;
    photo_order: number;
    signedUrl?: string; // Add signed URL field
  }>;
}

const ReportsList = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, startDate, endDate, companyFilter, searchTerm]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          report_parts(
            quantity_used,
            products(code, name, purchase_price)
          ),
          report_photos(photo_url, photo_comment, photo_order)
        `)
        .order("report_date", { ascending: false });

      if (error) throw error;
      
      // Generate signed URLs for all photos
      const reportsWithSignedUrls = await Promise.all(
        (data || []).map(async (report) => {
          const photosWithSignedUrls = await Promise.all(
            report.report_photos.map(async (photo) => {
              try {
                const { data: signedData } = await supabase.storage
                  .from('report-photos')
                  .createSignedUrl(photo.photo_url, 3600); // 1 hour expiry
                
                return {
                  ...photo,
                  signedUrl: signedData?.signedUrl || photo.photo_url
                };
              } catch (err) {
                console.error('Error generating signed URL:', err);
                return { ...photo, signedUrl: photo.photo_url };
              }
            })
          );
          
          return {
            ...report,
            report_photos: photosWithSignedUrls
          };
        })
      );
      
      setReports(reportsWithSignedUrls);
    } catch (error: any) {
      toast.error("Erro ao carregar relatórios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (startDate) {
      filtered = filtered.filter((r) => r.report_date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((r) => r.report_date <= endDate);
    }

    if (companyFilter) {
      filtered = filtered.filter((r) =>
        r.company.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.work_site.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.technician_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.equipment_name && r.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredReports(filtered);
  };

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReportId(expandedReportId === reportId ? null : reportId);
  };

  const handlePrint = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sortedPhotos = [...report.report_photos].sort((a, b) => a.photo_order - b.photo_order);

    const totalCost = report.report_parts.reduce((sum, part) => {
      const price = part.products.purchase_price || 0;
      return sum + (price * part.quantity_used);
    }, 0);

    const partsTable = report.report_parts.map((part, idx) => {
      const unitPrice = part.products.purchase_price || 0;
      const lineCost = unitPrice * part.quantity_used;
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${part.products.code}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${part.products.name}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${part.quantity_used}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${unitPrice.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">R$ ${lineCost.toFixed(2)}</td>
        </tr>
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
            <div class="info-item"><strong>Data:</strong> ${format(new Date(report.report_date), "dd/MM/yyyy", { locale: ptBR })}</div>
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
      <div>
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
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Filtrar por empresa"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setCompanyFilter("");
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
          <CardTitle>Relatórios ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando relatórios...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum relatório encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
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
                              {format(new Date(report.report_date), "dd/MM/yyyy")}
                            </span>
                            <span>Obra: {report.work_site}</span>
                            <span>Empresa: {report.company}</span>
                            <span className="font-medium">Custo: R$ {totalCost.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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

                        <div className="border-t pt-3">
                          <div className="font-medium text-sm mb-2">Peças Utilizadas:</div>
                          <div className="space-y-2">
                            {report.report_parts.map((part, idx) => {
                              const unitPrice = part.products.purchase_price || 0;
                              const lineCost = unitPrice * part.quantity_used;
                              return (
                                <div key={idx} className="text-sm bg-muted/50 p-2 rounded">
                                  <div className="font-medium">
                                    {part.products.code} - {part.products.name}
                                  </div>
                                  <div className="text-muted-foreground flex justify-between mt-1">
                                    <span>Quantidade: {part.quantity_used}</span>
                                    <span>R$ {unitPrice.toFixed(2)} × {part.quantity_used} = R$ {lineCost.toFixed(2)}</span>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="text-sm font-semibold border-t pt-2 flex justify-between">
                              <span>CUSTO TOTAL:</span>
                              <span>R$ {totalCost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

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
