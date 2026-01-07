import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAssetReturnsCount } from "@/hooks/useAssetReturns";

interface StatusCounts {
  deposito_malta: number;
  em_manutencao: number;
  locacao: number;
  aguardando_laudo: number;
}

interface AssetStatusTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  statusCounts: StatusCounts;
  filteredCounts?: StatusCounts;
}

export const AssetStatusTabs = ({ activeTab, onTabChange, statusCounts, filteredCounts }: AssetStatusTabsProps) => {
  const totalAssets = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const totalFiltered = filteredCounts ? Object.values(filteredCounts).reduce((a, b) => a + b, 0) : null;
  const { data: returnsCount = 0 } = useAssetReturnsCount();
  
  // Helper to render count with filtered indicator
  const renderCount = (key: keyof StatusCounts) => {
    const total = statusCounts[key];
    const filtered = filteredCounts?.[key];
    
    if (filtered !== undefined && filtered !== total) {
      return `${filtered} / ${total}`;
    }
    return total;
  };

  return (
    <div className="mb-6">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="all" className="gap-2">
            Todos
            <Badge variant="outline" className="ml-1">
              {totalFiltered !== null && totalFiltered !== totalAssets ? `${totalFiltered} / ${totalAssets}` : totalAssets}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deposito_malta" className="gap-2">
            <span className="hidden sm:inline">Depósito Malta</span>
            <span className="sm:hidden">Depósito</span>
            <Badge variant="secondary" className="ml-1">
              {renderCount("deposito_malta")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="em_manutencao" className="gap-2">
            <span className="hidden sm:inline">Em Manutenção</span>
            <span className="sm:hidden">Manutenção</span>
            <Badge variant="destructive" className="ml-1">
              {renderCount("em_manutencao")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="locacao" className="gap-2">
            Locação
            <Badge variant="default" className="ml-1">
              {renderCount("locacao")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="aguardando_laudo" className="gap-2">
            <span className="hidden sm:inline">Aguardando Laudo</span>
            <span className="sm:hidden">Laudo</span>
            <Badge variant="warning" className="ml-1">
              {renderCount("aguardando_laudo")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="devolucao" className="gap-2">
            <span className="hidden sm:inline">Devolução</span>
            <span className="sm:hidden">Devol.</span>
            <Badge variant="outline" className="ml-1 bg-green-100 text-green-700 border-green-300">
              {returnsCount}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
