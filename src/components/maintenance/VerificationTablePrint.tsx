import { VerificationSection } from "@/lib/maintenancePlanDefaults";

interface VerificationTablePrintProps {
  sections: VerificationSection[];
}

export function VerificationTablePrint({ sections }: VerificationTablePrintProps) {
  const frequencyColumns = [
    { key: "daily", label: "Diário" },
    { key: "h250", label: "250h" },
    { key: "h500", label: "500h" },
    { key: "h1000", label: "1000h" },
    { key: "h4000", label: "4000h" },
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
