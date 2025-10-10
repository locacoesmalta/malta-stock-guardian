import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMonthlyProductivity, useCollaboratorDetails, useAllCollaborators } from "@/hooks/useMaltaProductivity";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MaltaProductivity() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: productivityData, isLoading: isLoadingProductivity } = useMonthlyProductivity(
    selectedYear,
    selectedMonth
  );

  const { data: collaboratorDetails, isLoading: isLoadingDetails } = useCollaboratorDetails(
    selectedCollaborator,
    startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate ? format(endDate, "yyyy-MM-dd") : undefined
  );

  const { data: allCollaborators } = useAllCollaborators();

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i);
  const months = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const calculateDaysInMaintenance = (
    arrivalDate: string | null,
    departureDate: string | null
  ): number => {
    if (!arrivalDate) return 0;
    
    const arrival = new Date(arrivalDate);
    const departure = departureDate ? new Date(departureDate) : new Date();
    
    return differenceInDays(departure, arrival);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Produtividade Malta</h1>
      </div>

      {/* Gráfico de Barras Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Produtividade Mensal por Colaborador</CardTitle>
          <CardDescription>
            Quantidade de equipamentos trabalhados no período selecionado
          </CardDescription>
          <div className="flex gap-4 mt-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingProductivity ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : productivityData && productivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="collaborator_name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="equipment_count"
                  fill="hsl(var(--primary))"
                  name="Equipamentos"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Nenhum dado encontrado para o período selecionado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhamento por Colaborador */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Colaborador</CardTitle>
          <CardDescription>
            Visualize todos os equipamentos trabalhados por um colaborador específico
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Colaborador</Label>
              <Select
                value={selectedCollaborator || ""}
                onValueChange={setSelectedCollaborator}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {allCollaborators?.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data Fim (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {(startDate || endDate) && (
              <div className="space-y-2">
                <Label className="invisible">Limpar</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCollaborator ? (
            <div className="text-center py-8 text-muted-foreground">
              Selecione um colaborador para ver os detalhes
            </div>
          ) : isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : collaboratorDetails && collaboratorDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PAT</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Data Entrada</TableHead>
                    <TableHead>Data Saída</TableHead>
                    <TableHead>Tempo (dias)</TableHead>
                    <TableHead>Todos Colaboradores</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaboratorDetails.map((detail) => (
                    <TableRow key={detail.id}>
                      <TableCell>
                        <Link
                          to={`/assets/view/${detail.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {detail.asset_code}
                        </Link>
                      </TableCell>
                      <TableCell>{detail.equipment_name}</TableCell>
                      <TableCell>{detail.maintenance_company || "-"}</TableCell>
                      <TableCell>{detail.maintenance_work_site || "-"}</TableCell>
                      <TableCell>
                        {detail.maintenance_arrival_date
                          ? format(new Date(detail.maintenance_arrival_date), "dd/MM/yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {detail.maintenance_departure_date ? (
                          format(new Date(detail.maintenance_departure_date), "dd/MM/yyyy")
                        ) : (
                          <span className="text-amber-600 font-medium">Em andamento</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {calculateDaysInMaintenance(
                          detail.maintenance_arrival_date,
                          detail.maintenance_departure_date
                        )}{" "}
                        dias
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {detail.all_collaborators.map((collab, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {collab}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {detail.maintenance_delay_observations || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum equipamento encontrado para este colaborador no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
