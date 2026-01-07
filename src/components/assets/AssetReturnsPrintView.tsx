import { formatPAT } from "@/lib/patUtils";
import { formatBelemDate, formatBRFromYYYYMMDD } from "@/lib/dateUtils";
import { getLocationLabel } from "@/lib/locationUtils";
import type { AssetReturn } from "@/hooks/useAssetReturns";

interface AssetReturnsPrintViewProps {
  returns: AssetReturn[];
  periodLabel: string;
}

const getDurationClass = (days: number | null) => {
  if (days === null) return "";
  if (days <= 30) return "print-duration-green";
  if (days <= 90) return "print-duration-yellow";
  if (days <= 180) return "print-duration-orange";
  return "print-duration-red";
};

export const AssetReturnsPrintView = ({ returns, periodLabel }: AssetReturnsPrintViewProps) => {
  const now = new Date();
  const formattedDate = formatBelemDate(now.toISOString());
  const formattedTime = now.toLocaleTimeString("pt-BR", { 
    hour: "2-digit", 
    minute: "2-digit",
    timeZone: "America/Belem"
  });

  // Calcular média de duração
  const validDurations = returns.filter(r => r.duracao_dias !== null).map(r => r.duracao_dias!);
  const averageDuration = validDurations.length > 0
    ? Math.round(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
    : null;

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
              <h1 className="print-assets-title">DEVOLUÇÕES DE EQUIPAMENTOS</h1>
              <p className="print-assets-subtitle">{periodLabel}</p>
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
              <th style={{ width: "65px" }}>PAT</th>
              <th>Equipamento</th>
              <th style={{ width: "120px" }}>Empresa</th>
              <th style={{ width: "120px" }}>Obra</th>
              <th style={{ width: "70px" }}>Início</th>
              <th style={{ width: "70px" }}>Devolução</th>
              <th style={{ width: "60px" }}>Duração</th>
              <th style={{ width: "90px" }}>Registrado</th>
              <th style={{ width: "90px" }}>Status</th>
              <th style={{ width: "85px" }}>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{formatPAT(item.codigo_pat)}</td>
                <td>{item.equipment_name}</td>
                <td>{item.empresa}</td>
                <td>{item.obra}</td>
                <td>{item.data_inicio_locacao ? formatBRFromYYYYMMDD(item.data_inicio_locacao.split('T')[0]) : "-"}</td>
                <td>{item.data_devolucao ? formatBRFromYYYYMMDD(item.data_devolucao.split('T')[0]) : "-"}</td>
                <td>
                  {item.duracao_dias !== null ? (
                    <span className={`print-duration-badge ${getDurationClass(item.duracao_dias)}`}>
                      {item.duracao_dias} dia{item.duracao_dias !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{item.usuario_nome || "-"}</td>
                <td>
                  {item.current_location_type ? (
                    <span className={`print-status-badge print-status-${item.current_location_type.replace(/_/g, '-')}`}>
                      {getLocationLabel(item.current_location_type)}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {item.was_substitution ? (
                    <span className="print-status-badge print-type-substitution">
                      Substituição
                      {item.substituted_by_pat && <span className="print-subst-pat"> ({item.substituted_by_pat})</span>}
                    </span>
                  ) : (
                    <span className="print-status-badge print-type-normal">Normal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Rodapé */}
        <div className="print-assets-footer">
          <span className="print-assets-total">
            Total: {returns.length} devolução{returns.length !== 1 ? "ões" : ""}
            {averageDuration !== null && ` | Média: ${averageDuration} dias`}
          </span>
          <span>Malta Stock Guardian</span>
        </div>
      </div>
    </div>
  );
};
