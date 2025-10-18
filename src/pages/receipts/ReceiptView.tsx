import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReceiptDetails } from "@/hooks/useReceipts";
import { BackButton } from "@/components/BackButton";
import { Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="print:hidden mb-4 flex items-center justify-between">
        <BackButton />
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      <Card className="receipt-print">
        <CardHeader className="bg-primary text-primary-foreground print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex items-center justify-between">
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
          <div className="text-center">
            <h2 className="text-lg font-bold print:text-xl">{title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
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
            <div className="col-span-2">
              <span className="font-semibold">Recebido por:</span> {receipt.received_by}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted grid grid-cols-12 gap-4 p-3 font-semibold text-sm print:bg-gray-200">
              <div className="col-span-2">QUANT.</div>
              <div className="col-span-10">ESPECIFICAÇÃO</div>
            </div>
            <div className="divide-y">
              {receipt.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-3 text-sm">
                  <div className="col-span-2">{item.quantity}</div>
                  <div className="col-span-10">{item.specification}</div>
                </div>
              ))}
            </div>
          </div>

          {(receipt.received_by_malta || receipt.signature) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {receipt.received_by_malta && (
                <div>
                  <p className="font-semibold text-sm mb-2">Recebido por Malta:</p>
                  <p className="text-sm whitespace-pre-wrap">{receipt.received_by_malta}</p>
                </div>
              )}
              {receipt.signature && (
                <div>
                  <p className="font-semibold text-sm mb-2">Assinatura:</p>
                  <p className="text-sm whitespace-pre-wrap">{receipt.signature}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceiptView;
