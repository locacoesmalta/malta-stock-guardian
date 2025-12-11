import { VerificationSection } from "@/lib/maintenancePlanDefaults";

interface VerificationTablePrintProps {
  sections: VerificationSection[];
}

// Colunas de frequência para Motor
const motorColumns = [
  { key: "h50", label: "50h" },
  { key: "h100", label: "100h" },
  { key: "h200", label: "200h" },
  { key: "h800", label: "800h" },
  { key: "h2000", label: "2000h" },
] as const;

// Colunas de frequência para Alternador
const alternadorColumns = [
  { key: "h250", label: "250h" },
  { key: "h1000", label: "1000h" },
  { key: "h10000", label: "10000h" },
  { key: "h30000", label: "30000h" },
] as const;

// Seleciona colunas corretas baseado na categoria
const getColumnsForCategory = (category?: string) => {
  if (category === "alternador") {
    return alternadorColumns;
  }
  return motorColumns;
};

export function VerificationTablePrint({ sections }: VerificationTablePrintProps) {
  if (sections.length === 0) {
    return null;
  }

  // Separar seções por categoria
  const motorSections = sections.filter(s => s.category === "motor");
  const alternadorSections = sections.filter(s => s.category === "alternador");
  const otherSections = sections.filter(s => !s.category || s.category === "geral");

  const renderSections = (sectionList: VerificationSection[], category?: string) => {
    const columns = getColumnsForCategory(category);
    
    return sectionList.map((section) => (
      <div key={section.id} className="print-verification-section">
        <div className="print-section-header">{section.title}</div>
        <table className="print-table">
          <thead>
            <tr>
              <th className="print-th-description">Descrição</th>
              {columns.map((col) => (
                <th key={col.key} className="print-th-check">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.id}>
                <td className="print-td-description">{item.description}</td>
                {columns.map((col) => (
                  <td key={col.key} className="print-td-check">
                    {item[col.key as keyof typeof item] ? "✓" : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ));
  };

  return (
    <div className="print-verification-table">
      <h3 className="print-section-title">TABELA DE VERIFICAÇÕES</h3>
      
      {motorSections.length > 0 && (
        <div className="print-category-group">
          <div className="print-category-header" style={{ color: '#ea580c' }}>
            🔧 MANUTENÇÃO DO MOTOR
          </div>
          {renderSections(motorSections, "motor")}
        </div>
      )}

      {alternadorSections.length > 0 && (
        <div className="print-category-group">
          <div className="print-category-header" style={{ color: '#2563eb' }}>
            ⚡ MANUTENÇÃO DO ALTERNADOR
          </div>
          {renderSections(alternadorSections, "alternador")}
        </div>
      )}

      {otherSections.length > 0 && renderSections(otherSections)}
    </div>
  );
}
