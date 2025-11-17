import { useState } from "react";
import { AnimatedCard } from "@/components/ui/animated-card";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SuccessCheckmark } from "@/components/ui/success-checkmark";
import { InlineValidation } from "@/components/ui/inline-validation";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
import { Button } from "@/components/ui/button";

/**
 * Demonstração completa dos recursos da ONDA 2:
 * - Validações em tempo real
 * - Tooltips contextuais
 * - Feedback visual aprimorado
 * - Animações de transição
 */
export function ONDA2Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = [
    { id: "1", label: "Validação", description: "Em tempo real" },
    { id: "2", label: "Feedback", description: "Visual claro" },
    { id: "3", label: "Animações", description: "Suaves" },
    { id: "4", label: "Completo", description: "Sucesso!" },
  ];

  const handleNext = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <AnimatedCard
        title="🎨 ONDA 2 - Demonstração Completa"
        description="Todas as melhorias de UX em um só lugar"
        variant="hover-glow"
      >
        <div className="space-y-6">
          {/* Progress Stepper */}
          <ProgressStepper steps={steps} currentStep={currentStep} />

          {/* Feedback Banners */}
          <div className="space-y-3">
            <FeedbackBanner
              variant="info"
              title="💡 Validações em Tempo Real"
              message="O sistema valida enquanto você digita, sem precisar submeter"
            />
            
            <FeedbackBanner
              variant="success"
              message="✓ Tooltips contextuais ajudam em cada campo"
            />
            
            <FeedbackBanner
              variant="warning"
              message="⚠️ Feedback visual indica problemas antes de salvar"
            />
          </div>

          {/* Inline Validations */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Exemplos de Validação:</span>
              <ContextualTooltip content="Validações aparecem em tempo real" />
            </div>
            
            <InlineValidation
              status="validating"
              message="Verificando disponibilidade..."
            />
            
            <InlineValidation
              status="valid"
              message="✓ PAT disponível para uso"
            />
            
            <InlineValidation
              status="invalid"
              message="⚠️ Este PAT já está em uso"
            />
            
            <InlineValidation
              status="warning"
              message="💡 Sugestão: USE MAIÚSCULAS"
            />
          </div>

          {/* Loading & Success States */}
          <div className="flex items-center justify-center gap-8 p-8 bg-background rounded-lg border">
            {loading && <LoadingSpinner size="lg" label="Processando..." />}
            {success && <SuccessCheckmark size="lg" label="Concluído!" animated />}
            {!loading && !success && (
              <Button onClick={handleNext} size="lg">
                Avançar Etapa
              </Button>
            )}
          </div>
        </div>
      </AnimatedCard>

      {/* Recursos Implementados */}
      <AnimatedCard
        title="✨ Recursos da ONDA 2"
        variant="hover-lift"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold">🔍 Validações em Tempo Real</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Validação de PAT (6 dígitos)</li>
              <li>• Detecção de duplicatas</li>
              <li>• Sugestões de normalização</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">💬 Tooltips Contextuais</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ajuda inline em cada campo</li>
              <li>• Exemplos práticos</li>
              <li>• Regras de validação claras</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">🎨 Feedback Visual</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Estados de loading claros</li>
              <li>• Confirmações visuais</li>
              <li>• Alertas contextuais</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">✨ Animações Suaves</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Transições elegantes</li>
              <li>• Hover effects profissionais</li>
              <li>• Scale e fade animations</li>
            </ul>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
