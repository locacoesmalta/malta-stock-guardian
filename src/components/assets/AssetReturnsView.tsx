import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAssetReturns } from "@/hooks/useAssetReturns";
import { formatPAT } from "@/lib/patUtils";
import { formatBRFromYYYYMMDD } from "@/lib/dateUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageCheck, Calendar, Building2, MapPin, User } from "lucide-react";

const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 3; i--) {
    years.push({ value: i.toString(), label: i.toString() });
  }
  return years;
};

export const AssetReturnsView = () => {
  const navigate = useNavigate();
  const now = new Date();
  
  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  // Calcular datas de início e fim do mês selecionado
  const startDate = `${selectedYear}-${selectedMonth}-01`;
  const lastDay = new Date(
    parseInt(selectedYear),
    parseInt(selectedMonth),
    0
  ).getDate();
  const endDate = `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

  const { data: returns = [], isLoading } = useAssetReturns({
    startDate,
    endDate,
  });

  const handleRowClick = (assetId: string | null, codigoPat: string) => {
    if (assetId) {
      navigate(`/assets/${assetId}`);
    } else {
      // Fallback: buscar por código PAT na rastreabilidade
      navigate(`/assets/traceability?pat=${codigoPat}`);
    }
  };

  const yearOptions = getYearOptions();
  const selectedMonthLabel = MONTHS.find((m) => m.value === selectedMonth)?.label || "";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <PackageCheck className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Devoluções de Equipamentos</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {returns.length} {returns.length === 1 ? "devolução" : "devoluções"}
            </Badge>
          </div>
          
          {/* Filtros de Período */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <PackageCheck className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhuma devolução encontrada</p>
            <p className="text-sm">
              Não há registros de devolução para {selectedMonthLabel} de {selectedYear}
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">PAT</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      Empresa
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Obra
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Início Locação
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Devolução
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Registrado por
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(item.asset_id, item.codigo_pat)}
                  >
                    <TableCell className="font-mono font-medium">
                      {formatPAT(item.codigo_pat)}
                    </TableCell>
                    <TableCell>
                      {item.equipment_name || (
                        <span className="text-muted-foreground italic">
                          Não identificado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.empresa || (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.obra || (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.data_inicio_locacao ? (
                        formatBRFromYYYYMMDD(item.data_inicio_locacao)
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.data_devolucao ? (
                        formatBRFromYYYYMMDD(item.data_devolucao.split("T")[0])
                      ) : (
                        <span className="text-muted-foreground italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.usuario_nome || (
                        <span className="text-muted-foreground italic">Sistema</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
