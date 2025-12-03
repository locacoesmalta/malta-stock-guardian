import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ClipboardList, GripVertical, Wrench, Zap } from "lucide-react";
import {
  VerificationSection,
  VerificationItem,
  MaintenanceCategory,
  ActionType,
  MaintenanceTarget,
  MaintenanceInterval,
  AlternadorInterval,
  createEmptyItem,
  createEmptySection,
  generateMotorSectionsForInterval,
  generateAlternadorSectionsForInterval,
} from "@/lib/maintenancePlanDefaults";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const maintenanceTargets: { value: MaintenanceTarget; label: string }[] = [
  { value: "motor", label: "🔧 Motor" },
  { value: "alternador", label: "⚡ Alternador" },
];

const actionTypes: { value: ActionType; label: string }[] = [
  { value: "verificar", label: "Verificar" },
  { value: "limpeza", label: "Limpeza" },
  { value: "substituir", label: "Substituir" },
  { value: "testar", label: "Testar" },
];

const maintenanceIntervals: { value: MaintenanceInterval; label: string }[] = [
  { value: "h100", label: "100 horas" },
  { value: "h200", label: "200 horas" },
  { value: "h800", label: "800 horas" },
  { value: "h2000", label: "2000 horas" },
];

const alternadorIntervals: { value: AlternadorInterval; label: string }[] = [
  { value: "h250", label: "250 horas" },
  { value: "h1000", label: "1000 horas" },
  { value: "h10000", label: "10000 horas" },
  { value: "h30000", label: "30000 horas" },
];

interface VerificationTableProps {
  sections: VerificationSection[];
  onChange: (sections: VerificationSection[]) => void;
  showCategoryButtons?: boolean;
}

export function VerificationTable({ sections, onChange, showCategoryButtons = false }: VerificationTableProps) {
  const [selectedInterval, setSelectedInterval] = useState<MaintenanceInterval>("h100");
  const [selectedAlternadorInterval, setSelectedAlternadorInterval] = useState<AlternadorInterval>("h250");

  const handleGenerateMotorTasks = () => {
    const motorSections = generateMotorSectionsForInterval(selectedInterval);
    // Remove seções de motor existentes e adiciona as novas
    const nonMotorSections = sections.filter(s => s.category !== "motor");
    onChange([...nonMotorSections, ...motorSections]);
    
    const intervalLabel = maintenanceIntervals.find(i => i.value === selectedInterval)?.label || selectedInterval;
    toast.success(`Tarefas do Motor geradas para ${intervalLabel}`);
  };

  const handleGenerateAlternadorTasks = () => {
    const alternadorSections = generateAlternadorSectionsForInterval(selectedAlternadorInterval);
    // Remove seções de alternador existentes e adiciona as novas
    const nonAlternadorSections = sections.filter(s => s.category !== "alternador");
    onChange([...nonAlternadorSections, ...alternadorSections]);
    
    const intervalLabel = alternadorIntervals.find(i => i.value === selectedAlternadorInterval)?.label || selectedAlternadorInterval;
    toast.success(`Tarefas do Alternador geradas para ${intervalLabel}`);
  };
  const updateSectionTitle = (sectionId: string, title: string) => {
    onChange(
      sections.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
  };

  const updateItem = (
    sectionId: string,
    itemId: string,
    field: keyof VerificationItem,
    value: string | boolean
  ) => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        };
      })
    );
  };

  const addItem = (sectionId: string) => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: [...section.items, createEmptyItem()],
        };
      })
    );
  };

  const removeItem = (sectionId: string, itemId: string) => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const addSection = (category?: MaintenanceCategory) => {
    onChange([...sections, createEmptySection(category)]);
  };

  // Separar seções por categoria
  const motorSections = sections.filter(s => s.category === "motor");
  const alternadorSections = sections.filter(s => s.category === "alternador");
  const otherSections = sections.filter(s => !s.category || s.category === "geral");

  const getCategoryIcon = (category?: MaintenanceCategory) => {
    if (category === "motor") return <Wrench className="h-4 w-4 text-orange-500" />;
    if (category === "alternador") return <Zap className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const getCategoryBorderClass = (category?: MaintenanceCategory) => {
    if (category === "motor") return "border-l-4 border-l-orange-500";
    if (category === "alternador") return "border-l-4 border-l-blue-500";
    return "";
  };

  const removeSection = (sectionId: string) => {
    onChange(sections.filter((s) => s.id !== sectionId));
  };

  const frequencyColumns = [
    { key: "h50", label: "50h" },
    { key: "h100", label: "100h" },
    { key: "h200", label: "200h" },
    { key: "h800", label: "800h" },
    { key: "h2000", label: "2000h" },
  ] as const;

  const renderSection = (section: VerificationSection) => (
    <AccordionItem
      key={section.id}
      value={section.id}
      className={cn("border rounded-lg px-4", getCategoryBorderClass(section.category))}
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          {getCategoryIcon(section.category)}
          <Input
            value={section.title}
            onChange={(e) => {
              e.stopPropagation();
              updateSectionTitle(section.id, e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-8 max-w-[300px] font-semibold"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              removeSection(section.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-2 min-w-[130px]">
                  Manutenção
                </th>
                <th className="text-left py-2 pr-2 min-w-[120px]">
                  Ação
                </th>
                <th className="text-left py-2 pr-4 min-w-[300px]">
                  Descrição
                </th>
                {frequencyColumns.map((col) => (
                  <th key={col.key} className="text-center py-2 px-2 min-w-[60px]">
                    {col.label}
                  </th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {section.items.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-2">
                    <Select
                      value={item.maintenanceTarget || "motor"}
                      onValueChange={(value: MaintenanceTarget) =>
                        updateItem(section.id, item.id, "maintenanceTarget", value)
                      }
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {maintenanceTargets.map((target) => (
                          <SelectItem key={target.value} value={target.value}>
                            {target.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 pr-2">
                    <Select
                      value={item.actionType || "verificar"}
                      onValueChange={(value: ActionType) =>
                        updateItem(section.id, item.id, "actionType", value)
                      }
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 pr-4">
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateItem(section.id, item.id, "description", e.target.value)
                      }
                      placeholder="Descrição da verificação"
                      className="h-8"
                    />
                  </td>
                  {frequencyColumns.map((col) => (
                    <td key={col.key} className="text-center py-2 px-2">
                      <Checkbox
                        checked={item[col.key]}
                        onCheckedChange={(checked) =>
                          updateItem(section.id, item.id, col.key, !!checked)
                        }
                      />
                    </td>
                  ))}
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeItem(section.id, item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => addItem(section.id)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Item
        </Button>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Tabela de Verificações
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {showCategoryButtons ? (
              <>
                <Button onClick={() => addSection("motor")} variant="outline" size="sm" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                  <Wrench className="h-4 w-4 mr-1" />
                  + Seção Motor
                </Button>
                <Button onClick={() => addSection("alternador")} variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Zap className="h-4 w-4 mr-1" />
                  + Seção Alternador
                </Button>
              </>
            ) : (
              <Button onClick={() => addSection()} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nova Seção
              </Button>
            )}
          </div>
        </div>
        
        {/* Gerador automático de tarefas por intervalo */}
        {showCategoryButtons && (
          <div className="mt-4 space-y-3">
            {/* Motor */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-orange-700 dark:text-orange-400">
                <Wrench className="h-4 w-4" />
                🔧 MOTOR - Gerar Tarefas Automaticamente
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Intervalo:</span>
                  <Select
                    value={selectedInterval}
                    onValueChange={(value: MaintenanceInterval) => setSelectedInterval(value)}
                  >
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceIntervals.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleGenerateMotorTasks} 
                  variant="default" 
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Wrench className="h-4 w-4 mr-1" />
                  Gerar Tarefas Motor
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Template TOYAMA: 100h, 200h, 800h, 2000h (cumulativo)
              </p>
            </div>

            {/* Alternador */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-blue-700 dark:text-blue-400">
                <Zap className="h-4 w-4" />
                ⚡ ALTERNADOR - Gerar Tarefas Automaticamente
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Intervalo:</span>
                  <Select
                    value={selectedAlternadorInterval}
                    onValueChange={(value: AlternadorInterval) => setSelectedAlternadorInterval(value)}
                  >
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {alternadorIntervals.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleGenerateAlternadorTasks} 
                  variant="default" 
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Gerar Tarefas Alternador
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Template TOYAMA: 250h, 1000h, 10000h, 30000h (cumulativo)
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {showCategoryButtons && motorSections.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-orange-600 font-semibold">
              <Wrench className="h-5 w-5" />
              <span>MANUTENÇÃO DO MOTOR</span>
            </div>
            <Accordion type="multiple" defaultValue={motorSections.map((s) => s.id)} className="space-y-2">
              {motorSections.map(renderSection)}
            </Accordion>
          </div>
        )}

        {showCategoryButtons && alternadorSections.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold">
              <Zap className="h-5 w-5" />
              <span>MANUTENÇÃO DO ALTERNADOR</span>
            </div>
            <Accordion type="multiple" defaultValue={alternadorSections.map((s) => s.id)} className="space-y-2">
              {alternadorSections.map(renderSection)}
            </Accordion>
          </div>
        )}

        {showCategoryButtons && otherSections.length > 0 && (
          <div className="mb-4">
            <Accordion type="multiple" defaultValue={otherSections.map((s) => s.id)} className="space-y-2">
              {otherSections.map(renderSection)}
            </Accordion>
          </div>
        )}

        {!showCategoryButtons && (
          <Accordion type="multiple" defaultValue={sections.map((s) => s.id)} className="space-y-2">
            {sections.map(renderSection)}
          </Accordion>
        )}

        {sections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma seção de verificação adicionada</p>
            {showCategoryButtons ? (
              <div className="flex gap-2 justify-center mt-2">
                <Button onClick={() => addSection("motor")} variant="outline" size="sm" className="border-orange-300 text-orange-600">
                  <Wrench className="h-4 w-4 mr-1" />
                  + Motor
                </Button>
                <Button onClick={() => addSection("alternador")} variant="outline" size="sm" className="border-blue-300 text-blue-600">
                  <Zap className="h-4 w-4 mr-1" />
                  + Alternador
                </Button>
              </div>
            ) : (
              <Button onClick={() => addSection()} variant="outline" size="sm" className="mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Primeira Seção
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
