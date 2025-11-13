import { useState, useCallback, ChangeEvent } from 'react';
import { sanitizeText } from '@/lib/inputSanitization';

/**
 * Hook para gerenciar inputs com sanitização automática.
 * 
 * @example
 * const { value, onChange, setValue } = useSanitizedInput('');
 * <Input value={value} onChange={onChange} />
 * 
 * @param initialValue - Valor inicial
 * @returns Objeto com value, onChange e setValue
 */
export const useSanitizedInput = (initialValue: string = '') => {
  const [value, setValue] = useState(sanitizeText(initialValue));

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const sanitized = sanitizeText(e.target.value);
    setValue(sanitized);
  }, []);

  const setValueDirectly = useCallback((newValue: string) => {
    setValue(sanitizeText(newValue));
  }, []);

  return { 
    value, 
    onChange, 
    setValue: setValueDirectly 
  };
};
