import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Wrench, TruckIcon, ClipboardList, Printer, Send } from "lucide-react";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

type FilterType = "deposito_malta" | "em_manutencao" | "locacao" | "aguardando_laudo" | null;

export default function StatusReports() {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const { data: assets, isLoading } = useAssetsQuery();
  const { toast } = useToast();

  const filterButtons = [
    {
      id: "deposito_malta" as FilterType,
      label: "Depósito Malta",
      icon: Building2,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: "em_manutencao" as FilterType,
      label: "Em Manutenção",
      icon: Wrench,
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      id: "locacao" as FilterType,
      label: "Locação",
      icon: TruckIcon,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      id: "aguardando_laudo" as FilterType,
      label: "Aguardando Laudo",
      icon: ClipboardList,
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  const filteredAssets = activeFilter
    ? assets?.filter((asset) => asset.location_type === activeFilter)
    : [];

  const handlePrint = () => {
    window.print();
  };

  const handleSend = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O recurso de envio será implementado em breve.",
    });
  };

  const getLocationLabel = (locationType: string) => {
    const labels: Record<string, string> = {
      deposito_malta: "Depósito Malta",
      em_manutencao: "Em Manutenção",
      locacao: "Locação",
      aguardando_laudo: "Aguardando Laudo",
      liberado_locacao: "Liberado para Locação",
    };
    return labels[locationType] || locationType;
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Status</h1>
        <p className="text-muted-foreground">
          Consulte o status dos patrimônios em tempo real
        </p>
      </div>

      {/* Botões de Filtro Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {filterButtons.map((button) => {
          const Icon = button.icon;
          const count = assets?.filter((asset) => asset.location_type === button.id).length || 0;
          const isActive = activeFilter === button.id;

          return (
            <Button
              key={button.id}
              onClick={() => setActiveFilter(button.id)}
              className={`h-auto py-6 flex flex-col items-center gap-3 text-white ${
                isActive ? button.color : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              variant={isActive ? "default" : "outline"}
            >
              <Icon className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold text-base">{button.label}</div>
                <div className="text-sm opacity-90 mt-1">{count} patrimônios</div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Resultados */}
      {activeFilter && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {filterButtons.find((b) => b.id === activeFilter)?.label}
                </CardTitle>
                <CardDescription>
                  {filteredAssets.length} patrimônio(s) encontrado(s)
                </CardDescription>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button onClick={handlePrint} variant="outline" size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={handleSend} variant="outline" size="sm" disabled>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Carregando...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum patrimônio encontrado com este status
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome do Equipamento</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-mono font-semibold">
                          {asset.asset_code}
                        </TableCell>
                        <TableCell>{asset.equipment_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getLocationLabel(asset.location_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {asset.location_type === "locacao"
                            ? asset.rental_company
                            : asset.location_type === "em_manutencao"
                            ? asset.maintenance_company
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {asset.location_type === "locacao"
                            ? asset.rental_work_site
                            : asset.location_type === "em_manutencao"
                            ? asset.maintenance_work_site
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(asset.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!activeFilter && (
        <Card className="print:hidden">
          <CardContent className="py-12 text-center text-muted-foreground">
            Selecione um dos botões acima para visualizar os relatórios
          </CardContent>
        </Card>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .print\\:hidden {
              display: none !important;
            }
            
            /* Ocultar sidebar e navegação */
            aside, nav, header, footer, [role="navigation"] {
              display: none !important;
            }
            
            /* Ocultar elementos específicos da interface */
            button, .sidebar, [data-sidebar] {
              display: none !important;
            }
            
            /* Garantir que o conteúdo use toda a largura */
            body, main, .container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 10mm !important;
            }
            
            /* Melhorar aparência do card na impressão */
            .card {
              border: 1px solid #ddd !important;
              box-shadow: none !important;
            }
            
            /* Ajustar cores para impressão */
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              background: white !important;
            }
            
            /* Garantir que badges e cores sejam impressas */
            .badge {
              border: 1px solid #000 !important;
            }
            
            /* Ajustar tabela para impressão */
            table {
              width: 100% !important;
              page-break-inside: avoid;
            }
            
            /* Evitar quebra de página dentro de linhas */
            tr {
              page-break-inside: avoid;
            }
            
            /* Adicionar título na impressão */
            @page {
              margin: 15mm;
            }
          }
        `
      }} />
    </div>
  );
}
