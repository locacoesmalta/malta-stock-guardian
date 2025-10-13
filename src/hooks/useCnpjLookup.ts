import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface CnpjData {
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  ddd_telefone_1?: string;
  email?: string;
}

interface CnpjLookupResult {
  company_name: string;
  address: string;
  contact_phone: string;
  contact_email: string;
}

const cleanCnpj = (cnpj: string): string => {
  return cnpj.replace(/[^\d]/g, "");
};

const fetchCnpjData = async (cnpj: string): Promise<CnpjLookupResult> => {
  const cleanedCnpj = cleanCnpj(cnpj);
  
  if (cleanedCnpj.length !== 14) {
    throw new Error("CNPJ deve conter 14 dígitos");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanedCnpj}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("CNPJ não encontrado na Receita Federal");
      }
      throw new Error("Erro ao consultar CNPJ");
    }

    const data: CnpjData = await response.json();

    // Build address string
    const addressParts = [
      data.logradouro,
      data.numero,
      data.complemento,
      data.bairro,
      data.municipio,
      data.uf,
      data.cep,
    ].filter(Boolean);

    return {
      company_name: data.razao_social || data.nome_fantasia || "",
      address: addressParts.join(", "),
      contact_phone: data.ddd_telefone_1 || "",
      contact_email: data.email || "",
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      throw new Error("Consulta demorou muito. Tente novamente.");
    }
    throw error;
  }
};

export const useCnpjLookup = () => {
  return useMutation({
    mutationFn: fetchCnpjData,
    onSuccess: () => {
      toast({
        title: "CNPJ encontrado",
        description: "Dados preenchidos automaticamente. Você pode editá-los se necessário.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao consultar CNPJ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const formatCnpj = (value: string): string => {
  const cleaned = cleanCnpj(value);
  
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
  if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
  if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
};

export const validateCnpj = (cnpj: string): boolean => {
  const cleaned = cleanCnpj(cnpj);
  return cleaned.length === 14;
};
