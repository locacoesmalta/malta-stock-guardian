import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDays, differenceInDays, format } from "date-fns";
import { ArrowLeft, Upload, X, FileText, Printer, Search, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRentalCompany, useCreateRentalCompany, useUpdateRentalCompany } from "@/hooks/useRentalCompanies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ContractExpirationBadge } from "@/components/ContractExpirationBadge";
import { useCnpjLookup, formatCnpj, validateCnpj } from "@/hooks/useCnpjLookup";
import { AssetSearchCombobox } from "@/components/AssetSearchCombobox";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { formatPAT } from "@/lib/patUtils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  useRentalEquipment, 
  useAddRentalEquipment, 
  useDeleteRentalEquipment,
  calculateDaysRented,
  type RentalEquipmentInput 
} from "@/hooks/useRentalEquipment";
import "@/styles/contract-print.css";

const formSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contract_number: z.string().min(1, "Número do contrato é obrigatório"),
  contract_type: z.enum(["15", "30"]),
  contract_start_date: z.string().min(1, "Data de início é obrigatória"),
  contract_end_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function RentalCompanyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { data: company } = useRentalCompany(id || "");
  const createMutation = useCreateRentalCompany();
  const updateMutation = useUpdateRentalCompany();
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const cnpjLookupMutation = useCnpjLookup();
  
  // Equipment management
  const { data: assets } = useAssetsQuery();
  const { data: rentalEquipment = [] } = useRentalEquipment(id || "");
  const addEquipmentMutation = useAddRentalEquipment();
  const deleteEquipmentMutation = useDeleteRentalEquipment();
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [equipmentPAT, setEquipmentPAT] = useState("");
  const [equipmentName, setEquipmentName] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  
  const { data: equipmentByPAT } = useEquipmentByPAT(equipmentPAT);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: "",
      cnpj: "",
      address: "",
      contact_phone: "",
      contact_email: "",
      contract_number: "",
      contract_type: "30",
      contract_start_date: "",
      contract_end_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        company_name: company.company_name,
        cnpj: company.cnpj,
        address: company.address || "",
        contact_phone: company.contact_phone || "",
        contact_email: company.contact_email || "",
        contract_number: company.contract_number,
        contract_type: company.contract_type,
        contract_start_date: company.contract_start_date,
        contract_end_date: company.contract_end_date || "",
        notes: company.notes || "",
      });
      setUploadedFiles(company.documents || []);
    }
  }, [company, form]);

  // Auto-fill equipment details when PAT is selected
  useEffect(() => {
    if (equipmentByPAT) {
      setEquipmentName(equipmentByPAT.equipment_name);
      setSelectedAssetId(equipmentByPAT.id);
    }
  }, [equipmentByPAT]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("rental-contracts")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("rental-contracts")
          .getPublicUrl(filePath);

        setUploadedFiles((prev) => [...prev, { name: file.name, url: publicUrl, path: filePath }]);
        
        toast({
          title: "Arquivo enviado",
          description: `${file.name} foi enviado com sucesso.`,
        });
      } catch (error: any) {
        toast({
          title: "Erro ao enviar arquivo",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveFile = async (index: number) => {
    const file = uploadedFiles[index];
    try {
      if (file.path) {
        await supabase.storage.from("rental-contracts").remove([file.path]);
      }
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    } catch (error: any) {
      toast({
        title: "Erro ao remover arquivo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCnpjLookup = async () => {
    const cnpj = form.getValues("cnpj");
    
    if (!validateCnpj(cnpj)) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ válido com 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    cnpjLookupMutation.mutate(cnpj, {
      onSuccess: (data) => {
        form.setValue("company_name", data.company_name);
        form.setValue("address", data.address);
        form.setValue("contact_phone", data.contact_phone);
        form.setValue("contact_email", data.contact_email);
      },
    });
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    form.setValue("cnpj", formatted);
  };

  const handleAddEquipment = () => {
    if (!id) {
      toast({
        title: "Salve o contrato primeiro",
        description: "Você precisa salvar o contrato antes de adicionar equipamentos.",
        variant: "destructive",
      });
      return;
    }

    if (!equipmentPAT || !equipmentName || !pickupDate) {
      toast({
        title: "Campos obrigatórios",
        description: "PAT, Nome do Equipamento e Data de Retirada são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const formattedPAT = formatPAT(equipmentPAT);
    if (!formattedPAT) {
      toast({
        title: "PAT inválido",
        description: "Digite um PAT válido com 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    const equipmentData: RentalEquipmentInput = {
      rental_company_id: id,
      asset_id: selectedAssetId || undefined,
      asset_code: formattedPAT,
      equipment_name: equipmentName,
      pickup_date: pickupDate,
      return_date: returnDate || undefined,
      daily_rate: dailyRate ? parseFloat(dailyRate) : undefined,
    };

    addEquipmentMutation.mutate(equipmentData, {
      onSuccess: () => {
        setEquipmentPAT("");
        setEquipmentName("");
        setPickupDate("");
        setReturnDate("");
        setDailyRate("");
        setSelectedAssetId("");
      },
    });
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    if (!id) return;
    deleteEquipmentMutation.mutate({ id: equipmentId, companyId: id });
  };

  const calculateEquipmentTotals = () => {
    const contractStart = form.watch("contract_start_date");
    if (!contractStart) return { totalEquipment: 0, totalDays: 0, totalValue: 0 };

    let totalDays = 0;
    let totalValue = 0;

    rentalEquipment.forEach((equipment) => {
      const days = calculateDaysRented(contractStart, equipment.return_date);
      totalDays += days;
      
      if (equipment.daily_rate) {
        totalValue += days * equipment.daily_rate;
      }
    });

    return {
      totalEquipment: rentalEquipment.length,
      totalDays,
      totalValue,
    };
  };

  const onSubmit = async (data: FormData) => {
    const contractStartDate = new Date(data.contract_start_date);
    
    // Se contract_end_date for fornecida, usa ela; senão calcula baseado no tipo
    let contractEndDate: Date;
    if (data.contract_end_date) {
      contractEndDate = new Date(data.contract_end_date);
    } else {
      const contractDays = parseInt(data.contract_type);
      contractEndDate = addDays(contractStartDate, contractDays);
    }

    const submissionData: any = {
      company_name: data.company_name,
      cnpj: data.cnpj,
      address: data.address || undefined,
      contact_phone: data.contact_phone || undefined,
      contact_email: data.contact_email || undefined,
      contract_number: data.contract_number,
      contract_type: data.contract_type,
      contract_start_date: data.contract_start_date,
      contract_end_date: format(contractEndDate, "yyyy-MM-dd"),
      notes: data.notes || undefined,
      documents: uploadedFiles,
      is_renewed: false,
    };

    if (isEditMode && id) {
      updateMutation.mutate({ id, ...submissionData }, {
        onSuccess: () => navigate("/rental-companies"),
      });
    } else {
      createMutation.mutate(submissionData, {
        onSuccess: () => navigate("/rental-companies"),
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const suggestedEndDate = form.watch("contract_start_date")
    ? format(
        addDays(new Date(form.watch("contract_start_date")), parseInt(form.watch("contract_type"))),
        "yyyy-MM-dd"
      )
    : "";

  const equipmentTotals = calculateEquipmentTotals();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/rental-companies")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Editar Empresa de Locação" : "Nova Empresa de Locação"}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? "Atualize os dados da empresa" : "Cadastre uma nova empresa de locação"}
            </p>
          </div>
        </div>
        {isEditMode && (
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Contrato
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="00.000.000/0000-00" 
                          maxLength={18}
                          onChange={handleCnpjChange}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCnpjLookup}
                        disabled={!validateCnpj(field.value) || cnpjLookupMutation.isPending}
                      >
                        {cnpjLookupMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 00000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contract_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Contrato *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contrato *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-sugerir data final ao mudar tipo
                          if (form.watch("contract_start_date") && !form.watch("contract_end_date")) {
                            const startDate = new Date(form.watch("contract_start_date"));
                            const endDate = addDays(startDate, parseInt(value));
                            form.setValue("contract_end_date", format(endDate, "yyyy-MM-dd"));
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date"
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto-sugerir data final ao mudar data início
                            if (!form.watch("contract_end_date")) {
                              const startDate = new Date(e.target.value);
                              const contractDays = parseInt(form.watch("contract_type"));
                              const endDate = addDays(startDate, contractDays);
                              form.setValue("contract_end_date", format(endDate, "yyyy-MM-dd"));
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contract_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Final do Contrato</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Deixe vazio para contratos em andamento ou preencha para contratos prorrogados
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("contract_end_date") && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Data de Término:</span>
                    <span>{format(new Date(form.watch("contract_end_date")), "dd/MM/yyyy")}</span>
                  </div>
                  <ContractExpirationBadge contractEndDate={form.watch("contract_end_date")} />
                </div>
              )}

              <div>
                <FormLabel>Documentos do Contrato</FormLabel>
                <div className="mt-2 space-y-2">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <label>
                      <Upload className="h-4 w-4 mr-2" />
                      Enviar Documentos
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                  </Button>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipamentos Locados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditMode && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Salve o contrato primeiro para adicionar equipamentos
                  </p>
                </div>
              )}

              {isEditMode && (
                <>
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold">Adicionar Equipamento</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">PAT (6 dígitos) *</label>
                        <Input
                          placeholder="000000"
                          value={equipmentPAT}
                          onChange={(e) => setEquipmentPAT(e.target.value)}
                          maxLength={6}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome do Equipamento *</label>
                        <Input
                          placeholder="Nome do equipamento"
                          value={equipmentName}
                          onChange={(e) => setEquipmentName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data de Retirada *</label>
                        <Input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data de Devolução</label>
                        <Input
                          type="date"
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Valor Diário (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={dailyRate}
                          onChange={(e) => setDailyRate(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddEquipment}
                      disabled={addEquipmentMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Equipamento
                    </Button>
                  </div>

                  {rentalEquipment.length > 0 && (
                    <>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>PAT</TableHead>
                              <TableHead>Equipamento</TableHead>
                              <TableHead>Retirada</TableHead>
                              <TableHead>Devolução</TableHead>
                              <TableHead className="text-right">Dias</TableHead>
                              <TableHead className="text-right">Valor Diário</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rentalEquipment.map((equipment) => {
                              const contractStart = form.watch("contract_start_date");
                              const days = contractStart ? calculateDaysRented(contractStart, equipment.return_date) : 0;
                              const total = equipment.daily_rate ? days * equipment.daily_rate : 0;

                              return (
                                <TableRow key={equipment.id}>
                                  <TableCell className="font-mono">{equipment.asset_code}</TableCell>
                                  <TableCell>{equipment.equipment_name}</TableCell>
                                  <TableCell>{format(new Date(equipment.pickup_date), "dd/MM/yyyy")}</TableCell>
                                  <TableCell>
                                    {equipment.return_date ? (
                                      format(new Date(equipment.return_date), "dd/MM/yyyy")
                                    ) : (
                                      <Badge variant="secondary">Em Locação</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">{days}</TableCell>
                                  <TableCell className="text-right">
                                    {equipment.daily_rate ? `R$ ${equipment.daily_rate.toFixed(2)}` : "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {total > 0 ? `R$ ${total.toFixed(2)}` : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteEquipment(equipment.id)}
                                      disabled={deleteEquipmentMutation.isPending}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Total de Equipamentos:</span>
                          <span className="font-bold">{equipmentTotals.totalEquipment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Total de Dias Locados:</span>
                          <span className="font-bold">{equipmentTotals.totalDays} dias</span>
                        </div>
                        {equipmentTotals.totalValue > 0 && (
                          <div className="flex justify-between text-lg pt-2 border-t">
                            <span className="font-bold">Valor Total da Locação:</span>
                            <span className="font-bold text-primary">
                              R$ {equipmentTotals.totalValue.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observações adicionais sobre o contrato" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/rental-companies")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditMode ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
