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
import { CalendarIcon, Clock, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

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
    <div className="space-y-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-r-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600" />
          <div>
            <Label htmlFor="retroactive-mode" className="text-base font-semibold">
              Modo Cadastro Retroativo
            </Label>
            <p className="text-sm text-muted-foreground">
              Registrar equipamento com data de entrada anterior
            </p>
          </div>
        </div>
        <Switch
          id="retroactive-mode"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
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
  );
}
