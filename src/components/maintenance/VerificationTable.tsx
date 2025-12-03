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
import { Plus, Trash2, ClipboardList, GripVertical } from "lucide-react";
import {
  VerificationSection,
  VerificationItem,
  createEmptyItem,
  createEmptySection,
} from "@/lib/maintenancePlanDefaults";

interface VerificationTableProps {
  sections: VerificationSection[];
  onChange: (sections: VerificationSection[]) => void;
}

export function VerificationTable({ sections, onChange }: VerificationTableProps) {
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

  const addSection = () => {
    onChange([...sections, createEmptySection()]);
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Tabela de Verificações
          </CardTitle>
          <Button onClick={addSection} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova Seção
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={sections.map((s) => s.id)} className="space-y-2">
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
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
          ))}
        </Accordion>

        {sections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma seção de verificação adicionada</p>
            <Button onClick={addSection} variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Primeira Seção
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
