import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

import { formatPAT, validatePAT, calculateEquipmentAge, formatCurrency } from "@/lib/patUtils";
import { useVerifyPAT, useEquipmentSuggestions, useUploadAttachment, useCreateAsset } from "@/hooks/useAssetRegistration";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema para a etapa 2 (formulário completo)
const equipmentSchema = z.object({
  asset_code: z.string().min(6, "PAT deve ter 6 dígitos"),
  equipment_name: z.string().min(1, "Nome do equipamento é obrigatório"),
  manufacturer: z.string().min(1, "Marca/Fabricante é obrigatório"),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  voltage_combustion: z.enum(["110V", "220V", "GASOLINA", "DIESEL", "GÁS"]).optional(),
  supplier: z.string().optional(),
  purchase_date: z.date().optional(),
  unit_value: z.number().nonnegative("Valor deve ser positivo").optional(),
  equipment_condition: z.enum(["NOVO", "USADO"]).optional(),
  comments: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export default function AssetRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [patInput, setPATInput] = useState("");
  const [verifiedPAT, setVerifiedPAT] = useState<string | null>(null);
  const [equipmentSearchOpen, setEquipmentSearchOpen] = useState(false);
  const [equipmentSearchValue, setEquipmentSearchValue] = useState("");
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [drawingFile, setDrawingFile] = useState<File | null>(null);

  const { data: patVerification, isLoading: isVerifying } = useVerifyPAT(verifiedPAT);
  const { data: suggestions = [] } = useEquipmentSuggestions(equipmentSearchValue);
  const uploadMutation = useUploadAttachment();
  const createAssetMutation = useCreateAsset();

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      asset_code: "",
      equipment_name: "",
      manufacturer: "",
      model: "",
      serial_number: "",
      supplier: "",
      unit_value: 0,
      comments: "",
    },
  });

  const handleVerifyPAT = () => {
    const isValid = validatePAT(patInput);
    
    if (!isValid) {
      toast({
        title: "PAT inválido",
        description: "PAT deve conter apenas números (máximo 6 dígitos)",
        variant: "destructive",
      });
      return;
    }

    const formatted = formatPAT(patInput);
    if (!formatted) {
      toast({
        title: "Erro ao formatar PAT",
        description: "Não foi possível formatar o número do PAT",
        variant: "destructive",
      });
      return;
    }

    setVerifiedPAT(formatted);
  };

  const handlePATExists = () => {
    if (patVerification?.asset) {
      navigate(`/assets/edit/${patVerification.asset.id}`);
    }
  };

  const handleSearchAnotherPAT = () => {
    setPATInput("");
    setVerifiedPAT(null);
    setStep(1);
  };

  const handleProceedToForm = () => {
    if (verifiedPAT) {
      form.setValue("asset_code", verifiedPAT);
      setStep(2);
    }
  };

  const handleEquipmentSelect = (equipmentName: string) => {
    const selected = suggestions.find((s) => s.equipment_name === equipmentName);
    if (selected) {
      form.setValue("equipment_name", selected.equipment_name);
      if (selected.manufacturer) {
        form.setValue("manufacturer", selected.manufacturer);
      }
      if (selected.model) {
        form.setValue("model", selected.model);
      }
    }
    setEquipmentSearchValue(equipmentName);
    setEquipmentSearchOpen(false);
  };

  const handleClearForm = () => {
    if (confirm("Tem certeza que deseja limpar todas as informações do formulário?")) {
      form.reset();
      setManualFile(null);
      setDrawingFile(null);
      if (verifiedPAT) {
        form.setValue("asset_code", verifiedPAT);
      }
    }
  };

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      let manualUrl = null;
      let drawingUrl = null;

      // Upload manual if exists
      if (manualFile) {
        const result = await uploadMutation.mutateAsync(manualFile);
        manualUrl = result.path;
      }

      // Upload drawing if exists
      if (drawingFile) {
        const result = await uploadMutation.mutateAsync(drawingFile);
        drawingUrl = result.path;
      }

      // Prepare asset data
      const assetData = {
        asset_code: data.asset_code,
        equipment_name: data.equipment_name,
        manufacturer: data.manufacturer,
        model: data.model || null,
        serial_number: data.serial_number || null,
        voltage_combustion: data.voltage_combustion || null,
        supplier: data.supplier || null,
        purchase_date: data.purchase_date ? format(data.purchase_date, "yyyy-MM-dd") : null,
        unit_value: data.unit_value || null,
        equipment_condition: data.equipment_condition || null,
        manual_attachment: manualUrl,
        exploded_drawing_attachment: drawingUrl,
        comments: data.comments || null,
        location_type: "deposito_malta", // Default para novo cadastro
        deposito_description: "Aguardando definição de localização",
      };

      await createAssetMutation.mutateAsync(assetData);
      navigate("/assets");
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // ETAPA 1: Verificação do PAT
  if (step === 1) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro de Equipamento</CardTitle>
            <CardDescription>
              Etapa 1: Verificação do PAT
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pat-input">Digite o número do PAT para consultar ou cadastrar</Label>
              <div className="flex gap-2">
                <Input
                  id="pat-input"
                  type="text"
                  placeholder="Ex: 1234"
                  value={patInput}
                  onChange={(e) => {
                    // Permitir apenas números
                    const value = e.target.value.replace(/\D/g, '');
                    setPATInput(value);
                  }}
                  onBlur={() => {
                    // Formatar ao perder o foco
                    if (patInput) {
                      const formatted = formatPAT(patInput);
                      if (formatted) {
                        setPATInput(formatted);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleVerifyPAT();
                    }
                  }}
                  maxLength={6}
                  className="font-mono"
                />
                <Button 
                  onClick={handleVerifyPAT}
                  disabled={isVerifying || !patInput}
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Verificar PAT</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                O PAT será automaticamente formatado com 6 dígitos (ex: 001234)
              </p>
            </div>

            {/* CASO 1: PAT já existe */}
            {verifiedPAT && patVerification?.exists && patVerification.asset && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>PAT já cadastrado</AlertTitle>
                <AlertDescription className="space-y-4">
                  <p>
                    O PAT <strong>{verifiedPAT}</strong> já está cadastrado para o equipamento:
                  </p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-semibold">{patVerification.asset.equipment_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patVerification.asset.manufacturer}
                      {patVerification.asset.model && ` - ${patVerification.asset.model}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePATExists}>
                      Ver/Editar Cadastro
                    </Button>
                    <Button variant="outline" onClick={handleSearchAnotherPAT}>
                      Pesquisar Outro PAT
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* CASO 2: PAT não existe - avançar para formulário */}
            {verifiedPAT && !patVerification?.exists && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">PAT disponível</AlertTitle>
                <AlertDescription className="space-y-4">
                  <p>
                    O PAT <strong>{verifiedPAT}</strong> está disponível para cadastro.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleProceedToForm}>
                      Prosseguir com Cadastro
                    </Button>
                    <Button variant="outline" onClick={handleSearchAnotherPAT}>
                      Pesquisar Outro PAT
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ETAPA 2: Formulário completo de cadastro
  const purchaseDate = form.watch("purchase_date");
  const equipmentAge = purchaseDate ? calculateEquipmentAge(format(purchaseDate, "yyyy-MM-dd")) : null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Equipamento</CardTitle>
          <CardDescription>
            Etapa 2: Preencha os dados do equipamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* PAT - Bloqueado */}
              <FormField
                control={form.control}
                name="asset_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAT *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="font-mono bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nome do Equipamento com Autocomplete */}
              <FormField
                control={form.control}
                name="equipment_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Nome do Equipamento *</FormLabel>
                    <Popover open={equipmentSearchOpen} onOpenChange={setEquipmentSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Selecione ou digite o nome do equipamento"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Digite para buscar..."
                            value={equipmentSearchValue}
                            onValueChange={(value) => {
                              setEquipmentSearchValue(value);
                              field.onChange(value);
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                            <CommandGroup>
                              {suggestions.map((suggestion) => (
                                <CommandItem
                                  key={suggestion.equipment_name}
                                  value={suggestion.equipment_name}
                                  onSelect={() => handleEquipmentSelect(suggestion.equipment_name)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === suggestion.equipment_name
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <div className="font-medium">{suggestion.equipment_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {suggestion.manufacturer}
                                      {suggestion.model && ` - ${suggestion.model}`}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Marca/Fabricante */}
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca / Fabricante *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Bosch, Makita, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modelo */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: GBH 2-28 DFV" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Série */}
              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Série do Equipamento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Número de série" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Voltagem/Combustão */}
              <FormField
                control={form.control}
                name="voltage_combustion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voltagem / Combustão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="110V">110V</SelectItem>
                        <SelectItem value="220V">220V</SelectItem>
                        <SelectItem value="GASOLINA">Gasolina</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                        <SelectItem value="GÁS">Gás</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fornecedor */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do fornecedor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data da Compra */}
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Compra</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tempo do Equipamento (Calculado) */}
              {equipmentAge !== null && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Tempo do Equipamento</p>
                  <p className="text-2xl font-bold">{equipmentAge} meses</p>
                </div>
              )}

              {/* Valor Unitário */}
              <FormField
                control={form.control}
                name="unit_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Unitário</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    {field.value && field.value > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(field.value ?? 0)}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado do Equipamento */}
              <FormField
                control={form.control}
                name="equipment_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado do Equipamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NOVO">Novo</SelectItem>
                        <SelectItem value="USADO">Usado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Anexos - Manual */}
              <div className="space-y-2">
                <Label htmlFor="manual">Manual (Anexo)</Label>
                <Input
                  id="manual"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                />
                {manualFile && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo selecionado: {manualFile.name}
                  </p>
                )}
              </div>

              {/* Anexos - Desenho Explodido */}
              <div className="space-y-2">
                <Label htmlFor="drawing">Desenho Explodido (Anexo)</Label>
                <Input
                  id="drawing"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDrawingFile(e.target.files?.[0] || null)}
                />
                {drawingFile && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo selecionado: {drawingFile.name}
                  </p>
                )}
              </div>

              {/* Comentários */}
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentários</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações adicionais sobre o equipamento"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createAssetMutation.isPending || uploadMutation.isPending}
                >
                  {createAssetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearForm}
                  disabled={createAssetMutation.isPending}
                >
                  Apagar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/assets")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
