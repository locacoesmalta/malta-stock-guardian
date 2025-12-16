import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDays, differenceInDays, format, parseISO } from "date-fns";
import { ArrowLeft, Upload, X, FileText, Printer, Search, Loader2, Plus, Trash2, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  useUpdateRentalEquipment,
  calculateDaysRented,
  type RentalEquipmentInput 
} from "@/hooks/useRentalEquipment";
import { ReturnEquipmentDialog } from "@/components/ReturnEquipmentDialog";
import "@/styles/contract-print.css";

const formSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  address: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  contract_number: z.string().min(1, "Número do contrato é obrigatório"),
  contract_type: z.enum(["15", "30", "indeterminado"]),
  contract_start_date: z.string().min(1, "Data de início é obrigatória"),
  contract_end_date: z.string().optional(),
  dia_corte: z.number().min(1).max(31).optional(),
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
  const [dailyRate15, setDailyRate15] = useState("");
  const [dailyRate30, setDailyRate30] = useState("");
  const [rentalPeriod, setRentalPeriod] = useState("30");
  const [workSite, setWorkSite] = useState("");
  
  // Return equipment dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [equipmentToReturn, setEquipmentToReturn] = useState<any>(null);
  
  // Edit equipment state
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const updateEquipmentMutation = useUpdateRentalEquipment();
  
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
      dia_corte: 1,
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
        dia_corte: company.dia_corte || 1,
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

    // PAT é opcional, mas nome e data de retirada são obrigatórios
    if (!equipmentName || !pickupDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do Equipamento e Data de Retirada são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Formatar PAT apenas se fornecido
    let formattedPAT: string | undefined;
    if (equipmentPAT.trim()) {
      formattedPAT = formatPAT(equipmentPAT);
      if (!formattedPAT) {
        toast({
          title: "PAT inválido",
          description: "Digite um PAT válido com até 6 dígitos.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validações de data
    const contractStart = form.watch("contract_start_date");
    const contractEnd = form.watch("contract_end_date");
    
    if (contractStart && pickupDate < contractStart) {
      toast({
        title: "Data inválida",
        description: "Data de retirada não pode ser anterior ao início do contrato.",
        variant: "destructive",
      });
      return;
    }
    
    if (contractEnd && pickupDate > contractEnd) {
      toast({
        title: "Data inválida",
        description: "Data de retirada não pode ser posterior ao fim do contrato.",
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
      daily_rate_15: dailyRate15 ? parseFloat(dailyRate15) : undefined,
      daily_rate_30: dailyRate30 ? parseFloat(dailyRate30) : undefined,
      rental_period: rentalPeriod,
      work_site: workSite || undefined,
    };

    addEquipmentMutation.mutate(equipmentData, {
      onSuccess: () => {
        setEquipmentPAT("");
        setEquipmentName("");
        setPickupDate("");
        setDailyRate15("");
        setDailyRate30("");
        setRentalPeriod("30");
        setWorkSite("");
        setSelectedAssetId("");
      },
    });
  };

  const handleEditEquipment = (equipment: any) => {
    setEditingEquipment(equipment);
  };

  const handleSaveEquipmentEdit = () => {
    if (!editingEquipment) return;

    updateEquipmentMutation.mutate({
      id: editingEquipment.id,
      asset_code: editingEquipment.asset_code,
      equipment_name: editingEquipment.equipment_name,
      pickup_date: editingEquipment.pickup_date,
      return_date: editingEquipment.return_date,
      daily_rate_15: editingEquipment.daily_rate_15,
      daily_rate_30: editingEquipment.daily_rate_30,
      rental_period: editingEquipment.rental_period,
      work_site: editingEquipment.work_site,
    }, {
      onSuccess: () => {
        setEditingEquipment(null);
      },
    });
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    if (!id) return;
    deleteEquipmentMutation.mutate({ id: equipmentId, companyId: id });
  };

  const calculateEquipmentTotals = () => {
    let totalDays = 0;
    let totalValue = 0;

    rentalEquipment.forEach((equipment) => {
      const days = calculateDaysRented(equipment.pickup_date, equipment.return_date);
      totalDays += days;
      
      // Aplicar regra de cobrança
      const diaria15 = equipment.daily_rate_15 || 0;
      const diaria30 = equipment.daily_rate_30 || 0;
      
      if (days <= 15) {
        totalValue += 15 * diaria15;
      } else {
        totalValue += days * diaria30;
      }
    });

    return {
      totalEquipment: rentalEquipment.length,
      totalDays,
      totalValue,
    };
  };

  const onSubmit = async (data: FormData) => {
    // Data final só é preenchida manualmente ou automaticamente quando último equipamento for devolvido
    // NUNCA calcular automaticamente baseado no tipo de contrato
    const contractEndDate = data.contract_end_date || null;

    const submissionData: any = {
      company_name: data.company_name,
      cnpj: data.cnpj,
      address: data.address || undefined,
      contact_phone: data.contact_phone || undefined,
      contact_email: data.contact_email || undefined,
      contract_number: data.contract_number,
      contract_type: data.contract_type,
      contract_start_date: data.contract_start_date,
      contract_end_date: contractEndDate,
      dia_corte: data.dia_corte || 1,
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

  const suggestedEndDate = form.watch("contract_start_date") && form.watch("contract_type") !== "indeterminado"
    ? format(
        addDays(parseISO(form.watch("contract_start_date")), parseInt(form.watch("contract_type"))),
        "yyyy-MM-dd"
      )
    : "";

  const equipmentTotals = calculateEquipmentTotals();
  
  // Verificar se todos equipamentos foram devolvidos
  const allEquipmentReturned = rentalEquipment.length > 0 && 
    rentalEquipment.every(eq => eq.return_date !== null);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={() => navigate("/rental-companies")}>
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
                        onValueChange={field.onChange}
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
                          <SelectItem value="indeterminado">Indeterminado</SelectItem>
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
                        <Input {...field} type="date" />
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
                      💡 Data final será definida automaticamente quando todos os equipamentos forem devolvidos
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("contract_end_date") && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Data de Término:</span>
                    <span>{format(parseISO(form.watch("contract_end_date")), "dd/MM/yyyy")}</span>
                  </div>
                  <ContractExpirationBadge 
                    contractEndDate={form.watch("contract_end_date")} 
                    allEquipmentReturned={allEquipmentReturned}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="dia_corte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia de Corte para Medição</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || "1"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Dia do mês" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      📅 Todo dia {field.value || 1} fecha a medição mensal
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <label className="text-sm font-medium">PAT (opcional)</label>
                        <Input
                          placeholder="000000"
                          value={equipmentPAT}
                          onChange={(e) => setEquipmentPAT(e.target.value)}
                          maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground">Se tiver PAT, preenche automático o nome</p>
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
                        <label className="text-sm font-medium">Período *</label>
                        <Select value={rentalPeriod} onValueChange={setRentalPeriod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 dias</SelectItem>
                            <SelectItem value="30">30 dias</SelectItem>
                            <SelectItem value="31">31 dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Obra</label>
                        <Input
                          placeholder="Nome da obra"
                          value={workSite}
                          onChange={(e) => setWorkSite(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Diária 15 dias (R$) *</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Valor maior (ex: 150.00)"
                          value={dailyRate15}
                          onChange={(e) => setDailyRate15(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Valor cobrado para locações até 15 dias</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Diária 30 dias (R$) *</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Valor menor (ex: 100.00)"
                          value={dailyRate30}
                          onChange={(e) => setDailyRate30(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">Valor cobrado para locações acima de 15 dias</p>
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
                              <TableHead>Obra</TableHead>
                              <TableHead>Retirada</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Dias</TableHead>
                              <TableHead className="text-right">Diária 15d</TableHead>
                              <TableHead className="text-right">Diária 30d</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rentalEquipment.map((equipment) => {
                              const days = calculateDaysRented(equipment.pickup_date, equipment.return_date);
                              const diaria15 = equipment.daily_rate_15 || 0;
                              const diaria30 = equipment.daily_rate_30 || 0;
                              
                              // Calcular valor com regra de cobrança
                              let total = 0;
                              let diasCobrados = days;
                              let valorDiaria = diaria30;
                              
                              if (days <= 15) {
                                diasCobrados = 15;
                                valorDiaria = diaria15;
                                total = 15 * diaria15;
                              } else {
                                total = days * diaria30;
                              }

                              return (
                                <TableRow key={equipment.id}>
                                  <TableCell className="font-mono">{equipment.asset_code || "-"}</TableCell>
                                  <TableCell>{equipment.equipment_name}</TableCell>
                                  <TableCell>{equipment.work_site || "-"}</TableCell>
                                  <TableCell>{format(parseISO(equipment.pickup_date), "dd/MM/yyyy")}</TableCell>
                                  <TableCell>
                                    {equipment.return_date ? (
                                      <Badge variant="outline" className="text-green-600 border-green-600">
                                        Devolvido {format(parseISO(equipment.return_date), "dd/MM")}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">Em Locação</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex flex-col items-end">
                                      <span className="font-semibold">{diasCobrados}</span>
                                      {days !== diasCobrados && (
                                        <span className="text-xs text-muted-foreground">({days} reais)</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {diaria15 > 0 ? `R$ ${diaria15.toFixed(2)}` : "-"}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {diaria30 > 0 ? `R$ ${diaria30.toFixed(2)}` : "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {total > 0 ? `R$ ${total.toFixed(2)}` : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditEquipment(equipment)}
                                        title="Editar equipamento"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      {!equipment.return_date && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setEquipmentToReturn(equipment);
                                            setReturnDialogOpen(true);
                                          }}
                                        >
                                          <Package className="h-4 w-4 mr-1" />
                                          Devolver
                                        </Button>
                                      )}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteEquipment(equipment.id)}
                                        disabled={deleteEquipmentMutation.isPending}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
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

      {equipmentToReturn && (
        <ReturnEquipmentDialog
          equipment={equipmentToReturn}
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
        />
      )}

      {/* Modal de Edição de Equipamento */}
      <Dialog open={!!editingEquipment} onOpenChange={(open) => !open && setEditingEquipment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
          </DialogHeader>
          {editingEquipment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">PAT (opcional)</label>
                <Input
                  placeholder="000000"
                  value={editingEquipment.asset_code || ""}
                  onChange={(e) => setEditingEquipment({...editingEquipment, asset_code: e.target.value})}
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Equipamento *</label>
                <Input
                  value={editingEquipment.equipment_name || ""}
                  onChange={(e) => setEditingEquipment({...editingEquipment, equipment_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Retirada</label>
                  <Input
                    type="date"
                    value={editingEquipment.pickup_date || ""}
                    onChange={(e) => setEditingEquipment({...editingEquipment, pickup_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Devolução</label>
                  <Input
                    type="date"
                    value={editingEquipment.return_date || ""}
                    onChange={(e) => setEditingEquipment({...editingEquipment, return_date: e.target.value || null})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Obra</label>
                  <Input
                    value={editingEquipment.work_site || ""}
                    onChange={(e) => setEditingEquipment({...editingEquipment, work_site: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Diário (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingEquipment.daily_rate || ""}
                    onChange={(e) => setEditingEquipment({...editingEquipment, daily_rate: e.target.value ? parseFloat(e.target.value) : null})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEquipment(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEquipmentEdit}
              disabled={updateEquipmentMutation.isPending}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
