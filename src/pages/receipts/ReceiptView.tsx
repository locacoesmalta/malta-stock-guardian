import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReceiptDetails } from "@/hooks/useReceipts";
import { BackButton } from "@/components/BackButton";
import { Loader2, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import "@/styles/receipt-full-print.css";

export const ReceiptView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: receipt, isLoading } = useReceiptDetails(id);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="container mx-auto p-6">
        <BackButton />
        <p className="text-center mt-8">Comprovante não encontrado</p>
      </div>
    );
  }

  const title = receipt.receipt_type === 'entrega'
    ? 'COMPROVANTE DE ENTREGA DE EQUIPAMENTOS'
    : 'COMPROVANTE DE DEVOLUÇÃO DE EQUIPAMENTOS';

  // Coletar todas as fotos dos items
  const allPhotos = receipt.items.flatMap((item) => {
    if (!item.photos || item.photos.length === 0) return [];
    return item.photos.map((photoUrl: string, index: number) => ({
      url: photoUrl,
      pat: item.pat_code || 'N/A',
      specification: item.specification,
      comment: `Foto ${index + 1} de ${item.photos.length}`,
    }));
  });

  const hasPhotos = allPhotos.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="print:hidden mb-4 flex items-center justify-between">
        <BackButton />
        <div className="flex gap-2">
          {receipt.pdf_url && (
            <Button 
              variant="outline"
              onClick={() => window.open(receipt.pdf_url, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF Original
            </Button>
          )}
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <Card className="receipt-full-print">
        <CardHeader className="receipt-full-print-header bg-primary text-primary-foreground">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <img
                src="/malta-logo.webp"
                alt="Malta Locações"
                className="h-12 w-12 object-contain bg-white rounded p-1"
              />
              <div>
                <h1 className="text-xl font-bold">MALTA LOCAÇÕES</h1>
                <p className="text-sm">DE MÁQUINAS E EQUIPAMENTOS</p>
                <p className="text-xs">Fones: 91 98605-4851 / 91 98421-1123</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">N°</p>
              <p className="text-2xl font-bold">{receipt.receipt_number}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className={`receipt-title receipt-title-${receipt.receipt_type}`}>
            {title}
          </div>

          <div className="receipt-info-grid grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Cliente:</span> {receipt.client_name}
            </div>
            <div>
              <span className="font-semibold">Obra:</span> {receipt.work_site}
            </div>
            <div>
              <span className="font-semibold">Data:</span>{" "}
              {format(new Date(receipt.receipt_date), "dd/MM/yyyy", { locale: ptBR })}
            </div>
            {receipt.operation_nature && (
              <div>
                <span className="font-semibold">Natureza da Operação:</span> {receipt.operation_nature}
              </div>
            )}
            <div>
              <span className="font-semibold">Recebido por:</span> {receipt.received_by}
            </div>
            {receipt.whatsapp && (
              <div>
                <span className="font-semibold">WhatsApp:</span> {receipt.whatsapp}
              </div>
            )}
            {receipt.malta_operator && (
              <div>
                <span className="font-semibold">Responsável Malta:</span> {receipt.malta_operator}
              </div>
            )}
          </div>

          <table className="receipt-equipment-table border rounded-lg overflow-hidden w-full">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 text-left font-semibold text-sm w-16">QUANT.</th>
                <th className="p-3 text-left font-semibold text-sm">ESPECIFICAÇÃO</th>
                <th className="p-3 text-left font-semibold text-sm w-24">PAT</th>
                <th className="p-3 text-left font-semibold text-sm w-48">COMENTÁRIOS</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {receipt.items.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.specification}</td>
                  <td className="p-3">{item.pat_code || '-'}</td>
                  <td className="p-3">{(item as any).equipment_comments || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-signature-section grid grid-cols-2 gap-4 pt-4 border-t">
            {receipt.received_by_malta && (
              <div className="receipt-signature-box">
                <h3 className="font-semibold text-sm mb-2">Recebido por Malta:</h3>
                <p className="text-sm whitespace-pre-wrap">{receipt.received_by_malta}</p>
              </div>
            )}
            <div className="receipt-signature-box">
              <h3 className="font-semibold text-sm mb-2">Assinatura do Cliente:</h3>
              {receipt.signature ? (
                <div className="border-2 border-muted-foreground/30 rounded-md p-2 bg-white">
                  <img 
                    src={receipt.signature} 
                    alt="Assinatura do Cliente" 
                    className="receipt-signature-img w-full h-auto max-h-[120px] object-contain"
                  />
                  <div className="receipt-signature-footer border-t border-muted-foreground/50 pt-2 mt-2">
                    <p className="text-xs text-center text-muted-foreground">
                      {receipt.received_by}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-md p-4 min-h-[120px] bg-muted/10 print:bg-white">
                  <div className="h-16"></div>
                  <div className="receipt-signature-footer border-t border-muted-foreground/50 pt-2 mt-2">
                    <p className="text-xs text-center text-muted-foreground">
                      {receipt.received_by}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO DE FOTOS - Renderizada em página separada */}
      {hasPhotos && (
        <Card className="receipt-full-print mt-8 print:mt-0">
          <CardContent className="receipt-photos-section pt-6">
            <h2 className="receipt-photos-title">REGISTRO FOTOGRÁFICO DOS EQUIPAMENTOS</h2>
            <div className="receipt-photos-grid">
              {allPhotos.map((photo, index) => (
                <div key={index} className="receipt-photo-item">
                  <img 
                    src={photo.url} 
                    alt={`Foto ${index + 1}`} 
                    className="receipt-photo-img"
                  />
                  <div className="receipt-photo-caption">
                    <p><strong>PAT:</strong> {photo.pat}</p>
                    <p><strong>Especificação:</strong> {photo.specification}</p>
                    <p className="text-muted-foreground">{photo.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReceiptView;
