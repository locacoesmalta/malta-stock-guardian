import { VerificationSection } from "@/lib/maintenancePlanDefaults";

interface VerificationTablePrintProps {
  sections: VerificationSection[];
}

export function VerificationTablePrint({ sections }: VerificationTablePrintProps) {
  const frequencyColumns = [
    { key: "h50", label: "50h" },
    { key: "h100", label: "100h" },
    { key: "h200", label: "200h" },
    { key: "h800", label: "800h" },
    { key: "h2000", label: "2000h" },
  ] as const;

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="print-verification-table">
      <h3 className="print-section-title">TABELA DE VERIFICAÇÕES</h3>
      
      {sections.map((section) => (
        <div key={section.id} className="print-verification-section">
          <div className="print-section-header">{section.title}</div>
          <table className="print-table">
            <thead>
              <tr>
                <th className="print-th-description">Descrição</th>
                {frequencyColumns.map((col) => (
                  <th key={col.key} className="print-th-check">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.items.map((item) => (
                <tr key={item.id}>
                  <td className="print-td-description">{item.description}</td>
                  {frequencyColumns.map((col) => (
                    <td key={col.key} className="print-td-check">
                      {item[col.key] ? "✓" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
