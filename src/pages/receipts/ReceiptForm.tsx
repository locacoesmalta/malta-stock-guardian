import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useReceipts, ReceiptType, ReceiptItem } from "@/hooks/useReceipts";
import { useReceiptNumber } from "@/hooks/useReceiptNumber";
import { ReceiptItemsTable } from "@/components/ReceiptItemsTable";
import { Loader2, Save, Printer } from "lucide-react";
import { BackButton } from "@/components/BackButton";

interface ReceiptFormProps {
  type: ReceiptType;
}

export const ReceiptForm = ({ type }: ReceiptFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createReceipt } = useReceipts();
  const { data: receiptNumber, isLoading: isLoadingNumber } = useReceiptNumber(type);

  const [formData, setFormData] = useState({
    client_name: '',
    work_site: '',
    receipt_date: new Date().toISOString().split('T')[0],
    operation_nature: '',
    received_by: '',
    received_by_cpf: '',
    received_by_malta: '',
    signature: '',
  });

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData({ ...formData, received_by_cpf: formatted });
  };

  const [items, setItems] = useState<ReceiptItem[]>([
    { quantity: 1, specification: '', item_order: 1 },
  ]);

  const title = type === 'entrega' 
    ? 'COMPROVANTE DE ENTREGA DE EQUIPAMENTOS'
    : 'COMPROVANTE DE DEVOLUÇÃO DE EQUIPAMENTOS';

  const handleSubmit = async (e: React.FormEvent, shouldPrint = false) => {
    e.preventDefault();

    if (!receiptNumber) {
      return;
    }

    const hasEmptySpecification = items.some(item => !item.specification.trim());
    if (hasEmptySpecification) {
      return;
    }

    // Validar CPF (11 dígitos)
    const cpfNumbers = formData.received_by_cpf.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) {
      return;
    }

    await createReceipt.mutateAsync({
      ...formData,
      receipt_number: receiptNumber,
      receipt_type: type,
      created_by: user?.id,
      items,
    });

    if (shouldPrint) {
      // TODO: Implementar impressão
    }

    navigate('/receipts/history');
  };

  if (isLoadingNumber) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <BackButton />
      
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 mt-4">
        <Card>
          <CardHeader className="bg-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/malta-logo.webp" 
                  alt="Malta Locações" 
                  className="h-12 w-12 object-contain bg-white rounded p-1"
                />
                <div>
                  <CardTitle className="text-xl">MALTA LOCAÇÕES</CardTitle>
                  <p className="text-sm opacity-90">DE MÁQUINAS E EQUIPAMENTOS</p>
                  <p className="text-xs opacity-75">Fones: 91 98605-4851 / 91 98421-1123</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm">N°</p>
                <p className="text-2xl font-bold">{receiptNumber}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-bold">{title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Cliente *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_site">Obra *</Label>
                <Input
                  id="work_site"
                  value={formData.work_site}
                  onChange={(e) => setFormData({ ...formData, work_site: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_date">Data *</Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={formData.receipt_date}
                  onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operation_nature">Natureza da Operação</Label>
                <Input
                  id="operation_nature"
                  value={formData.operation_nature}
                  onChange={(e) => setFormData({ ...formData, operation_nature: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_by">Recebido por (Nome Completo) *</Label>
                <Input
                  id="received_by"
                  value={formData.received_by}
                  onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="received_by_cpf">CPF *</Label>
                <Input
                  id="received_by_cpf"
                  value={formData.received_by_cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Equipamentos *</Label>
              <ReceiptItemsTable
                items={items}
                onChange={setItems}
                disabled={createReceipt.isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="received_by_malta">Recebido por Malta</Label>
                <Textarea
                  id="received_by_malta"
                  value={formData.received_by_malta}
                  onChange={(e) => setFormData({ ...formData, received_by_malta: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature">Espaço para Assinatura do Cliente</Label>
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-md p-4 min-h-[100px] bg-muted/10">
                  <p className="text-xs text-muted-foreground text-center">
                    Espaço reservado para assinatura
                  </p>
                  <div className="mt-8 border-t border-muted-foreground/30 pt-2">
                    <p className="text-xs text-center text-muted-foreground">Assinatura do Cliente</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/receipts/history')}
                disabled={createReceipt.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createReceipt.isPending}
              >
                {createReceipt.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={(e: any) => handleSubmit(e, true)}
                disabled={createReceipt.isPending}
              >
                <Printer className="h-4 w-4 mr-2" />
                Salvar e Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default ReceiptForm;
