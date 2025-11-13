import { CashBoxManager } from "@/components/CashBoxManager";

export default function CashBox() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Caixa da Malta</h1>
          <p className="text-muted-foreground mt-2">
            Gestão do caixa diário da empresa
          </p>
        </div>
      </div>

      <CashBoxManager />
    </div>
  );
}
