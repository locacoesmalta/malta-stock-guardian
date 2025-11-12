import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, Clock, AlertTriangle, Info, HelpCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RetroactiveRegistrationModeProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  effectiveDate: Date | undefined;
  onEffectiveDateChange: (date: Date | undefined) => void;
  purchaseDate: Date | undefined;
  onPurchaseDateChange: (date: Date | undefined) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function RetroactiveRegistrationMode({
  enabled,
  onEnabledChange,
  effectiveDate,
  onEffectiveDateChange,
  purchaseDate,
  onPurchaseDateChange,
  notes,
  onNotesChange,
}: RetroactiveRegistrationModeProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [purchaseCalendarOpen, setPurchaseCalendarOpen] = useState(false);

  const daysAgo = effectiveDate ? differenceInDays(new Date(), effectiveDate) : 0;
  const isHighlyRetroactive = daysAgo > 90;

  return (
    <div className="space-y-4">
      {/* Card Informativo Sempre Visível */}
      <div className="space-y-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-r-md">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                ℹ️ Quando usar o Modo Retroativo?
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      O modo retroativo permite registrar a <strong>data real</strong> de entrada 
                      do equipamento quando há atraso no cadastro. Isso mantém a rastreabilidade 
                      temporal correta para movimentações e manutenções futuras.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              Use o modo retroativo quando:
            </p>
            
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
              <li>✓ O equipamento chegou há <strong>mais de 7 dias</strong></li>
              <li>✓ Houve atraso na documentação ou regularização</li>
              <li>✓ Você precisa registrar a data real de entrada</li>
            </ul>

            <Alert className="mt-3 bg-amber-50 dark:bg-amber-950/30 border-amber-500">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Importante:</strong> Se não usar o modo retroativo, o sistema considerará 
                a data de HOJE como entrada do equipamento, o que pode gerar inconsistências em 
                movimentações e manutenções futuras.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {/* Toggle com Badges e Tooltip */}
      <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-r-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="retroactive-mode" className="text-base font-semibold">
                  Modo Cadastro Retroativo
                </Label>
                <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                  OPCIONAL
                </Badge>
                <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                  RECOMENDADO
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Registrar equipamento com data de entrada anterior
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Switch
                    id="retroactive-mode"
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-sm">
                <p className="text-xs font-semibold mb-2">💡 Modo Retroativo</p>
                <p className="text-xs mb-2">
                  Ative esta opção se o equipamento já estava em operação antes de hoje.
                </p>
                <p className="text-xs text-muted-foreground">
                  Exemplo: Se o equipamento chegou há 15 dias mas só está sendo cadastrado agora, 
                  ative o modo retroativo e informe a data real de entrada.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

      {enabled && (
        <div className="space-y-4 pt-2">
          {/* Badge de Registro Retroativo */}
          <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 px-3 py-2 rounded-md">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">🕒 REGISTRO RETROATIVO ATIVO</span>
          </div>

          {/* Data Real de Entrada */}
          <div className="space-y-2">
            <Label htmlFor="effective-date">
              Data Real de Entrada do Equipamento *
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !effectiveDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? (
                    format(effectiveDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data real de entrada</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={(date) => {
                    onEffectiveDateChange(date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {effectiveDate && (
              <p className="text-sm text-muted-foreground">
                Entrada há <strong>{daysAgo} dias</strong> (
                {format(effectiveDate, "dd/MM/yyyy")})
              </p>
            )}
          </div>

          {/* Data de Compra (Opcional) */}
          <div className="space-y-2">
            <Label htmlFor="purchase-date-retroactive">
              Data de Compra (Opcional)
            </Label>
            <Popover
              open={purchaseCalendarOpen}
              onOpenChange={setPurchaseCalendarOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {purchaseDate ? (
                    format(purchaseDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data de compra</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={(date) => {
                    onPurchaseDateChange(date);
                    setPurchaseCalendarOpen(false);
                  }}
                  disabled={(date) => {
                    if (date > new Date()) return true;
                    if (effectiveDate && date > effectiveDate) return true;
                    return false;
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-muted-foreground">
              Data de compra deve ser anterior ou igual à data de entrada
            </p>
          </div>

          {/* Justificativa Obrigatória para Registros Muito Antigos */}
          {isHighlyRetroactive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Justificativa Obrigatória</AlertTitle>
              <AlertDescription>
                Registros com mais de 90 dias de atraso exigem justificativa
                detalhada.
              </AlertDescription>
            </Alert>
          )}

          {/* Observações/Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="retroactive-notes">
              Justificativa para Cadastro Retroativo
              {isHighlyRetroactive && " *"}
            </Label>
            <Textarea
              id="retroactive-notes"
              placeholder="Explique o motivo do cadastro tardio (ex: documentação atrasada, equipamento esquecido, regularização de processos)"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              required={isHighlyRetroactive}
            />
            <p className="text-sm text-muted-foreground">
              Esta informação será registrada no histórico do equipamento
            </p>
          </div>

          {/* Alertas baseados no tempo */}
          {daysAgo > 30 && (
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-600">
                Atenção: Cadastro com {daysAgo} dias de atraso
              </AlertTitle>
              <AlertDescription>
                {daysAgo > 90 ? (
                  <p>
                    Este equipamento está sendo cadastrado com mais de{" "}
                    <strong>3 meses</strong> de atraso. Certifique-se de
                    documentar adequadamente o motivo.
                  </p>
                ) : (
                  <p>
                    Este equipamento está sendo cadastrado com mais de{" "}
                    <strong>1 mês</strong> de atraso. Recomenda-se adicionar uma
                    justificativa.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Informação sobre rastreabilidade */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Rastreabilidade Mantida</AlertTitle>
            <AlertDescription>
              O sistema registrará este cadastro como retroativo, mantendo tanto a
              data de entrada real quanto a data de registro no sistema para
              auditoria completa.
            </AlertDescription>
          </Alert>
        </div>
      )}
      </div>
    </div>
  );
}
