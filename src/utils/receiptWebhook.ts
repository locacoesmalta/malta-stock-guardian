import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptItem {
  pat_code?: string;
  specification: string;
  quantity: number;
}

interface ReceiptWebhookData {
  receipt_number: number;
  receipt_type: "entrega" | "devolucao";
  client_name: string;
  work_site: string;
  receipt_date: string;
  operation_nature?: string;
  received_by: string;
  received_by_cpf: string;
  whatsapp?: string;
  malta_operator: string;
  received_by_malta?: string;
  items: ReceiptItem[];
}

/**
 * Formata o número de WhatsApp para o formato +55XXXXXXXXXXX
 */
const formatWhatsAppForWebhook = (whatsapp?: string): string => {
  if (!whatsapp) return "";

  // Remove todos os caracteres não numéricos
  const numbers = whatsapp.replace(/\D/g, "");

  // Se já tem o código do país, retorna com +
  if (numbers.startsWith("55")) {
    return `+${numbers}`;
  }

  // Adiciona o código do país +55
  return `+55${numbers}`;
};

/**
 * Gera o PDF do recibo diretamente dos dados
 */
export const generateReceiptPDF = async (data: ReceiptWebhookData): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Configurações
  let y = 20;
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);

  // Cabeçalho
  pdf.setFillColor(0, 51, 153); // Azul Malta
  pdf.rect(0, 0, pageWidth, 40, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text("MALTA LOCAÇÕES", margin, 15);
  
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("DE MÁQUINAS E EQUIPAMENTOS", margin, 22);
  
  pdf.setFontSize(9);
  pdf.text("Fones: 91 98605-4851 / 91 98421-1123", margin, 28);
  
  // Número do recibo
  pdf.setFontSize(10);
  pdf.text("N°", pageWidth - margin - 20, 15);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.receipt_number.toString(), pageWidth - margin - 20, 25);

  y = 50;

  // Título
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  const title = data.receipt_type === "entrega" 
    ? "COMPROVANTE DE ENTREGA DE EQUIPAMENTOS"
    : "COMPROVANTE DE DEVOLUÇÃO DE EQUIPAMENTOS";
  pdf.text(title, pageWidth / 2, y, { align: "center" });

  y += 15;

  // Informações
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Cliente: ", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.client_name, margin + 20, y);

  pdf.setFont("helvetica", "bold");
  pdf.text("Obra: ", pageWidth / 2 + 10, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.work_site, pageWidth / 2 + 25, y);

  y += 7;

  pdf.setFont("helvetica", "bold");
  pdf.text("Data: ", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.receipt_date, margin + 20, y);

  if (data.operation_nature) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Natureza da Operação: ", pageWidth / 2 + 10, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.operation_nature, pageWidth / 2 + 50, y);
  }

  y += 7;

  pdf.setFont("helvetica", "bold");
  pdf.text("Recebido por: ", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.received_by, margin + 30, y);

  pdf.setFont("helvetica", "bold");
  pdf.text("CPF: ", pageWidth / 2 + 10, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.received_by_cpf, pageWidth / 2 + 23, y);

  y += 7;

  if (data.whatsapp) {
    pdf.setFont("helvetica", "bold");
    pdf.text("WhatsApp: ", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.whatsapp, margin + 25, y);
    y += 7;
  }

  if (data.malta_operator) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Responsável Malta: ", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.malta_operator, margin + 40, y);
    y += 7;
  }

  if (data.received_by_malta) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Recebido por Malta: ", margin, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.received_by_malta, margin + 40, y);
    y += 7;
  }

  y += 5;

  // Tabela de itens
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, "F");
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("QUANT.", margin + 2, y + 5);
  pdf.text("ESPECIFICAÇÃO", margin + 20, y + 5);
  if (data.items.some(item => item.pat_code)) {
    pdf.text("PAT", pageWidth - margin - 25, y + 5);
  }

  y += 8;

  // Itens
  pdf.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(item.quantity.toString(), margin + 2, y + 5);
    
    const specLines = pdf.splitTextToSize(item.specification, contentWidth - 40);
    pdf.text(specLines, margin + 20, y + 5);
    
    if (item.pat_code) {
      pdf.text(item.pat_code, pageWidth - margin - 25, y + 5);
    }

    const lineHeight = Math.max(specLines.length * 5, 8);
    pdf.line(margin, y + lineHeight, pageWidth - margin, y + lineHeight);
    y += lineHeight;
  });

  return pdf.output("blob");
};

/**
 * Envia o PDF e os dados do recibo para o webhook
 */
export const sendReceiptToWebhook = async (
  receiptData: ReceiptWebhookData,
): Promise<void> => {
  try {
    // Gera o PDF
    const pdfBlob = await generateReceiptPDF(receiptData);

    // Define a URL do webhook (fixa para todos os tipos)
    const webhookUrl = "https://webhook.7arrows.pro/webhook/relatorio";

    // Prepara os dados para envio
    const formData = new FormData();
    formData.append("pdf", pdfBlob, "receipt.pdf");
    formData.append("numero_recibo", receiptData.receipt_number.toString());
    formData.append("tipo_recibo", receiptData.receipt_type === "entrega" ? "Entrega" : "Devolução");
    formData.append("cliente", receiptData.client_name);
    formData.append("obra", receiptData.work_site);
    formData.append("data", receiptData.receipt_date);
    formData.append("natureza_operacao", receiptData.operation_nature || "");
    formData.append("recebido_por", receiptData.received_by);
    formData.append("cpf", receiptData.received_by_cpf);
    formData.append("whatsapp", formatWhatsAppForWebhook(receiptData.whatsapp));
    formData.append("responsavel_malta", receiptData.malta_operator);
    formData.append("recebido_por_malta", receiptData.received_by_malta || "");
    
    // Adiciona os itens do recibo (PAT e Especificação)
    formData.append("itens", JSON.stringify(receiptData.items.map(item => ({
      pat: item.pat_code || "",
      especificacao: item.specification,
      quantidade: item.quantity
    }))));

    // Envia para o webhook
    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Webhook retornou status ${response.status}`);
    }

    console.log("Recibo enviado ao webhook com sucesso");
  } catch (error) {
    console.error("Erro ao enviar recibo ao webhook:", error);
    // Não lança o erro para não afetar o fluxo principal
  }
};
