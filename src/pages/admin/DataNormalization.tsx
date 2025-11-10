import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useDuplicateDetection, useFixDuplicateManufacturersAssets, useFixDuplicateManufacturersProducts, useFixDuplicateEquipmentNames, useFixDuplicateProductNames, useFixDuplicateModels, useFixDuplicateEquipmentTypes } from "@/hooks/useDuplicateDetection";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DataNormalization = () => {
  const { data, isLoading, refetch } = useDuplicateDetection();
  const queryClient = useQueryClient();
  const fixManufacturersAssets = useFixDuplicateManufacturersAssets();
  const fixManufacturersProducts = useFixDuplicateManufacturersProducts();
  const fixEquipmentNames = useFixDuplicateEquipmentNames();
  const fixProductNames = useFixDuplicateProductNames();
  const fixModels = useFixDuplicateModels();
  const fixEquipmentTypes = useFixDuplicateEquipmentTypes();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedCorrections, setSelectedCorrections] = useState<Record<string, string>>({});

  const handleCorrection = async (
    type: 'manufacturersAssets' | 'manufacturersProducts' | 'equipmentNames' | 'products',
    normalized: string,
    variations: string[]
  ) => {
    const key = `${type}-${normalized}`;
    const correctValue = selectedCorrections[key];

    if (!correctValue) {
      toast.error("Selecione a versão correta primeiro");
      return;
    }

    setProcessingId(key);

    try {
      let updated = 0;

      switch (type) {
        case 'manufacturersAssets':
          updated = await fixManufacturersAssets(correctValue, variations);
          break;
        case 'manufacturersProducts':
          updated = await fixManufacturersProducts(correctValue, variations);
          break;
        case 'equipmentNames':
          updated = await fixEquipmentNames(correctValue, variations);
          break;
        case 'products':
          updated = await fixProductNames(correctValue, variations);
          break;
        case 'models':
          updated = await fixModels(correctValue, variations);
          break;
        case 'equipmentTypes':
          updated = await fixEquipmentTypes(correctValue, variations);
          break;
      }

      toast.success(`${updated} registro(s) normalizado(s) com sucesso!`);
      
      // Invalidar queries para recarregar dados
      await queryClient.invalidateQueries({ queryKey: ['duplicate-detection'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      await refetch();
    } catch (error: any) {
      console.error('Erro ao normalizar:', error);
      toast.error(error.message || "Erro ao normalizar dados");
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const DuplicateCard = ({
    title,
    icon: Icon,
    items,
    type,
    getLabel,
    getDescription
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: any[];
    type: 'manufacturersAssets' | 'manufacturersProducts' | 'equipmentNames' | 'products' | 'models' | 'equipmentTypes';
    getLabel: (item: any) => string;
    getDescription: (item: any) => string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {items.length === 0 ? (
            <span className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Nenhuma duplicata encontrada
            </span>
          ) : (
            `${items.length} duplicata(s) detectada(s)`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Todos os dados estão normalizados corretamente!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {items.map((item: any, idx: number) => {
              const key = `${type}-${getLabel(item)}`;
              const isProcessing = processingId === key;

              return (
                <Card key={idx} className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      {getLabel(item)}
                    </CardTitle>
                    <CardDescription>{getDescription(item)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Variações encontradas:</p>
                      {item.variacoes.map((v: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded text-sm font-mono">
                          <Badge variant="outline">{i + 1}</Badge>
                          {v}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Versão correta:</label>
                        <Select
                          value={selectedCorrections[key] || ""}
                          onValueChange={(value) => 
                            setSelectedCorrections(prev => ({ ...prev, [key]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a versão correta" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.variacoes.map((v: string, i: number) => (
                              <SelectItem key={i} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={() => handleCorrection(type, getLabel(item), item.variacoes)}
                        disabled={isProcessing || !selectedCorrections[key]}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Normalizando...
                          </>
                        ) : (
                          "Normalizar"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col w-full">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Normalização de Dados</h1>
                <p className="text-muted-foreground">
                  Corrija duplicatas e inconsistências nos dados do sistema
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                Atualizar
              </Button>
            </div>

            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Duplicatas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.totalDuplicates || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Grupos de nomes duplicados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Registros Afetados</CardTitle>
                  <FileText className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data?.totalAffectedRecords || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Registros com nomes inconsistentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data?.totalDuplicates === 0 ? "✓ OK" : "⚠ Atenção"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data?.totalDuplicates === 0 ? "Dados normalizados" : "Correções pendentes"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs de Normalização */}
            <Tabs defaultValue="manufacturers-assets" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="manufacturers-assets">
                  Fabricantes (Assets)
                  {(data?.manufacturersAssets?.length || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {data?.manufacturersAssets?.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="equipment-names">
                  Nomes de Equipamentos
                  {(data?.equipmentNames?.length || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {data?.equipmentNames?.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="manufacturers-products">
                  Fabricantes (Produtos)
                  {(data?.manufacturersProducts?.length || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {data?.manufacturersProducts?.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="products">
                  Nomes de Produtos
                  {(data?.products?.length || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {data?.products?.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="models">
                  Modelos
                  {(data?.models?.length || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {data?.models?.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="equipment-types">
                  Tipos de Equipamento
                  {(data?.equipmentTypes?.length || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {data?.equipmentTypes?.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manufacturers-assets" className="space-y-4">
                <DuplicateCard
                  title="Fabricantes em Equipamentos"
                  icon={AlertTriangle}
                  items={data?.manufacturersAssets || []}
                  type="manufacturersAssets"
                  getLabel={(item) => item.fabricante_normalizado}
                  getDescription={(item) => 
                    `${item.qtd_variacoes} variações • ${item.total_equipamentos} equipamentos • Exemplos: ${item.exemplos_pat.slice(0, 3).join(', ')}`
                  }
                />
              </TabsContent>

              <TabsContent value="equipment-names" className="space-y-4">
                <DuplicateCard
                  title="Nomes de Equipamentos"
                  icon={AlertTriangle}
                  items={data?.equipmentNames || []}
                  type="equipmentNames"
                  getLabel={(item) => item.equipamento_normalizado}
                  getDescription={(item) => 
                    `${item.qtd_variacoes} variações • ${item.total_registros} registros • Exemplos: ${item.exemplos_pat.slice(0, 3).join(', ')}`
                  }
                />
              </TabsContent>

              <TabsContent value="manufacturers-products" className="space-y-4">
                <DuplicateCard
                  title="Fabricantes em Produtos"
                  icon={AlertTriangle}
                  items={data?.manufacturersProducts || []}
                  type="manufacturersProducts"
                  getLabel={(item) => item.fabricante_normalizado}
                  getDescription={(item) => 
                    `${item.qtd_variacoes} variações • ${item.total_produtos} produtos • Exemplos: ${item.exemplos_codigo.slice(0, 3).join(', ')}`
                  }
                />
              </TabsContent>

              <TabsContent value="products" className="space-y-4">
                <DuplicateCard
                  title="Nomes de Produtos"
                  icon={AlertTriangle}
                  items={data?.products || []}
                  type="products"
                  getLabel={(item) => item.produto_normalizado}
                  getDescription={(item) => 
                    `${item.qtd_variacoes} variações • ${item.total_produtos} produtos • Exemplos: ${item.exemplos_codigo.slice(0, 3).join(', ')}`
                  }
                />
              </TabsContent>

              <TabsContent value="models" className="space-y-4">
                <DuplicateCard
                  title="Modelos de Equipamentos"
                  icon={AlertTriangle}
                  items={data?.models || []}
                  type="models"
                  getLabel={(item) => item.modelo_normalizado}
                  getDescription={(item) => 
                    `${item.qtd_variacoes} variações • ${item.total_equipamentos} equipamentos • Exemplos: ${item.exemplos_pat?.slice(0, 3).join(', ') || 'N/A'}`
                  }
                />
              </TabsContent>

              <TabsContent value="equipment-types" className="space-y-4">
                <DuplicateCard
                  title="Tipos de Equipamentos"
                  icon={AlertTriangle}
                  items={data?.equipmentTypes || []}
                  type="equipmentTypes"
                  getLabel={(item) => item.tipo_normalizado}
                  getDescription={(item) => 
                    `${item.qtd_variacoes} variações • ${item.total_produtos} produtos • Exemplos: ${item.exemplos_codigo?.slice(0, 3).join(', ') || 'N/A'}`
                  }
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DataNormalization;
