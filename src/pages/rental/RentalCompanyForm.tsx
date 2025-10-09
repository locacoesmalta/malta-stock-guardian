import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDays, differenceInDays, format } from "date-fns";
import { ArrowLeft, Upload, X, FileText, Printer } from "lucide-react";
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
  rental_start_date: z.string().optional(),
  rental_end_date: z.string().optional(),
  daily_rental_price: z.string().optional(),
  equipment_description: z.string().optional(),
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
  const [rentalDays, setRentalDays] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

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
      rental_start_date: "",
      rental_end_date: "",
      daily_rental_price: "",
      equipment_description: "",
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
        rental_start_date: company.rental_start_date || "",
        rental_end_date: company.rental_end_date || "",
        daily_rental_price: company.daily_rental_price?.toString() || "",
        equipment_description: company.equipment_description || "",
        notes: company.notes || "",
      });
      setUploadedFiles(company.documents || []);
    }
  }, [company, form]);

  // Calculate rental days and total price
  useEffect(() => {
    const rentalStart = form.watch("rental_start_date");
    const rentalEnd = form.watch("rental_end_date");
    const dailyPrice = form.watch("daily_rental_price");

    if (rentalStart && rentalEnd) {
      const days = differenceInDays(new Date(rentalEnd), new Date(rentalStart)) + 1;
      setRentalDays(days > 0 ? days : 0);
      
      if (dailyPrice && days > 0) {
        setTotalPrice(days * parseFloat(dailyPrice));
      } else {
        setTotalPrice(0);
      }
    } else {
      setRentalDays(0);
      setTotalPrice(0);
    }
  }, [form.watch("rental_start_date"), form.watch("rental_end_date"), form.watch("daily_rental_price")]);

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

  const onSubmit = async (data: FormData) => {
    const contractStartDate = new Date(data.contract_start_date);
    const contractDays = parseInt(data.contract_type);
    const contractEndDate = addDays(contractStartDate, contractDays);

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
      rental_start_date: data.rental_start_date || undefined,
      rental_end_date: data.rental_end_date || undefined,
      daily_rental_price: data.daily_rental_price ? parseFloat(data.daily_rental_price) : undefined,
      equipment_description: data.equipment_description || undefined,
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

  const contractEndDate = form.watch("contract_start_date")
    ? format(
        addDays(new Date(form.watch("contract_start_date")), parseInt(form.watch("contract_type"))),
        "yyyy-MM-dd"
      )
    : "";

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
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00.000.000/0000-00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {contractEndDate && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Data de Término:</span>
                    <span>{format(new Date(contractEndDate), "dd/MM/yyyy")}</span>
                  </div>
                  <ContractExpirationBadge contractEndDate={contractEndDate} />
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
              <CardTitle>Detalhes da Locação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="equipment_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição dos Equipamentos</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descreva os equipamentos a serem locados" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rental_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Inicial da Locação</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rental_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Final da Locação</FormLabel>
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
                name="daily_rental_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço por Dia (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="0.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {rentalDays > 0 && (
                <div className="p-4 bg-primary/10 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Dias de locação:</span>
                    <span>{rentalDays} dias</span>
                  </div>
                  {totalPrice > 0 && (
                    <div className="flex justify-between text-lg font-bold">
                      <span>Valor Total:</span>
                      <span>R$ {totalPrice.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observações adicionais" />
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
