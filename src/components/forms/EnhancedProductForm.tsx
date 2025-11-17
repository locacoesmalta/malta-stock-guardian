import { UseFormReturn } from "react-hook-form";
import { AnimatedCard } from "@/components/ui/animated-card";
import { FormFieldWithValidation } from "@/components/FormFieldWithValidation";
import { validateDuplicate, validateNormalization } from "@/hooks/useDuplicateValidation";
import { normalizeText } from "@/lib/textNormalization";
import { EquipmentTypeSelector } from "@/components/EquipmentTypeSelector";
import { EquipmentBrandSelector } from "@/components/EquipmentBrandSelector";
import { EquipmentModelSelector } from "@/components/EquipmentModelSelector";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
import { Separator } from "@/components/ui/separator";

interface EnhancedProductFormProps {
  form: UseFormReturn<any>;
  isEditMode?: boolean;
  excludeId?: string;
}

/**
 * Formulário aprimorado para produtos com ONDA 2
 */
export function EnhancedProductForm({
  form,
  isEditMode = false,
  excludeId,
}: EnhancedProductFormProps) {
  return (
    <div className="space-y-6">
      <AnimatedCard
        title="Informações do Produto"
        description="Cadastre o produto com informações completas"
        variant="hover-lift"
      >
        <div className="space-y-6">
          {/* Código do Produto */}
          <FormFieldWithValidation
            form={form}
            name="code"
            label="Código do Produto"
            placeholder="Ex: PCA-001, FILT-HID-123"
            tooltip={
              <div className="space-y-2">
                <p className="font-semibold">Código do Produto:</p>
                <ul className="text-xs space-y-1">
                  <li>✓ Identificador único interno</li>
                  <li>✓ Usado para controle de estoque</li>
                  <li>✓ MAIÚSCULAS aplicadas automaticamente</li>
                  <li className="text-muted-foreground">Ex: PCA-001, FILT-HID-123</li>
                </ul>
              </div>
            }
            normalize={(value) => normalizeText(value)}
            maxLength={100}
            realtimeValidation={{
              enabled: !isEditMode,
              validationFn: async (value) => {
                const normResult = validateNormalization(value);
                if (normResult.status === "warning") return normResult;
                return await validateDuplicate(value, "products", "code", excludeId);
              },
              minLength: 2,
            }}
          />

          {/* Nome do Produto */}
          <FormFieldWithValidation
            form={form}
            name="name"
            label="Nome do Produto"
            placeholder="Ex: FILTRO HIDRÁULICO"
            tooltip={
              <div className="space-y-2">
                <p className="font-semibold">Nome do Produto:</p>
                <ul className="text-xs space-y-1">
                  <li>✓ Descrição clara e específica</li>
                  <li>✓ Use terminologia técnica padronizada</li>
                  <li>✓ MAIÚSCULAS aplicadas automaticamente</li>
                </ul>
              </div>
            }
            normalize={(value) => normalizeText(value)}
            maxLength={200}
            realtimeValidation={{
              enabled: !isEditMode,
              validationFn: async (value) => {
                const normResult = validateNormalization(value);
                if (normResult.status === "warning") return normResult;
                return await validateDuplicate(value, "products", "name", excludeId);
              },
              minLength: 3,
            }}
          />

          {/* Fabricante */}
          <FormFieldWithValidation
            form={form}
            name="manufacturer"
            label="Fabricante (Opcional)"
            placeholder="Ex: BOSCH, MANN, MAHLE"
            tooltip={
              <div className="space-y-2">
                <p className="font-semibold">Fabricante do Produto:</p>
                <ul className="text-xs space-y-1">
                  <li>✓ Marca do fabricante da peça</li>
                  <li>✓ Importante para qualidade e garantia</li>
                  <li>✓ MAIÚSCULAS aplicadas automaticamente</li>
                </ul>
              </div>
            }
            normalize={(value) => normalizeText(value)}
            maxLength={100}
            realtimeValidation={{
              enabled: true,
              validationFn: async (value) => validateNormalization(value),
              minLength: 2,
            }}
          />
        </div>
      </AnimatedCard>

      <AnimatedCard
        title="Compatibilidade com Equipamentos"
        description="Associe o produto aos equipamentos compatíveis"
        variant="hover-lift"
      >
        <div className="space-y-6">
          <FormFieldWithValidation
            form={form}
            name="equipment_type"
            label="Tipo de Equipamento (Opcional)"
            placeholder="Ex: EMPILHADEIRA, PALETEIRA"
            tooltip={
              <div className="space-y-2">
                <p className="font-semibold">Tipo de Equipamento:</p>
                <ul className="text-xs space-y-1">
                  <li>✓ Categoria geral do equipamento</li>
                  <li>✓ Usado para buscar peças compatíveis</li>
                </ul>
              </div>
            }
            normalize={(value) => normalizeText(value)}
            maxLength={100}
          />

          <FormFieldWithValidation
            form={form}
            name="equipment_brand"
            label="Marca do Equipamento (Opcional)"
            placeholder="Ex: YALE, TOYOTA, STILL"
            tooltip={
              <div className="space-y-2">
                <p className="font-semibold">Marca:</p>
                <ul className="text-xs space-y-1">
                  <li>✓ Fabricante do equipamento</li>
                  <li>✓ Especifica compatibilidade</li>
                </ul>
              </div>
            }
            normalize={(value) => normalizeText(value)}
            maxLength={100}
          />

          <FormFieldWithValidation
            form={form}
            name="equipment_model"
            label="Modelo do Equipamento (Opcional)"
            placeholder="Ex: ERP16N, 8FD25"
            tooltip={
              <div className="space-y-2">
                <p className="font-semibold">Modelo:</p>
                <ul className="text-xs space-y-1">
                  <li>✓ Código específico do modelo</li>
                  <li>✓ Máxima especificidade</li>
                </ul>
              </div>
            }
            normalize={(value) => normalizeText(value)}
            maxLength={100}
          />
        </div>
      </AnimatedCard>

      <AnimatedCard
        title="Observações"
        description="Informações adicionais sobre o produto"
        variant="hover-lift"
      >
        <FormFieldWithValidation
          form={form}
          name="comments"
          label="Observações (Opcional)"
          type="textarea"
          placeholder="Informações adicionais, especificações técnicas, notas de uso..."
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Observações:</p>
              <ul className="text-xs space-y-1">
                <li>✓ Notas técnicas relevantes</li>
                <li>✓ Especificações extras</li>
                <li>✓ Cuidados especiais</li>
              </ul>
            </div>
          }
          rows={4}
          maxLength={500}
        />
      </AnimatedCard>
    </div>
  );
}
