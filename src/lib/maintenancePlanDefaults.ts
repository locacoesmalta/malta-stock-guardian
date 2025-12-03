// Templates padrão para itens de verificação de manutenção

export interface VerificationItem {
  id: string;
  description: string;
  daily: boolean;
  h250: boolean;
  h500: boolean;
  h1000: boolean;
  h4000: boolean;
}

export interface VerificationSection {
  id: string;
  title: string;
  items: VerificationItem[];
}

// Template padrão para geradores
export const DEFAULT_GENERATOR_SECTIONS: VerificationSection[] = [
  {
    id: "lubrication",
    title: "Sistema de Lubrificação",
    items: [
      { id: "lub-1", description: "Verificar nível de óleo do motor", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "lub-2", description: "Trocar óleo do motor", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "lub-3", description: "Trocar filtro de óleo", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "lub-4", description: "Verificar vazamentos de óleo", daily: true, h250: false, h500: false, h1000: false, h4000: false },
    ],
  },
  {
    id: "fuel",
    title: "Sistema de Combustível",
    items: [
      { id: "fuel-1", description: "Drenar água do tanque de combustível", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "fuel-2", description: "Trocar filtro de combustível primário", daily: false, h250: false, h500: true, h1000: false, h4000: false },
      { id: "fuel-3", description: "Trocar filtro de combustível secundário", daily: false, h250: false, h500: true, h1000: false, h4000: false },
      { id: "fuel-4", description: "Verificar mangueiras e conexões", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "fuel-5", description: "Limpar tanque de combustível", daily: false, h250: false, h500: false, h1000: true, h4000: false },
    ],
  },
  {
    id: "cooling",
    title: "Sistema de Arrefecimento",
    items: [
      { id: "cool-1", description: "Verificar nível do líquido de arrefecimento", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "cool-2", description: "Verificar correias", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "cool-3", description: "Trocar líquido de arrefecimento", daily: false, h250: false, h500: false, h1000: false, h4000: true },
      { id: "cool-4", description: "Limpar radiador", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "cool-5", description: "Verificar funcionamento do termostato", daily: false, h250: false, h500: false, h1000: true, h4000: false },
    ],
  },
  {
    id: "air",
    title: "Sistema de Admissão de Ar",
    items: [
      { id: "air-1", description: "Limpar filtro de ar primário", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "air-2", description: "Trocar filtro de ar primário", daily: false, h250: false, h500: true, h1000: false, h4000: false },
      { id: "air-3", description: "Trocar filtro de ar secundário", daily: false, h250: false, h500: false, h1000: true, h4000: false },
      { id: "air-4", description: "Verificar dutos e conexões", daily: false, h250: true, h500: false, h1000: false, h4000: false },
    ],
  },
  {
    id: "electrical",
    title: "Sistema Elétrico",
    items: [
      { id: "elec-1", description: "Verificar tensão da bateria", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "elec-2", description: "Verificar terminais da bateria", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "elec-3", description: "Verificar alternador de carga", daily: false, h250: false, h500: true, h1000: false, h4000: false },
      { id: "elec-4", description: "Verificar motor de partida", daily: false, h250: false, h500: false, h1000: true, h4000: false },
    ],
  },
  {
    id: "generator",
    title: "Gerador",
    items: [
      { id: "gen-1", description: "Verificar tensão de saída", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "gen-2", description: "Verificar frequência", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "gen-3", description: "Verificar aquecimento do gerador", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "gen-4", description: "Limpar/Verificar enrolamentos", daily: false, h250: false, h500: false, h1000: true, h4000: false },
      { id: "gen-5", description: "Verificar rolamentos", daily: false, h250: false, h500: false, h1000: false, h4000: true },
    ],
  },
  {
    id: "general",
    title: "Verificações Gerais",
    items: [
      { id: "gen-1", description: "Verificar parafusos e fixações", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "gen-2", description: "Verificar suportes antivibração", daily: false, h250: false, h500: true, h1000: false, h4000: false },
      { id: "gen-3", description: "Verificar escapamento", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "gen-4", description: "Limpeza geral do equipamento", daily: true, h250: false, h500: false, h1000: false, h4000: false },
    ],
  },
];

// Template padrão genérico
export const DEFAULT_GENERIC_SECTIONS: VerificationSection[] = [
  {
    id: "general-check",
    title: "Verificações Gerais",
    items: [
      { id: "gc-1", description: "Verificação visual do equipamento", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "gc-2", description: "Verificar nível de óleo/lubrificante", daily: true, h250: false, h500: false, h1000: false, h4000: false },
      { id: "gc-3", description: "Verificar conexões e fixações", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "gc-4", description: "Limpeza geral", daily: true, h250: false, h500: false, h1000: false, h4000: false },
    ],
  },
  {
    id: "preventive",
    title: "Manutenção Preventiva",
    items: [
      { id: "prev-1", description: "Troca de óleo/lubrificante", daily: false, h250: true, h500: false, h1000: false, h4000: false },
      { id: "prev-2", description: "Troca de filtros", daily: false, h250: false, h500: true, h1000: false, h4000: false },
      { id: "prev-3", description: "Verificar desgaste de peças", daily: false, h250: false, h500: false, h1000: true, h4000: false },
      { id: "prev-4", description: "Revisão completa", daily: false, h250: false, h500: false, h1000: false, h4000: true },
    ],
  },
];

// Função para criar ID único
export const generateItemId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
export const generateSectionId = () => `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Criar item vazio
export const createEmptyItem = (): VerificationItem => ({
  id: generateItemId(),
  description: "",
  daily: false,
  h250: false,
  h500: false,
  h1000: false,
  h4000: false,
});

// Criar seção vazia
export const createEmptySection = (): VerificationSection => ({
  id: generateSectionId(),
  title: "Nova Seção",
  items: [createEmptyItem()],
});

// Obter template por tipo de equipamento
export const getDefaultSections = (equipmentName?: string): VerificationSection[] => {
  if (!equipmentName) return DEFAULT_GENERIC_SECTIONS;
  
  const name = equipmentName.toLowerCase();
  if (name.includes("gerador") || name.includes("generator")) {
    return DEFAULT_GENERATOR_SECTIONS;
  }
  
  return DEFAULT_GENERIC_SECTIONS;
};
