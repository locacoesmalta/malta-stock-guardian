import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search, QrCode, FileText } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { BackButton } from "@/components/BackButton";
import { AssetDataWarning } from "@/components/AssetDataWarning";
import { EquipmentBrandSelector } from "@/components/EquipmentBrandSelector";
import { EquipmentTypeSelector } from "@/components/EquipmentTypeSelector";
import { EquipmentModelSelector } from "@/components/EquipmentModelSelector";
import { AssetStatusBar } from "@/components/assets/AssetStatusBar";
import { AssetViewToggle } from "@/components/assets/AssetViewToggle";
import { AssetKanbanView } from "@/components/assets/AssetKanbanView";
import { AssetGridView } from "@/components/assets/AssetGridView";
import { AssetUrgencyFilter } from "@/components/assets/AssetUrgencyFilter";
import { AssetSummaryCard } from "@/components/assets/AssetSummaryCard";
import { AssetStatusTabs } from "@/components/assets/AssetStatusTabs";
import { AssetReturnsView } from "@/components/assets/AssetReturnsView";

export default function AssetsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedEquipmentType, setSelectedEquipmentType] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "kanban">("grid");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "attention" | "on-track">("all");
  
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: assets = [], isLoading, error } = useAssetsQuery();

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case "1":
          setActiveTab("deposito_malta");
          break;
        case "2":
          setActiveTab("em_manutencao");
          break;
        case "3":
          setActiveTab("locacao");
          break;
        case "4":
          setActiveTab("aguardando_laudo");
          break;
        case "g":
        case "G":
          setViewMode("grid");
          break;
        case "k":
        case "K":
          setViewMode("kanban");
          break;
        case "Escape":
          setActiveStatusFilter(null);
          setActiveTab("all");
          setUrgencyFilter("all");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  if (error) {
    toast.error("Erro ao carregar patrimônios");
  }

  // Calcular urgência de equipamentos
  const getAssetUrgency = (asset: any): boolean => {
    // Aguardando laudo > 6 dias
    if (asset.location_type === "aguardando_laudo" && asset.inspection_start_date) {
      const daysSince = differenceInDays(new Date(), parseISO(asset.inspection_start_date));
      if (daysSince > 6) return true;
    }
    
    // Em manutenção > 30 dias
    if (asset.location_type === "em_manutencao" && asset.maintenance_arrival_date) {
      const daysSince = differenceInDays(new Date(), parseISO(asset.maintenance_arrival_date + "T00:00:00"));
      if (daysSince > 30) return true;
    }

    // Locação com contrato vencendo em 7 dias
    if (asset.location_type === "locacao" && asset.rental_end_date) {
      const daysUntil = differenceInDays(parseISO(asset.rental_end_date + "T00:00:00"), new Date());
      if (daysUntil <= 7 && daysUntil >= 0) return true;
    }

    return false;
  };

  // Filtro hierárquico com validação de fabricante
  let filteredAssets = assets.filter((asset) => {
    // 1º FILTRO CRÍTICO: Verificar se tem fabricante (ocultar sem fabricante)
    if (!asset.manufacturer || asset.manufacturer.trim() === "") {
      return false;
    }

    // 2º FILTRO: Por fabricante selecionado
    if (selectedManufacturer && asset.manufacturer !== selectedManufacturer) {
      return false;
    }

    // 3º FILTRO: Por tipo de equipamento
    if (selectedEquipmentType && asset.equipment_name !== selectedEquipmentType) {
      return false;
    }

    // 4º FILTRO: Por modelo (opcional)
    if (selectedModel && asset.model !== selectedModel) {
      return false;
    }

    // 5º FILTRO: Busca textual
    if (searchTerm) {
      return (
        asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.rental_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.rental_work_site?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return true;
  });

  // Filtro por status (barra de contadores)
  if (activeStatusFilter) {
    filteredAssets = filteredAssets.filter((asset) => asset.location_type === activeStatusFilter);
  }

  // Filtro por tabs (exceto devolução que é tratado separadamente)
  if (activeTab !== "all" && activeTab !== "devolucao") {
    filteredAssets = filteredAssets.filter((asset) => asset.location_type === activeTab);
  }

  // Filtro por urgência
  if (urgencyFilter === "attention") {
    filteredAssets = filteredAssets.filter((asset) => getAssetUrgency(asset));
  } else if (urgencyFilter === "on-track") {
    filteredAssets = filteredAssets.filter((asset) => !getAssetUrgency(asset));
  }

  // Calcular estatísticas
  const statusCounts = {
    deposito_malta: assets.filter((a) => a.location_type === "deposito_malta" && a.manufacturer).length,
    em_manutencao: assets.filter((a) => a.location_type === "em_manutencao" && a.manufacturer).length,
    locacao: assets.filter((a) => a.location_type === "locacao" && a.manufacturer).length,
    aguardando_laudo: assets.filter((a) => a.location_type === "aguardando_laudo" && a.manufacturer).length,
  };

  const urgentCount = assets.filter((a) => a.manufacturer && getAssetUrgency(a)).length;

  const maintenanceAssets = assets.filter((a) => a.location_type === "em_manutencao" && a.maintenance_arrival_date);
  const averageMaintenanceDays =
    maintenanceAssets.length > 0
      ? Math.round(
          maintenanceAssets.reduce((sum, asset) => {
            const days = differenceInDays(new Date(), parseISO(asset.maintenance_arrival_date + "T00:00:00"));
            return sum + days;
          }, 0) / maintenanceAssets.length
        )
      : 0;

  const totalAssets = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const rentalPercentage = totalAssets > 0 ? (statusCounts.locacao / totalAssets) * 100 : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
      <div className="space-y-3 mb-4 sm:mb-6">
        <BackButton />
        
        {/* Alerta de Dados Incompletos */}
        <AssetDataWarning />

        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold">Gestão de Patrimônio</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Gerencie todos os equipamentos do patrimônio
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {isAdmin && (
                <Button
                  onClick={() => navigate("/assets/unified-history")}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Histórico Unificado</span>
                  <span className="lg:hidden">Histórico</span>
                </Button>
              )}
              <Button
                onClick={() => navigate("/assets/traceability")}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <FileText className="h-4 w-4 mr-2" />
                Rastreabilidade
              </Button>
              <Button
                onClick={() => navigate("/assets/scanner")}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scanner
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => navigate("/assets/register")}
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Cadastro de Equipamento</span>
                  <span className="lg:hidden">Cadastrar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card de Resumo Expansível */}
      <AssetSummaryCard
        statusCounts={statusCounts}
        urgentCount={urgentCount}
        averageMaintenanceDays={averageMaintenanceDays}
        rentalPercentage={rentalPercentage}
      />

      {/* Barra de Status com Contadores */}
      <AssetStatusBar
        statusCounts={statusCounts}
        activeFilter={activeStatusFilter}
        onFilterChange={setActiveStatusFilter}
      />

      {/* Sistema de Tabs */}
      <AssetStatusTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        statusCounts={statusCounts}
      />

      {/* Filtros Hierárquicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fabricante</label>
          <EquipmentBrandSelector
            value={selectedManufacturer}
            onChange={(value) => {
              setSelectedManufacturer(value);
              setSelectedEquipmentType("");
              setSelectedModel("");
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Equipamento</label>
          <EquipmentTypeSelector
            brand={selectedManufacturer}
            value={selectedEquipmentType}
            onChange={(value) => {
              setSelectedEquipmentType(value);
              setSelectedModel("");
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Modelo (Opcional)</label>
          <EquipmentModelSelector
            brand={selectedManufacturer}
            type={selectedEquipmentType}
            value={selectedModel}
            onChange={setSelectedModel}
          />
        </div>
      </div>

      {/* Botão para limpar filtros */}
      {(selectedManufacturer || selectedEquipmentType || selectedModel) && (
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedManufacturer("");
              setSelectedEquipmentType("");
              setSelectedModel("");
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Barra de controles: Busca, Filtros e Toggle de Visualização */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por código, equipamento, empresa ou obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AssetUrgencyFilter
          value={urgencyFilter}
          onChange={setUrgencyFilter}
          urgentCount={urgentCount}
        />
        <AssetViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Renderização condicional: Devoluções, Grid ou Kanban */}
      {activeTab === "devolucao" ? (
        <AssetReturnsView />
      ) : viewMode === "grid" ? (
        <AssetGridView assets={filteredAssets} />
      ) : (
        <AssetKanbanView assets={filteredAssets} />
      )}
    </div>
  );
}
