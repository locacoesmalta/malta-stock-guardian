/**
 * Helper para normalização automática de inputs de texto
 * Converte automaticamente para MAIÚSCULAS durante digitação
 */

/**
 * Normaliza o valor de um input, convertendo para maiúsculas e removendo espaços extras
 */
export const normalizeInputValue = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
): string => {
  return e.target.value.toUpperCase().trim();
};

/**
 * Wrapper para onChange que normaliza automaticamente o valor
 * Uso: <Input onChange={normalizedOnChange(field.onChange)} />
 */
export const normalizedOnChange = (
  onChange: (value: string) => void
) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  onChange(e.target.value.toUpperCase());
};

/**
 * Normaliza valor durante digitação (sem trim para não atrapalhar UX)
 */
export const normalizeOnChange = (
  onChange: (value: string) => void
) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const normalized = e.target.value.toUpperCase();
  onChange(normalized);
};
