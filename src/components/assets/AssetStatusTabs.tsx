import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface AssetStatusTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  statusCounts: {
    deposito_malta: number;
    em_manutencao: number;
    locacao: number;
    aguardando_laudo: number;
  };
}

export const AssetStatusTabs = ({ activeTab, onTabChange, statusCounts }: AssetStatusTabsProps) => {
  const totalAssets = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="mb-6">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-2 lg:grid-cols-5 h-auto">
          <TabsTrigger value="all" className="gap-2">
            Todos
            <Badge variant="outline" className="ml-1">
              {totalAssets}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deposito_malta" className="gap-2">
            <span className="hidden sm:inline">Depósito Malta</span>
            <span className="sm:hidden">Depósito</span>
            <Badge variant="secondary" className="ml-1">
              {statusCounts.deposito_malta}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="em_manutencao" className="gap-2">
            <span className="hidden sm:inline">Em Manutenção</span>
            <span className="sm:hidden">Manutenção</span>
            <Badge variant="destructive" className="ml-1">
              {statusCounts.em_manutencao}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="locacao" className="gap-2">
            Locação
            <Badge variant="default" className="ml-1">
              {statusCounts.locacao}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aguardando_laudo" className="gap-2">
            <span className="hidden sm:inline">Aguardando Laudo</span>
            <span className="sm:hidden">Laudo</span>
            <Badge variant="warning" className="ml-1">
              {statusCounts.aguardando_laudo}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
