import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// Campos técnicos que devem ser ocultados
const HIDDEN_FIELDS = [
  "available_for_rental",
  "qr_code_data",
  "updated_at",
  "created_at",
  "id",
  "created_by",
  "deleted_at",
];

// Labels amigáveis para location_type
const LOCATION_LABELS: Record<string, string> = {
  deposito_malta: "Depósito Malta",
  em_manutencao: "Em Manutenção",
  locacao: "Locação",
  aguardando_laudo: "Aguardando Laudo",
  liberado_locacao: "Liberado para Locação",
};

// Labels amigáveis para campos
const FIELD_LABELS: Record<string, string> = {
  location_type: "Local do Equipamento",
  rental_company: "Empresa de Locação",
  rental_work_site: "Obra de Locação",
  maintenance_company: "Empresa de Manutenção",
  maintenance_work_site: "Obra de Manutenção",
  equipment_name: "Nome do Equipamento",
  manufacturer: "Fabricante",
  model: "Modelo",
  serial_number: "Número de Série",
  rental_start_date: "Início da Locação",
  rental_end_date: "Fim da Locação",
  maintenance_arrival_date: "Data de Entrada na Manutenção",
  maintenance_departure_date: "Data de Saída da Manutenção",
};

interface HistoricoItem {
  historico_id: string;
  pat_id: string;
  codigo_pat: string;
  tipo_evento: string;
  campo_alterado: string | null;
  valor_antigo: string | null;
  valor_novo: string | null;
  detalhes_evento: string | null;
  usuario_modificacao: string | null;
  usuario_nome: string | null;
  data_modificacao: string;
  data_evento_real: string | null;
  registro_retroativo: boolean | null;
}

interface GroupedEvent {
  id: string;
  timestamp: string;
  realDate: string | null;
  isRetroactive: boolean;
  user: string;
  type: string;
  friendlyDescription: string;
  emoji: string;
  details: {
    company?: string;
    workSite?: string;
    origin?: string;
    destination?: string;
  };
  rawEvents: HistoricoItem[];
}

/**
 * Formata data para formato brasileiro
 */
export const formatDateBR = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return dateString;
  }
};

/**
 * Formata apenas a data (sem hora)
 */
export const formatDateOnlyBR = (dateString: string): string => {
  try {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
};

/**
 * Traduz valor de location_type para label amigável
 */
export const translateLocation = (value: string | null): string => {
  if (!value) return "-";
  return LOCATION_LABELS[value] || value;
};

/**
 * Traduz nome do campo para label amigável
 */
export const translateFieldName = (field: string | null): string => {
  if (!field) return "-";
  return FIELD_LABELS[field] || field;
};

/**
 * Verifica se um campo deve ser ocultado
 */
export const shouldHideField = (field: string | null): boolean => {
  if (!field) return false;
  return HIDDEN_FIELDS.includes(field.toLowerCase());
};

/**
 * Determina emoji e descrição amigável baseado na transição de location_type
 */
const getMovementDescription = (
  origin: string | null,
  destination: string | null,
  company?: string,
  workSite?: string
): { emoji: string; description: string } => {
  const locationInfo = company && workSite 
    ? `${company} - ${workSite}` 
    : company || workSite || "";

  // Transições específicas
  if (origin === "deposito_malta" && destination === "locacao") {
    return { 
      emoji: "🚚", 
      description: locationInfo ? `Saiu para Locação em ${locationInfo}` : "Saiu para Locação" 
    };
  }
  
  if (origin === "locacao" && destination === "aguardando_laudo") {
    return { emoji: "🔍", description: "Retornou para Laudo" };
  }
  
  if (origin === "locacao" && destination === "em_manutencao") {
    return { 
      emoji: "🔧", 
      description: locationInfo ? `Enviado para Manutenção - ${locationInfo}` : "Enviado para Manutenção" 
    };
  }
  
  if (origin === "em_manutencao" && destination === "deposito_malta") {
    return { emoji: "✅", description: "Retornou da Manutenção para Depósito" };
  }
  
  if (origin === "em_manutencao" && destination === "locacao") {
    return { 
      emoji: "🚚", 
      description: locationInfo ? `Saiu da Manutenção para Locação - ${locationInfo}` : "Saiu da Manutenção para Locação" 
    };
  }
  
  if (origin === "aguardando_laudo" && destination === "deposito_malta") {
    return { emoji: "✅", description: "Liberado - Retornou ao Depósito Malta" };
  }
  
  if (origin === "aguardando_laudo" && destination === "locacao") {
    return { 
      emoji: "🚚", 
      description: locationInfo ? `Liberado - Nova Locação em ${locationInfo}` : "Liberado - Nova Locação" 
    };
  }
  
  if (origin === "aguardando_laudo" && destination === "em_manutencao") {
    return { 
      emoji: "🔧", 
      description: locationInfo ? `Enviado para Manutenção - ${locationInfo}` : "Enviado para Manutenção" 
    };
  }
  
  if (origin === "deposito_malta" && destination === "em_manutencao") {
    return { 
      emoji: "🔧", 
      description: locationInfo ? `Enviado para Manutenção - ${locationInfo}` : "Enviado para Manutenção" 
    };
  }

  // Fallback genérico
  const originLabel = translateLocation(origin);
  const destLabel = translateLocation(destination);
  return { 
    emoji: "📍", 
    description: `Movimentado de ${originLabel} para ${destLabel}` 
  };
};

/**
 * Agrupa eventos que ocorreram no mesmo momento (mesmo timestamp)
 */
export const groupHistoryEvents = (events: HistoricoItem[]): GroupedEvent[] => {
  const grouped = new Map<string, HistoricoItem[]>();
  
  // Agrupa por timestamp
  events.forEach(event => {
    const key = event.data_modificacao;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(event);
  });

  const result: GroupedEvent[] = [];

  grouped.forEach((groupEvents, timestamp) => {
    const firstEvent = groupEvents[0];
    
    // Extrai informações de contexto dos eventos agrupados
    let company: string | undefined;
    let workSite: string | undefined;
    let origin: string | undefined;
    let destination: string | undefined;
    let mainDescription = "";
    let emoji = "📋";

    // Procura por mudança de location_type e dados de empresa/obra
    groupEvents.forEach(event => {
      // Ignora campos técnicos
      if (shouldHideField(event.campo_alterado)) return;

      if (event.campo_alterado === "Local do Equipamento" || event.campo_alterado === "location_type") {
        origin = event.valor_antigo || undefined;
        destination = event.valor_novo || undefined;
      }
      
      if (event.campo_alterado?.includes("rental_company") || event.campo_alterado?.includes("Empresa")) {
        if (event.valor_novo && event.valor_novo !== "-") {
          company = event.valor_novo;
        }
      }
      
      if (event.campo_alterado?.includes("rental_work_site") || event.campo_alterado?.includes("Obra")) {
        if (event.valor_novo && event.valor_novo !== "-") {
          workSite = event.valor_novo;
        }
      }

      if (event.campo_alterado?.includes("maintenance_company")) {
        if (event.valor_novo && event.valor_novo !== "-") {
          company = event.valor_novo;
        }
      }
      
      if (event.campo_alterado?.includes("maintenance_work_site")) {
        if (event.valor_novo && event.valor_novo !== "-") {
          workSite = event.valor_novo;
        }
      }
    });

    // Determina descrição baseada no tipo de evento
    if (firstEvent.tipo_evento === "RETIRADA DE MATERIAL") {
      emoji = "📦";
      mainDescription = firstEvent.detalhes_evento || "Retirada de Material";
    } else if (firstEvent.tipo_evento === "CADASTRO") {
      emoji = "📋";
      mainDescription = "Equipamento Cadastrado";
    } else if (firstEvent.tipo_evento === "CADASTRO RETROATIVO") {
      emoji = "📋";
      mainDescription = "Equipamento Cadastrado (Retroativo)";
    } else if (firstEvent.tipo_evento === "SUBSTITUIÇÃO") {
      emoji = "🔄";
      mainDescription = firstEvent.detalhes_evento || "Substituição de Equipamento";
    } else if (firstEvent.tipo_evento === "MOVIMENTAÇÃO" || origin || destination) {
      const movement = getMovementDescription(origin || null, destination || null, company, workSite);
      emoji = movement.emoji;
      mainDescription = movement.description;
    } else if (firstEvent.detalhes_evento) {
      mainDescription = firstEvent.detalhes_evento;
    } else {
      // Usa o primeiro evento como descrição
      mainDescription = firstEvent.tipo_evento || "Alteração";
    }

    result.push({
      id: firstEvent.historico_id,
      timestamp,
      realDate: firstEvent.data_evento_real,
      isRetroactive: firstEvent.registro_retroativo || false,
      user: firstEvent.usuario_nome || "Sistema",
      type: firstEvent.tipo_evento,
      friendlyDescription: mainDescription,
      emoji,
      details: {
        company,
        workSite,
        origin,
        destination,
      },
      rawEvents: groupEvents,
    });
  });

  return result;
};
