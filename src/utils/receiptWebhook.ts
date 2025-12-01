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
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Configurações para landscape
  let y = 20;
  const pageWidth = 297; // A4 landscape
  const pageHeight = 210;
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

  // Título com cor por tipo
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  const title = data.receipt_type === "entrega" 
    ? "COMPROVANTE DE ENTREGA DE EQUIPAMENTOS"
    : "COMPROVANTE DE DEVOLUÇÃO DE EQUIPAMENTOS";
  
  // Fundo colorido para o título
  if (data.receipt_type === "entrega") {
    pdf.setFillColor(220, 252, 231); // Verde claro
    pdf.setTextColor(22, 101, 52); // Verde escuro
  } else {
    pdf.setFillColor(254, 226, 226); // Vermelho claro
    pdf.setTextColor(153, 27, 27); // Vermelho escuro
  }
  pdf.rect(margin, y - 8, contentWidth, 12, "F");
  pdf.text(title, pageWidth / 2, y, { align: "center" });
  
  pdf.setTextColor(0, 0, 0);
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

  // Tabela de itens com comentários
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, "F");
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.text("QUANT.", margin + 2, y + 5);
  pdf.text("ESPECIFICAÇÃO", margin + 25, y + 5);
  pdf.text("PAT", pageWidth / 2 + 30, y + 5);
  pdf.text("COMENTÁRIOS", pageWidth / 2 + 60, y + 5);

  y += 8;

  // Itens
  pdf.setFont("helvetica", "normal");
  data.items.forEach((item) => {
    if (y > 170) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(item.quantity.toString(), margin + 2, y + 5);
    
    const specLines = pdf.splitTextToSize(item.specification, 90);
    pdf.text(specLines, margin + 25, y + 5);
    
    if (item.pat_code) {
      pdf.text(item.pat_code, pageWidth / 2 + 30, y + 5);
    }

    const lineHeight = Math.max(specLines.length * 5, 8);
    pdf.line(margin, y + lineHeight, pageWidth - margin, y + lineHeight);
    y += lineHeight;
  });

  // Assinatura
  y += 10;
  if (y > 150) {
    pdf.addPage();
    y = 20;
  }
  
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Assinatura do Cliente", margin, y);
  pdf.rect(margin, y + 5, 80, 30);
  y += 40;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(data.received_by, margin + 40, y, { align: "center" });
  pdf.text(`CPF: ${data.received_by_cpf}`, margin + 40, y + 5, { align: "center" });

  // SEÇÃO DE FOTOS (se houver)
  const itemsWithPhotos = data.items.filter(item => (item as any).photos && (item as any).photos.length > 0);
  
  if (itemsWithPhotos.length > 0) {
    pdf.addPage(); // Nova página para fotos
    
    // Título da seção de fotos
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 51, 153); // Azul Malta
    pdf.text("REGISTRO FOTOGRÁFICO DOS EQUIPAMENTOS", pageWidth / 2, 20, { align: "center" });
    pdf.line(margin, 25, pageWidth - margin, 25);
    
    pdf.setTextColor(0, 0, 0);
    
    let photoX = margin;
    let photoY = 35;
    let photoCount = 0;
    const photoWidth = 123.7; // 12.37cm
    const photoHeight = 68.1; // 6.81cm
    const photoGap = 10; // 1cm
    
    for (const item of itemsWithPhotos) {
      const photos = (item as any).photos || [];
      
      for (const photoUrl of photos) {
        try {
          // Adicionar foto
          pdf.addImage(photoUrl, 'JPEG', photoX, photoY, photoWidth, photoHeight);
          
          // Legenda
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "bold");
          pdf.text(`PAT: ${item.pat_code || 'N/A'}`, photoX, photoY + photoHeight + 5);
          pdf.setFont("helvetica", "normal");
          const specText = pdf.splitTextToSize(item.specification, photoWidth);
          pdf.text(specText, photoX, photoY + photoHeight + 10);
          
          photoCount++;
          
          // Posicionar próxima foto (grid 2x2)
          if (photoCount % 2 === 0) {
            photoX = margin;
            photoY += photoHeight + 20; // Próxima linha
          } else {
            photoX += photoWidth + photoGap; // Próxima coluna
          }
          
          // Nova página a cada 4 fotos
          if (photoCount % 4 === 0 && photoCount < itemsWithPhotos.length * photos.length) {
            pdf.addPage();
            photoX = margin;
            photoY = 20;
          }
        } catch (error) {
          console.error('Erro ao adicionar foto ao PDF:', error);
        }
      }
    }
  }

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

    // Envia via edge function segura
    const { sendReceiptWebhook } = await import("@/lib/webhookClient");
    await sendReceiptWebhook(
      {
        numero_recibo: receiptData.receipt_number.toString(),
        tipo_recibo: receiptData.receipt_type === "entrega" ? "Entrega" : "Devolução",
        cliente: receiptData.client_name,
        obra: receiptData.work_site,
        data: receiptData.receipt_date,
        natureza_operacao: receiptData.operation_nature || "",
        recebido_por: receiptData.received_by,
        cpf: receiptData.received_by_cpf,
        whatsapp: formatWhatsAppForWebhook(receiptData.whatsapp),
        responsavel_malta: receiptData.malta_operator,
        recebido_por_malta: receiptData.received_by_malta || "",
        itens: JSON.stringify(receiptData.items.map(item => ({
          pat: item.pat_code || "",
          especificacao: item.specification,
          quantidade: item.quantity
        }))),
      },
      pdfBlob
    );

    console.log("Recibo enviado ao webhook com sucesso via edge function");
  } catch (error) {
    console.error("Erro ao enviar recibo ao webhook:", error);
    // Não lança o erro para não afetar o fluxo principal
  }
};
