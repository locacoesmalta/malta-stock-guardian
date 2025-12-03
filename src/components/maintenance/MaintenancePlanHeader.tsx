import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

interface MaintenancePlanHeaderProps {
  companyName: string;
  companyCnpj: string;
  companyAddress: string;
  companyCep: string;
  companyPhone: string;
  companyEmail: string;
  onChange: (field: string, value: string) => void;
}

export function MaintenancePlanHeader({
  companyName,
  companyCnpj,
  companyAddress,
  companyCep,
  companyPhone,
  companyEmail,
  onChange,
}: MaintenancePlanHeaderProps) {
  return (
    <Card className="no-print">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Dados da Empresa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <Label htmlFor="company_name">Nome da Empresa</Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => onChange("company_name", e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_cnpj">CNPJ</Label>
            <Input
              id="company_cnpj"
              value={companyCnpj}
              onChange={(e) => onChange("company_cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_cep">CEP</Label>
            <Input
              id="company_cep"
              value={companyCep}
              onChange={(e) => onChange("company_cep", e.target.value)}
              placeholder="00000-000"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_address">Endereço</Label>
            <Input
              id="company_address"
              value={companyAddress}
              onChange={(e) => onChange("company_address", e.target.value)}
              placeholder="Endereço completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_phone">Telefone</Label>
            <Input
              id="company_phone"
              value={companyPhone}
              onChange={(e) => onChange("company_phone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-2">
            <Label htmlFor="company_email">E-mail</Label>
            <Input
              id="company_email"
              type="email"
              value={companyEmail}
              onChange={(e) => onChange("company_email", e.target.value)}
              placeholder="contato@empresa.com.br"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
