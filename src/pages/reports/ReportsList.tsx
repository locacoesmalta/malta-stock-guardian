import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Report {
  id: string;
  report_date: string;
  work_site: string;
  company: string;
  technician_name: string;
  service_comments: string;
  quantity_used: number;
  products: {
    code: string;
    name: string;
  };
  report_photos: Array<{
    photo_url: string;
    photo_comment: string;
    photo_order: number;
  }>;
}

const ReportsList = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, startDate, endDate, companyFilter]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          products!inner(code, name),
          report_photos(photo_url, photo_comment, photo_order)
        `)
        .order("report_date", { ascending: false });

      if (error) throw error;
      setReports(data || []);
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

    setFilteredReports(filtered);
  };

  const handlePrint = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sortedPhotos = [...report.report_photos].sort((a, b) => a.photo_order - b.photo_order);

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório - ${report.products.code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
            .info-item { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .photo-item { page-break-inside: avoid; }
            .photo-item img { width: 100%; max-height: 300px; object-fit: contain; border: 1px solid #ddd; }
            .photo-comment { margin-top: 8px; font-size: 14px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Malta Locações - Relatório de Serviço</h1>
          
          <div class="info-grid">
            <div class="info-item"><strong>Código:</strong> ${report.products.code}</div>
            <div class="info-item"><strong>Produto:</strong> ${report.products.name}</div>
            <div class="info-item"><strong>Obra:</strong> ${report.work_site}</div>
            <div class="info-item"><strong>Empresa:</strong> ${report.company}</div>
            <div class="info-item"><strong>Funcionário:</strong> ${report.technician_name}</div>
            <div class="info-item"><strong>Data:</strong> ${format(new Date(report.report_date), "dd/MM/yyyy", { locale: ptBR })}</div>
            <div class="info-item"><strong>Quantidade:</strong> ${report.quantity_used}</div>
          </div>

          <div style="margin: 20px 0;">
            <strong>Comentários do Serviço:</strong>
            <p>${report.service_comments}</p>
          </div>

          <h2>Fotos do Serviço</h2>
          <div class="photos">
            ${sortedPhotos.map((photo, index) => `
              <div class="photo-item">
                <h3>Foto ${index + 1}</h3>
                <img src="${photo.photo_url}" alt="Foto ${index + 1}" />
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
          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">
                        {report.products.code} - {report.products.name}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(report.report_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                        <div>Obra: {report.work_site}</div>
                        <div>Empresa: {report.company}</div>
                        <div>Funcionário: {report.technician_name}</div>
                        <div>Quantidade: {report.quantity_used}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(report)}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>

                  <div className="border-t pt-3">
                    <div className="font-medium text-sm mb-2">Comentários do Serviço:</div>
                    <p className="text-sm text-muted-foreground">{report.service_comments}</p>
                  </div>

                  <div className="border-t pt-3">
                    <div className="font-medium text-sm mb-3">Fotos ({report.report_photos.length}):</div>
                    <div className="grid grid-cols-3 gap-2">
                      {report.report_photos
                        .sort((a, b) => a.photo_order - b.photo_order)
                        .map((photo, index) => (
                          <div key={index} className="space-y-1">
                            <img
                              src={photo.photo_url}
                              alt={`Foto ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {photo.photo_comment}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsList;
