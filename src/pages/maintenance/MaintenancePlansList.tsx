import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useMaintenancePlansQuery, MaintenancePlansFilters } from "@/hooks/useMaintenancePlansQuery";
import { useMaintenancePlans } from "@/hooks/useMaintenancePlans";
import { formatHourmeter } from "@/lib/hourmeterUtils";
import { formatBelemDate } from "@/config/timezone";
import { useConfirm } from "@/hooks/useConfirm";
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Printer, 
  Trash2, 
  Wrench, 
  AlertCircle,
  CalendarDays,
  Clock
} from "lucide-react";
import { toast } from "sonner";

export default function MaintenancePlansList() {
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirm();
  const { deletePlan } = useMaintenancePlans();
  
  // Filtros
  const [filters, setFilters] = useState<MaintenancePlansFilters>({
    startDate: "",
    endDate: "",
    equipmentCode: "",
    planType: "",
    searchTerm: "",
  });
  const [activeFilters, setActiveFilters] = useState<MaintenancePlansFilters>({});
  
  const { data: plans = [], isLoading, refetch } = useMaintenancePlansQuery(activeFilters);
  
  const handleFilter = () => {
    setActiveFilters({ ...filters });
  };
  
  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      equipmentCode: "",
      planType: "",
      searchTerm: "",
    });
    setActiveFilters({});
  };
  
  const handleDelete = async (id: string, equipmentName: string) => {
    const confirmed = await confirm({
      title: "Excluir Plano de Manutenção",
      description: `Deseja realmente excluir o plano de manutenção do equipamento "${equipmentName}"? Esta ação não pode ser desfeita.`,
    });
    
    if (confirmed) {
      deletePlan.mutate(id, {
        onSuccess: () => {
          toast.success("Plano excluído com sucesso");
          refetch();
        },
        onError: (error) => {
          toast.error("Erro ao excluir plano", { description: error.message });
        },
      });
    }
  };
  
  const handlePrint = (id: string) => {
    navigate(`/maintenance/plan/${id}?print=true`);
  };
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <ConfirmDialog />
      <BackButton />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Planos de Manutenção</h1>
          <p className="text-muted-foreground">
            {plans.length} plano(s) encontrado(s)
          </p>
        </div>
        <Button onClick={() => navigate("/maintenance/plan")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>PAT</Label>
              <Input
                placeholder="0001, 0048..."
                value={filters.equipmentCode}
                onChange={(e) => setFilters(prev => ({ ...prev, equipmentCode: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filters.planType || "_all"}
                onValueChange={(value) => setFilters(prev => ({ ...prev, planType: value === "_all" ? "" : value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="corretiva">Corretiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Busca Geral</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Equipamento, técnico..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter}>
              Filtrar
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Planos */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" label="Carregando planos..." />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum plano encontrado</p>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou crie um novo plano de manutenção.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={plan.plan_type === "preventiva" ? "default" : "destructive"}>
                        {plan.plan_type === "preventiva" ? "🔧 Preventiva" : "🔴 Corretiva"}
                      </Badge>
                      {plan.equipment_code && (
                        <Badge variant="outline">PAT: {plan.equipment_code}</Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg">
                      {plan.equipment_name || "Equipamento não informado"}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {formatBelemDate(plan.plan_date, "dd/MM/yyyy")}
                      </span>
                      {plan.current_hourmeter && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatHourmeter(plan.current_hourmeter)}
                        </span>
                      )}
                      {plan.technician_name && (
                        <span>Técnico: {plan.technician_name}</span>
                      )}
                    </div>
                    
                    {(plan.client_company || plan.client_work_site) && (
                      <p className="text-sm text-muted-foreground">
                        {plan.client_company}{plan.client_company && plan.client_work_site && " - "}{plan.client_work_site}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/maintenance/plan/${plan.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver/Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(plan.id)}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(plan.id, plan.equipment_name || "Sem nome")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
