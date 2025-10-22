import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptWebhookData {
  client_name: string;
  work_site: string;
  receipt_date: string;
  operation_nature?: string;
  received_by: string;
  whatsapp?: string;
  malta_operator: string;
  receipt_type: "entrega" | "devolucao";
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
 * Gera o PDF do recibo a partir do elemento HTML
 */
const generateReceiptPDF = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Elemento do recibo não encontrado");
  }

  // Captura o elemento como canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  // Cria o PDF
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

  return pdf.output("blob");
};

/**
 * Envia o PDF e os dados do recibo para o webhook
 */
export const sendReceiptToWebhook = async (
  receiptData: ReceiptWebhookData,
  receiptElementId: string,
): Promise<void> => {
  try {
    // Gera o PDF
    const pdfBlob = await generateReceiptPDF(receiptElementId);

    // Define a URL do webhook baseado no tipo de recebimento
    const webhookUrl =
      receiptData.receipt_type === "entrega"
        ? "https://webhook.7arrows.pro/webhook/relatorio"
        : "https://webhook.7arrows.pro/webhook/relatorio";

    // Prepara os dados para envio
    const formData = new FormData();
    formData.append("pdf", pdfBlob, "receipt.pdf");
    formData.append("cliente", receiptData.client_name);
    formData.append("obra", receiptData.work_site);
    formData.append("data", receiptData.receipt_date);
    formData.append("natureza_operacao", receiptData.operation_nature || "");
    formData.append("recebido_por", receiptData.received_by);
    formData.append("whatsapp", formatWhatsAppForWebhook(receiptData.whatsapp));
    formData.append("responsavel_malta", receiptData.malta_operator);

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
