import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRentalCompaniesWithEquipment, useDeleteRentalCompany } from "@/hooks/useRentalCompanies";
import { ContractExpirationBadge } from "@/components/ContractExpirationBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useConfirm } from "@/hooks/useConfirm";

export default function RentalCompaniesList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: companies, isLoading } = useRentalCompaniesWithEquipment();
  const deleteMutation = useDeleteRentalCompany();
  const { ConfirmDialog, confirm } = useConfirm();

  const filteredCompanies = companies?.filter(
    (company) =>
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm) ||
      company.contract_number.includes(searchTerm)
  );

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: `Tem certeza que deseja excluir a empresa "${name}"?`,
      description: "Esta ação não pode ser desfeita.",
    });
    
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Empresas de Locação</h1>
          <p className="text-muted-foreground">Gerencie contratos de locação de equipamentos</p>
        </div>
        <Button onClick={() => navigate("/rental-companies/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ ou número do contrato..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredCompanies && filteredCompanies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.company_name}</TableCell>
                    <TableCell>{company.cnpj}</TableCell>
                    <TableCell>{company.contract_number}</TableCell>
                    <TableCell>{company.contract_type} dias</TableCell>
                    <TableCell>
                      <ContractExpirationBadge 
                        contractEndDate={company.contract_end_date}
                        allEquipmentReturned={company.all_equipment_returned}
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(company.contract_start_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(company.contract_end_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/rental-companies/${company.id}/edit`)}
                          title="Editar contrato"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company.id, company.company_name)}
                          title="Excluir contrato"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma empresa encontrada
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />
    </div>
  );
}
