import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, QrCode, Building2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  location_type: string;
  rental_company?: string;
  rental_work_site?: string;
  rental_start_date?: string;
  rental_end_date?: string;
  deposito_description?: string;
  available_for_rental?: boolean;
  maintenance_company?: string;
  maintenance_work_site?: string;
  maintenance_description?: string;
  is_new_equipment?: boolean;
  created_at: string;
}

export default function AssetsList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Erro ao buscar patrimônios:", error);
      toast.error("Erro ao carregar patrimônios");
    } finally {
      setLoading(false);
    }
  };

  const getLocationLabel = (locationType: string) => {
    switch (locationType) {
      case "deposito_malta":
        return "Depósito Malta";
      case "liberado_locacao":
        return "Liberado para Locação";
      case "em_manutencao":
        return "Em Manutenção";
      case "locacao":
        return "Locação";
      default:
        return locationType;
    }
  };

  const getLocationVariant = (locationType: string) => {
    switch (locationType) {
      case "deposito_malta":
        return "secondary" as const;
      case "liberado_locacao":
        return "outline" as const;
      case "em_manutencao":
        return "destructive" as const;
      case "locacao":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.rental_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.rental_work_site?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestão de Patrimônio</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os equipamentos do patrimônio
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => navigate("/assets/scanner")}
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scanner
            </Button>
            {isAdmin && (
              <Button
                onClick={() => navigate("/assets/new")}
                className="flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por código, equipamento, empresa ou obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Nenhum patrimônio encontrado</p>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => isAdmin && navigate(`/assets/edit/${asset.id}`)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{asset.equipment_name}</h3>
                  <p className="text-sm text-muted-foreground">PAT: {asset.asset_code}</p>
                </div>
                <Badge variant={getLocationVariant(asset.location_type)}>
                  {getLocationLabel(asset.location_type)}
                </Badge>
              </div>

              {asset.location_type === "deposito_malta" && asset.deposito_description && (
                <div className="text-sm text-muted-foreground">
                  <p>{asset.deposito_description}</p>
                </div>
              )}

              {asset.location_type === "liberado_locacao" && (
                <div className="text-sm text-muted-foreground">
                  <p>{asset.available_for_rental ? "Disponível para locação" : "Indisponível"}</p>
                </div>
              )}

              {asset.location_type === "em_manutencao" && (
                <div className="space-y-2 text-sm">
                  {asset.maintenance_company && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{asset.maintenance_company}</span>
                    </div>
                  )}
                  {asset.maintenance_work_site && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{asset.maintenance_work_site}</span>
                    </div>
                  )}
                  {asset.maintenance_description && (
                    <p className="text-xs text-muted-foreground mt-2">{asset.maintenance_description}</p>
                  )}
                  {asset.is_new_equipment !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {asset.is_new_equipment ? "Novo" : "Usado"}
                    </Badge>
                  )}
                </div>
              )}

              {asset.location_type === "locacao" && (
                <div className="space-y-2 text-sm">
                  {asset.rental_company && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{asset.rental_company}</span>
                    </div>
                  )}
                  {asset.rental_work_site && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{asset.rental_work_site}</span>
                    </div>
                  )}
                  {asset.rental_start_date && (
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
                      <span>Início: {format(new Date(asset.rental_start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {asset.rental_end_date && (
                        <span>Fim: {format(new Date(asset.rental_end_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
