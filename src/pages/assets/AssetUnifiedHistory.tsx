import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { useAssetUnifiedHistory } from "@/hooks/useAssetUnifiedHistory";
import { formatPAT } from "@/lib/patUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Package,
  FileText,
  Wrench,
  ArrowRightLeft,
  Calendar,
  User,
  Search,
  Filter,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

const AssetUnifiedHistory = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patFromUrl = searchParams.get("pat");

  const [equipmentCode, setEquipmentCode] = useState(patFromUrl || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "withdrawal",
    "report",
    "maintenance",
    "movement",
  ]);

  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(equipmentCode);

  const { data: events = [], isLoading } = useAssetUnifiedHistory({
    assetCode: formatPAT(equipmentCode) || "",
    startDate,
    endDate,
    eventTypes: selectedTypes,
  });

  const toggleEventType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "withdrawal":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "report":
        return <FileText className="h-5 w-5 text-green-600" />;
      case "maintenance":
        return <Wrench className="h-5 w-5 text-orange-600" />;
      case "movement":
        return <ArrowRightLeft className="h-5 w-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case "withdrawal":
        return "default";
      case "report":
        return "outline";
      case "maintenance":
        return "secondary";
      case "movement":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="space-y-2">
        <BackButton />
        <h1 className="text-3xl font-bold">Histórico Unificado de Equipamento</h1>
        <p className="text-muted-foreground">
          Visualize toda a timeline de eventos de um equipamento específico
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PAT */}
          <div className="space-y-2">
            <Label htmlFor="equipment_code">Patrimônio (PAT) *</Label>
            <div className="relative">
              <Input
                id="equipment_code"
                type="text"
                value={equipmentCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 6) {
                    setEquipmentCode(value);
                  }
                }}
                onBlur={(e) => {
                  const formatted = formatPAT(e.target.value);
                  if (formatted) {
                    setEquipmentCode(formatted);
                  }
                }}
                placeholder="000000"
                maxLength={6}
                className="font-mono"
              />
              {loadingEquipment && equipmentCode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
            {equipmentCode && !loadingEquipment && (
              equipment ? (
                <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                    Equipamento encontrado: {equipment.equipment_name}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                    Equipamento não encontrado. Verifique o PAT.
                  </AlertDescription>
                </Alert>
              )
            )}
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Tipos de Evento */}
          <div className="space-y-2">
            <Label>Tipos de Evento</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-withdrawal"
                  checked={selectedTypes.includes("withdrawal")}
                  onCheckedChange={() => toggleEventType("withdrawal")}
                />
                <Label htmlFor="type-withdrawal" className="cursor-pointer flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Retiradas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-report"
                  checked={selectedTypes.includes("report")}
                  onCheckedChange={() => toggleEventType("report")}
                />
                <Label htmlFor="type-report" className="cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  Relatórios
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-maintenance"
                  checked={selectedTypes.includes("maintenance")}
                  onCheckedChange={() => toggleEventType("maintenance")}
                />
                <Label htmlFor="type-maintenance" className="cursor-pointer flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  Manutenções
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="type-movement"
                  checked={selectedTypes.includes("movement")}
                  onCheckedChange={() => toggleEventType("movement")}
                />
                <Label htmlFor="type-movement" className="cursor-pointer flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                  Movimentações
                </Label>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSelectedTypes(["withdrawal", "report", "maintenance", "movement"]);
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Timeline de Eventos ({events.length})</span>
            {equipment && (
              <Badge variant="outline" className="text-sm">
                {equipment.equipment_name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : !equipmentCode ? (
            <div className="text-center py-8 text-muted-foreground">
              Digite um código PAT para visualizar o histórico
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum evento encontrado para este equipamento
            </div>
          ) : (
            <div className="relative space-y-4">
              {/* Linha vertical da timeline */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              {events.map((event, index) => (
                <div key={event.id} className="relative pl-14">
                  {/* Ícone do evento */}
                  <div className="absolute left-3 top-2 bg-background p-1.5 rounded-full border-2 border-border">
                    {getEventIcon(event.type)}
                  </div>

                  {/* Card do evento */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getEventBadgeVariant(event.type)}>
                              {event.title}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.date + "T00:00:00"), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </div>
                          </div>
                          <p className="text-sm">{event.description}</p>

                          {/* Detalhes específicos por tipo */}
                          {event.type === "withdrawal" && event.details && (
                            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                              <div>
                                <strong>Obra:</strong> {event.details.workSite} | <strong>Empresa:</strong>{" "}
                                {event.details.company}
                              </div>
                              {event.details.reason && (
                                <div>
                                  <strong>Motivo:</strong> {event.details.reason}
                                </div>
                              )}
                              <div>
                                <strong>Ciclo:</strong> {event.details.cycle}
                                {event.details.isArchived && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Arquivado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {event.type === "report" && event.details && (
                            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                              <div>
                                <strong>Obra:</strong> {event.details.workSite} | <strong>Empresa:</strong>{" "}
                                {event.details.company}
                              </div>
                              {event.details.parts && event.details.parts.length > 0 && (
                                <div>
                                  <strong>Peças:</strong>{" "}
                                  {event.details.parts
                                    .map((p: any) => `${p.products?.name} (${p.quantity_used})`)
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                          )}

                          {event.type === "maintenance" && event.details && (
                            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                              {event.details.technician && (
                                <div>
                                  <strong>Técnico:</strong> {event.details.technician}
                                </div>
                              )}
                              <div>
                                <strong>Horímetro:</strong> {event.details.hourmeter?.previous} →{" "}
                                {event.details.hourmeter?.current}
                              </div>
                              {event.details.cost && (
                                <div>
                                  <strong>Custo:</strong> R$ {event.details.cost.toFixed(2)}
                                </div>
                              )}
                            </div>
                          )}

                          {event.type === "movement" && event.details && (
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              {event.details.field && (
                                <div>
                                  <strong>Campo:</strong> {event.details.field}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {event.user && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <User className="h-3 w-3" />
                            {event.user}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetUnifiedHistory;
