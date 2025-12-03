// Templates padrão para itens de verificação de manutenção

export type ActionType = "verificar" | "limpeza" | "substituir" | "testar";

export type MaintenanceTarget = "motor" | "alternador";

export type MaintenanceInterval = "h100" | "h200" | "h800" | "h2000";

// Templates de tarefas do MOTOR por intervalo (TOYAMA)
// Estrutura cumulativa: cada intervalo inclui as tarefas dos anteriores
export const MOTOR_TASKS_BY_INTERVAL = {
  // Base: Diário + Semanal + Mensal (sempre incluído)
  base: {
    verificar: [
      "Vazamentos (óleo, arrefecimento, combustível, exaustão)",
      "Nível de óleo",
      "Nível de água",
      "Nível de combustível",
      "Entrada de ar",
      "Fumaça da exaustão (sem carga)",
      "Vibração anormal",
      "Ruído anormal",
      "Cheiro anormal",
      "Parâmetros de funcionamento (sem carga)",
      "Obstrução do sistema de arrefecimento",
      "Tubos e conexões do arrefecimento",
      "Nível de aditivo (anticorrosivo/anticongelante)",
      "Filtro de ar",
      "Tubos e conexões da admissão",
      "Parafuso da exaustão",
      "Correia do alternador",
      "Bateria",
      "Disjuntor",
      "Conector de partida"
    ],
    limpeza: [
      "Grupo gerador (parte externa)"
    ],
    substituir: [] as string[],
    testar: [] as string[]
  },
  
  // 100h = base + específico
  h100: {
    verificar: [
      "Correia e aperto",
      "Ventoinha",
      "Bocal da bomba de combustível",
      "Tubos e conectores de combustível",
      "Bomba de combustível",
      "Operação com ½ carga (partida, fumaça, ruído, vibração, parâmetros)"
    ],
    substituir: [
      "Filtro de óleo",
      "Óleo lubrificante",
      "Filtro de combustível",
      "Núcleo do filtro de ar"
    ],
    limpeza: [
      "Respiro do cárter"
    ],
    testar: [] as string[]
  },
  
  // 200h = 100h + específico
  h200: {
    verificar: [
      "Aperto da base"
    ],
    limpeza: [
      "Bandeja de contenção de líquidos"
    ],
    substituir: [] as string[],
    testar: [] as string[]
  },
  
  // 800h = 200h + específico
  h800: {
    verificar: [
      "Pressão de óleo",
      "Partida",
      "Alternador do motor"
    ],
    substituir: [
      "Água + aditivo do arrefecimento"
    ],
    limpeza: [
      "Sistema de arrefecimento (flush completo)"
    ],
    testar: [] as string[]
  },
  
  // 2000h = 800h + específico
  h2000: {
    verificar: [
      "Resistência da exaustão"
    ],
    limpeza: [] as string[],
    substituir: [] as string[],
    testar: [] as string[]
  }
};

// Função para gerar seções de motor baseado no intervalo selecionado
export const generateMotorSectionsForInterval = (interval: MaintenanceInterval): VerificationSection[] => {
  // Determina quais níveis incluir baseado no intervalo
  const levels: (keyof typeof MOTOR_TASKS_BY_INTERVAL)[] = ["base"];
  if (interval === "h100" || interval === "h200" || interval === "h800" || interval === "h2000") levels.push("h100");
  if (interval === "h200" || interval === "h800" || interval === "h2000") levels.push("h200");
  if (interval === "h800" || interval === "h2000") levels.push("h800");
  if (interval === "h2000") levels.push("h2000");
  
  // Agrupa tarefas por tipo de ação
  const tasksByAction: Record<ActionType, string[]> = { 
    verificar: [], 
    limpeza: [], 
    substituir: [], 
    testar: [] 
  };
  
  levels.forEach(level => {
    const tasks = MOTOR_TASKS_BY_INTERVAL[level];
    (Object.keys(tasks) as ActionType[]).forEach(action => {
      tasksByAction[action].push(...tasks[action]);
    });
  });
  
  // Cria seções organizadas por tipo de ação
  const sections: VerificationSection[] = [];
  
  if (tasksByAction.verificar.length > 0) {
    sections.push({
      id: generateSectionId(),
      title: "🔧 MOTOR - Verificações",
      category: "motor",
      items: tasksByAction.verificar.map(desc => ({
        id: generateItemId(),
        maintenanceTarget: "motor" as MaintenanceTarget,
        actionType: "verificar" as ActionType,
        description: desc,
        h50: false,
        h100: interval === "h100" || interval === "h200" || interval === "h800" || interval === "h2000",
        h200: interval === "h200" || interval === "h800" || interval === "h2000",
        h800: interval === "h800" || interval === "h2000",
        h2000: interval === "h2000"
      }))
    });
  }
  
  if (tasksByAction.substituir.length > 0) {
    sections.push({
      id: generateSectionId(),
      title: "🔧 MOTOR - Substituições",
      category: "motor",
      items: tasksByAction.substituir.map(desc => ({
        id: generateItemId(),
        maintenanceTarget: "motor" as MaintenanceTarget,
        actionType: "substituir" as ActionType,
        description: desc,
        h50: false,
        h100: interval === "h100" || interval === "h200" || interval === "h800" || interval === "h2000",
        h200: interval === "h200" || interval === "h800" || interval === "h2000",
        h800: interval === "h800" || interval === "h2000",
        h2000: interval === "h2000"
      }))
    });
  }
  
  if (tasksByAction.limpeza.length > 0) {
    sections.push({
      id: generateSectionId(),
      title: "🔧 MOTOR - Limpeza",
      category: "motor",
      items: tasksByAction.limpeza.map(desc => ({
        id: generateItemId(),
        maintenanceTarget: "motor" as MaintenanceTarget,
        actionType: "limpeza" as ActionType,
        description: desc,
        h50: false,
        h100: interval === "h100" || interval === "h200" || interval === "h800" || interval === "h2000",
        h200: interval === "h200" || interval === "h800" || interval === "h2000",
        h800: interval === "h800" || interval === "h2000",
        h2000: interval === "h2000"
      }))
    });
  }
  
  if (tasksByAction.testar.length > 0) {
    sections.push({
      id: generateSectionId(),
      title: "🔧 MOTOR - Testes",
      category: "motor",
      items: tasksByAction.testar.map(desc => ({
        id: generateItemId(),
        maintenanceTarget: "motor" as MaintenanceTarget,
        actionType: "testar" as ActionType,
        description: desc,
        h50: false,
        h100: interval === "h100" || interval === "h200" || interval === "h800" || interval === "h2000",
        h200: interval === "h200" || interval === "h800" || interval === "h2000",
        h800: interval === "h800" || interval === "h2000",
        h2000: interval === "h2000"
      }))
    });
  }
  
  return sections;
};

export interface VerificationItem {
  id: string;
  maintenanceTarget?: MaintenanceTarget;
  actionType?: ActionType;
  description: string;
  h50: boolean;
  h100: boolean;
  h200: boolean;
  h800: boolean;
  h2000: boolean;
}

export type MaintenanceCategory = "motor" | "alternador" | "geral";

export interface VerificationSection {
  id: string;
  title: string;
  category?: MaintenanceCategory;
  items: VerificationItem[];
}

// Template padrão para geradores
export const DEFAULT_GENERATOR_SECTIONS: VerificationSection[] = [
  {
    id: "lubrication",
    title: "Sistema de Lubrificação",
    items: [
      { id: "lub-1", description: "Verificar nível de óleo do motor", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "lub-2", description: "Trocar óleo do motor", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "lub-3", description: "Trocar filtro de óleo", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "lub-4", description: "Verificar vazamentos de óleo", h50: true, h100: false, h200: false, h800: false, h2000: false },
    ],
  },
  {
    id: "fuel",
    title: "Sistema de Combustível",
    items: [
      { id: "fuel-1", description: "Drenar água do tanque de combustível", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "fuel-2", description: "Trocar filtro de combustível primário", h50: false, h100: false, h200: true, h800: false, h2000: false },
      { id: "fuel-3", description: "Trocar filtro de combustível secundário", h50: false, h100: false, h200: true, h800: false, h2000: false },
      { id: "fuel-4", description: "Verificar mangueiras e conexões", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "fuel-5", description: "Limpar tanque de combustível", h50: false, h100: false, h200: false, h800: true, h2000: false },
    ],
  },
  {
    id: "cooling",
    title: "Sistema de Arrefecimento",
    items: [
      { id: "cool-1", description: "Verificar nível do líquido de arrefecimento", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "cool-2", description: "Verificar correias", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "cool-3", description: "Trocar líquido de arrefecimento", h50: false, h100: false, h200: false, h800: false, h2000: true },
      { id: "cool-4", description: "Limpar radiador", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "cool-5", description: "Verificar funcionamento do termostato", h50: false, h100: false, h200: false, h800: true, h2000: false },
    ],
  },
  {
    id: "air",
    title: "Sistema de Admissão de Ar",
    items: [
      { id: "air-1", description: "Limpar filtro de ar primário", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "air-2", description: "Trocar filtro de ar primário", h50: false, h100: false, h200: true, h800: false, h2000: false },
      { id: "air-3", description: "Trocar filtro de ar secundário", h50: false, h100: false, h200: false, h800: true, h2000: false },
      { id: "air-4", description: "Verificar dutos e conexões", h50: false, h100: true, h200: false, h800: false, h2000: false },
    ],
  },
  {
    id: "electrical",
    title: "Sistema Elétrico",
    items: [
      { id: "elec-1", description: "Verificar tensão da bateria", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "elec-2", description: "Verificar terminais da bateria", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "elec-3", description: "Verificar alternador de carga", h50: false, h100: false, h200: true, h800: false, h2000: false },
      { id: "elec-4", description: "Verificar motor de partida", h50: false, h100: false, h200: false, h800: true, h2000: false },
    ],
  },
  {
    id: "generator",
    title: "Gerador",
    items: [
      { id: "gen-1", description: "Verificar tensão de saída", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "gen-2", description: "Verificar frequência", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "gen-3", description: "Verificar aquecimento do gerador", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "gen-4", description: "Limpar/Verificar enrolamentos", h50: false, h100: false, h200: false, h800: true, h2000: false },
      { id: "gen-5", description: "Verificar rolamentos", h50: false, h100: false, h200: false, h800: false, h2000: true },
    ],
  },
  {
    id: "general",
    title: "Verificações Gerais",
    items: [
      { id: "gen-1", description: "Verificar parafusos e fixações", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "gen-2", description: "Verificar suportes antivibração", h50: false, h100: false, h200: true, h800: false, h2000: false },
      { id: "gen-3", description: "Verificar escapamento", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "gen-4", description: "Limpeza geral do equipamento", h50: true, h100: false, h200: false, h800: false, h2000: false },
    ],
  },
];

// Template padrão genérico
export const DEFAULT_GENERIC_SECTIONS: VerificationSection[] = [
  {
    id: "general-check",
    title: "Verificações Gerais",
    items: [
      { id: "gc-1", description: "Verificação visual do equipamento", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "gc-2", description: "Verificar nível de óleo/lubrificante", h50: true, h100: false, h200: false, h800: false, h2000: false },
      { id: "gc-3", description: "Verificar conexões e fixações", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "gc-4", description: "Limpeza geral", h50: true, h100: false, h200: false, h800: false, h2000: false },
    ],
  },
  {
    id: "preventive",
    title: "Manutenção Preventiva",
    items: [
      { id: "prev-1", description: "Troca de óleo/lubrificante", h50: false, h100: true, h200: false, h800: false, h2000: false },
      { id: "prev-2", description: "Troca de filtros", h50: false, h100: false, h200: true, h800: false, h2000: false },
      { id: "prev-3", description: "Verificar desgaste de peças", h50: false, h100: false, h200: false, h800: true, h2000: false },
      { id: "prev-4", description: "Revisão completa", h50: false, h100: false, h200: false, h800: false, h2000: true },
    ],
  },
];

// Função para criar ID único
export const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
export const generateSectionId = () => `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Criar item vazio
export const createEmptyItem = (defaultTarget?: MaintenanceTarget): VerificationItem => ({
  id: generateItemId(),
  maintenanceTarget: defaultTarget || "motor",
  actionType: "verificar",
  description: "",
  h50: false,
  h100: false,
  h200: false,
  h800: false,
  h2000: false,
});

// Criar seção vazia
export const createEmptySection = (category?: MaintenanceCategory): VerificationSection => ({
  id: generateSectionId(),
  title: category === "motor" 
    ? "🔧 MOTOR - Nova Seção" 
    : category === "alternador" 
      ? "⚡ ALTERNADOR - Nova Seção" 
      : "Nova Seção",
  category,
  items: [createEmptyItem()],
});

// Criar seções vazias para Motor
export const createMotorSections = (): VerificationSection[] => [
  {
    id: generateSectionId(),
    title: "🔧 MOTOR - Sistema de Lubrificação",
    category: "motor",
    items: [createEmptyItem()],
  },
  {
    id: generateSectionId(),
    title: "🔧 MOTOR - Sistema de Combustível",
    category: "motor",
    items: [createEmptyItem()],
  },
  {
    id: generateSectionId(),
    title: "🔧 MOTOR - Sistema de Arrefecimento",
    category: "motor",
    items: [createEmptyItem()],
  },
  {
    id: generateSectionId(),
    title: "🔧 MOTOR - Sistema Elétrico",
    category: "motor",
    items: [createEmptyItem()],
  },
];

// Criar seções vazias para Alternador
export const createAlternadorSections = (): VerificationSection[] => [
  {
    id: generateSectionId(),
    title: "⚡ ALTERNADOR - Verificações Elétricas",
    category: "alternador",
    items: [createEmptyItem()],
  },
  {
    id: generateSectionId(),
    title: "⚡ ALTERNADOR - Enrolamentos e Isolamento",
    category: "alternador",
    items: [createEmptyItem()],
  },
  {
    id: generateSectionId(),
    title: "⚡ ALTERNADOR - Sistema de Excitação",
    category: "alternador",
    items: [createEmptyItem()],
  },
];

// Obter template por tipo de equipamento
export const getDefaultSections = (equipmentName?: string): VerificationSection[] => {
  if (!equipmentName) return DEFAULT_GENERIC_SECTIONS;
  
  const name = equipmentName.toLowerCase();
  if (name.includes("gerador") || name.includes("generator")) {
    return DEFAULT_GENERATOR_SECTIONS;
  }
  
  return DEFAULT_GENERIC_SECTIONS;
};
