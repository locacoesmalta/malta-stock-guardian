import { formatPAT } from "@/lib/patUtils";
import { formatBelemDate } from "@/lib/dateUtils";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer?: string | null;
  model?: string | null;
  location_type: string;
  rental_company?: string | null;
  rental_work_site?: string | null;
  maintenance_company?: string | null;
  maintenance_work_site?: string | null;
}

interface AssetsPrintViewProps {
  assets: Asset[];
  filterTitle: string;
}

const getLocationLabel = (locationType: string) => {
  const labels: Record<string, string> = {
    deposito_malta: "Depósito Malta",
    locacao: "Em Locação",
    em_manutencao: "Em Manutenção",
    aguardando_laudo: "Aguardando Laudo",
  };
  return labels[locationType] || locationType;
};

const getStatusClass = (locationType: string) => {
  const classes: Record<string, string> = {
    deposito_malta: "print-status-deposito",
    locacao: "print-status-locacao",
    em_manutencao: "print-status-manutencao",
    aguardando_laudo: "print-status-laudo",
  };
  return classes[locationType] || "";
};

const getCompanyAndSite = (asset: Asset) => {
  if (asset.location_type === "locacao") {
    return {
      company: asset.rental_company || "-",
      site: asset.rental_work_site || "-",
    };
  }
  if (asset.location_type === "em_manutencao") {
    return {
      company: asset.maintenance_company || "-",
      site: asset.maintenance_work_site || "-",
    };
  }
  return { company: "-", site: "-" };
};

export const AssetsPrintView = ({ assets, filterTitle }: AssetsPrintViewProps) => {
  const now = new Date();
  const formattedDate = formatBelemDate(now.toISOString());
  const formattedTime = now.toLocaleTimeString("pt-BR", { 
    hour: "2-digit", 
    minute: "2-digit",
    timeZone: "America/Belem"
  });

  return (
    <div className="print-assets-wrapper">
      <div className="print-assets-content">
        {/* Cabeçalho */}
        <div className="print-assets-header">
          <div className="print-assets-header-left">
            <img 
              src="/malta-logo.webp" 
              alt="Malta Locações" 
              className="print-assets-logo"
            />
            <div>
              <h1 className="print-assets-title">GESTÃO DE PATRIMÔNIO</h1>
              <p className="print-assets-subtitle">{filterTitle}</p>
            </div>
          </div>
          <div className="print-assets-meta">
            <div>Malta Locações</div>
            <div>Gerado em: {formattedDate} às {formattedTime}</div>
          </div>
        </div>

        {/* Tabela */}
        <table className="print-assets-table">
          <thead>
            <tr>
              <th style={{ width: "80px" }}>PAT</th>
              <th>Equipamento</th>
              <th style={{ width: "120px" }}>Fabricante</th>
              <th style={{ width: "100px" }}>Modelo</th>
              <th style={{ width: "110px" }}>Status</th>
              <th style={{ width: "150px" }}>Empresa</th>
              <th style={{ width: "150px" }}>Obra</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const { company, site } = getCompanyAndSite(asset);
              return (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 600 }}>{formatPAT(asset.asset_code)}</td>
                  <td>{asset.equipment_name}</td>
                  <td>{asset.manufacturer || "-"}</td>
                  <td>{asset.model || "-"}</td>
                  <td>
                    <span className={`print-status-badge ${getStatusClass(asset.location_type)}`}>
                      {getLocationLabel(asset.location_type)}
                    </span>
                  </td>
                  <td>{company}</td>
                  <td>{site}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Rodapé */}
        <div className="print-assets-footer">
          <span className="print-assets-total">
            Total: {assets.length} equipamento{assets.length !== 1 ? "s" : ""}
          </span>
          <span>Malta Stock Guardian</span>
        </div>
      </div>
    </div>
  );
};
