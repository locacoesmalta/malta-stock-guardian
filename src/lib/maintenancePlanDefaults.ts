// Templates padrão para itens de verificação de manutenção

export interface VerificationItem {
  id: string;
  description: string;
  h50: boolean;
  h100: boolean;
  h200: boolean;
  h800: boolean;
  h2000: boolean;
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
export const createEmptyItem = (): VerificationItem => ({
  id: generateItemId(),
  description: "",
  h50: false,
  h100: false,
  h200: false,
  h800: false,
  h2000: false,
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
