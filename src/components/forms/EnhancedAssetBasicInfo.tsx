import { UseFormReturn } from "react-hook-form";
import { AnimatedCard } from "@/components/ui/animated-card";
import { PATInputWithValidation } from "@/components/PATInputWithValidation";
import { FormFieldWithValidation } from "@/components/FormFieldWithValidation";
import { validateDuplicate, validateNormalization } from "@/hooks/useDuplicateValidation";
import { normalizeText } from "@/lib/textNormalization";
import { Separator } from "@/components/ui/separator";

interface EnhancedAssetBasicInfoProps {
  form: UseFormReturn<any>;
  isEditMode?: boolean;
  excludeId?: string;
}

/**
 * Formulário de informações básicas do equipamento com ONDA 2:
 * - Validações em tempo real
 * - Tooltips contextuais
 * - Feedback visual aprimorado
 * - Animações de transição
 */
export function EnhancedAssetBasicInfo({
  form,
  isEditMode = false,
  excludeId,
}: EnhancedAssetBasicInfoProps) {
  return (
    <AnimatedCard
      title="Informações Básicas"
      description="Identifique o equipamento com PAT único e dados principais"
      variant="hover-lift"
    >
      <div className="space-y-6">
        {/* PAT com validação completa */}
        <PATInputWithValidation
          form={form}
          name="asset_code"
          label="PAT (Código do Equipamento)"
          disabled={isEditMode}
          excludeId={excludeId}
          checkDuplicates={!isEditMode}
        />

        <Separator className="my-4" />

        {/* Nome do equipamento com validação de duplicata */}
        <FormFieldWithValidation
          form={form}
          name="equipment_name"
          label="Nome do Equipamento"
          placeholder="Ex: EMPILHADEIRA ELÉTRICA"
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Nome do Equipamento:</p>
              <ul className="text-xs space-y-1">
                <li>✓ Seja específico e claro</li>
                <li>✓ Use MAIÚSCULAS (aplicado automaticamente)</li>
                <li>✓ Evite abreviações não padronizadas</li>
                <li className="text-muted-foreground">Ex: EMPILHADEIRA ELÉTRICA, PALETEIRA MANUAL</li>
              </ul>
            </div>
          }
          normalize={(value) => normalizeText(value)}
          maxLength={200}
          realtimeValidation={{
            enabled: !isEditMode,
            validationFn: async (value) => {
              // Primeiro valida normalização
              const normResult = validateNormalization(value);
              if (normResult.status === "warning") {
                return normResult;
              }
              
              // Depois valida duplicata
              return await validateDuplicate(value, "assets", "equipment_name", excludeId);
            },
            minLength: 3,
          }}
        />

        {/* Fabricante com validação de normalização */}
        <FormFieldWithValidation
          form={form}
          name="manufacturer"
          label="Fabricante"
          placeholder="Ex: YALE, TOYOTA, STILL"
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Fabricante:</p>
              <ul className="text-xs space-y-1">
                <li>✓ Nome oficial da marca</li>
                <li>✓ MAIÚSCULAS aplicadas automaticamente</li>
                <li>✓ Sem acentos ou caracteres especiais</li>
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

        {/* Modelo (opcional) */}
        <FormFieldWithValidation
          form={form}
          name="model"
          label="Modelo (Opcional)"
          placeholder="Ex: ERP16N, 8FD25"
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Modelo:</p>
              <ul className="text-xs space-y-1">
                <li>✓ Código específico do modelo</li>
                <li>✓ Verifique na placa do equipamento</li>
                <li>✓ Importante para peças de reposição</li>
              </ul>
            </div>
          }
          normalize={(value) => normalizeText(value)}
          maxLength={100}
        />

        {/* Número de Série (opcional) */}
        <FormFieldWithValidation
          form={form}
          name="serial_number"
          label="Número de Série (Opcional)"
          placeholder="Ex: SN123456789"
          tooltip={
            <div className="space-y-2">
              <p className="font-semibold">Número de Série:</p>
              <ul className="text-xs space-y-1">
                <li>✓ Identificador único do fabricante</li>
                <li>✓ Encontrado na placa do equipamento</li>
                <li>✓ Importante para garantia e rastreabilidade</li>
              </ul>
            </div>
          }
          normalize={(value) => normalizeText(value)}
          maxLength={100}
        />
      </div>
    </AnimatedCard>
  );
}
