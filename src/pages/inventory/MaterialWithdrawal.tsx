import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { ProductSelector } from "@/components/ProductSelector";
import { useConfirm } from "@/hooks/useConfirm";
import { useProducts } from "@/hooks/useProducts";
import { withdrawalSchema } from "@/lib/schemas";
import { useEquipmentByPAT } from "@/hooks/useEquipmentByPAT";
import { useEquipmentFormAutofill } from "@/hooks/useEquipmentFormAutofill";
import { formatPAT } from "@/lib/patUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WithdrawalCollaboratorsManager } from "@/components/WithdrawalCollaboratorsManager";
import { BackButton } from "@/components/BackButton";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { getTodayLocalDate } from "@/lib/dateUtils";
import { useWithdrawalsByPAT } from "@/hooks/useWithdrawalsByPAT";
import { PendingWithdrawalsAlert } from "@/components/PendingWithdrawalsAlert";
import { RetroactiveDateWarning } from "@/components/RetroactiveDateWarning";
import { NonCatalogedProductDialog } from "@/components/NonCatalogedProductDialog";

const NON_CATALOGED_PRODUCT_ID = "00000000-0000-0000-0000-000000000001";

interface WithdrawalItem {
  product_id: string;
  quantity: number;
  productName: string;
  productCode: string;
  availableQuantity: number;
  isNonCataloged?: boolean;
  customDescription?: string;
}

const MaterialWithdrawal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products } = useProducts();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [isSaleWithdrawal, setIsSaleWithdrawal] = useState(false);
  const [withdrawalDate, setWithdrawalDate] = useState(getTodayLocalDate());
  const [withdrawalReason, setWithdrawalReason] = useState("");
  
  // Capturar PAT da URL (query parameter)
  const searchParams = new URLSearchParams(window.location.search);
  const patFromUrl = searchParams.get("pat");
  
  const [equipmentCode, setEquipmentCode] = useState(patFromUrl || "");
  const [workSite, setWorkSite] = useState("");
  const [company, setCompany] = useState("");
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [equipmentName, setEquipmentName] = useState("");
  const [principalCollaborator, setPrincipalCollaborator] = useState("");
  const [additionalCollaborators, setAdditionalCollaborators] = useState<string[]>([]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showNonCatalogedDialog, setShowNonCatalogedDialog] = useState(false);

  // Estados para controle de ciclo de vida
  const [lifecycleDecision, setLifecycleDecision] = useState<"pending" | "keep" | "new">("keep");
  const [currentCycle, setCurrentCycle] = useState(1);

  // Buscar informações do equipamento pelo PAT
  const { data: equipment, isLoading: loadingEquipment } = useEquipmentByPAT(equipmentCode);

  // Buscar peças pendentes para este PAT
  const { data: pendingWithdrawals = [], isLoading: loadingPendingWithdrawals } = useWithdrawalsByPAT(
    formatPAT(equipmentCode) || ""
  );

  // Buscar produtos compatíveis com o equipamento
  const { data: compatibleProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ["compatible-products", equipment?.manufacturer, equipment?.equipment_name, equipment?.model],
    queryFn: async () => {
      if (!equipment) return [];
      
      const { data, error } = await supabase.rpc("get_compatible_products", {
        p_equipment_brand: equipment.manufacturer,
        p_equipment_type: equipment.equipment_name,
        p_equipment_model: equipment.model || "",
      });
      
      if (error) {
        console.error("Erro ao buscar produtos compatíveis:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!equipment && !isSaleWithdrawal,
  });

  // Selecionar lista de produtos: compatíveis se houver equipamento, todos se for venda
  const availableProducts = isSaleWithdrawal ? products : (compatibleProducts || products);

  // Controlar decisão de ciclo de vida quando detectar peças pendentes
  useEffect(() => {
    if (!isSaleWithdrawal && pendingWithdrawals && pendingWithdrawals.length > 0) {
      setLifecycleDecision("pending");
    } else {
      setLifecycleDecision("keep");
    }
  }, [pendingWithdrawals, isSaleWithdrawal]);

  // Usar hook de autofill - lógica específica para Depósito Malta
  useEffect(() => {
    console.log("🔍 Equipment data:", equipment);
    
    if (equipment) {
      setEquipmentName(equipment.equipment_name);
      
      // Se o equipamento está em Depósito Malta, sugerir Manutenção Interna
      if (equipment.location_type === "deposito_malta") {
        console.log("🔧 Equipamento em Depósito Malta - Sugerindo Manutenção Interna");
        setCompany("Manutenção Interna");
        setWorkSite("Depósito Malta");
        setShowCollaborators(true);
      } else {
        setShowCollaborators(false);
        setPrincipalCollaborator("");
        setAdditionalCollaborators([]);
        
        // Priorizar dados de LOCAÇÃO primeiro para outros casos
        if (equipment.rental_company) {
          console.log("✅ Preenchendo empresa de locação:", equipment.rental_company);
          setCompany(equipment.rental_company);
        } else if (equipment.maintenance_company) {
          console.log("✅ Preenchendo empresa de manutenção:", equipment.maintenance_company);
          setCompany(equipment.maintenance_company);
        }
        
        if (equipment.rental_work_site) {
          console.log("✅ Preenchendo obra de locação:", equipment.rental_work_site);
          setWorkSite(equipment.rental_work_site);
        } else if (equipment.maintenance_work_site) {
          console.log("✅ Preenchendo obra de manutenção:", equipment.maintenance_work_site);
          setWorkSite(equipment.maintenance_work_site);
        }
      }
    } else if (!equipmentCode) {
      // Limpa os campos se o PAT for apagado
      console.log("🧹 Limpando campos");
      setEquipmentName("");
      setWorkSite("");
      setCompany("");
      setShowCollaborators(false);
      setPrincipalCollaborator("");
      setAdditionalCollaborators([]);
    }
  }, [equipment, equipmentCode]);

  const addItem = () => {
    setItems([...items, {
      product_id: "",
      quantity: 1,
      productName: "",
      productCode: "",
      availableQuantity: 0
    }]);
  };

  const addNonCatalogedItem = (description: string, quantity: number) => {
    setItems([...items, {
      product_id: NON_CATALOGED_PRODUCT_ID,
      quantity,
      productName: "Produto Não Catalogado",
      productCode: "NAO-CATALOGADO",
      availableQuantity: 9999, // Sem limite de estoque
      isNonCataloged: true,
      customDescription: description,
    }]);
    toast.success("Produto não catalogado adicionado!");
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof WithdrawalItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "product_id") {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].productCode = product.code;
        newItems[index].availableQuantity = product.quantity;
      }
    }
    
    setItems(newItems);
  };

  const handleKeepHistory = () => {
    setLifecycleDecision("keep");
    toast.success("As peças anteriores serão mantidas. Você pode adicionar novas peças agora.");
  };

  const handleNewCycle = async () => {
    const confirmed = await confirm({
      title: "Iniciar Novo Ciclo de Vida?",
      description: `Isso irá arquivar ${pendingWithdrawals.length} peça(s) anterior(es). Elas não poderão mais ser usadas em relatórios. Deseja continuar?`,
    });

    if (!confirmed) return;

    try {
      // Arquivar retiradas antigas
      const { error } = await supabase
        .from("material_withdrawals")
        .update({ is_archived: true })
        .in("id", pendingWithdrawals.map(w => w.id));

      if (error) throw error;

      // Registrar fechamento do ciclo
      const formattedPAT = formatPAT(equipmentCode);
      const { data: assetData } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_code", formattedPAT)
        .maybeSingle();

      if (assetData) {
        await supabase.from("asset_lifecycle_history").insert({
          asset_id: assetData.id,
          asset_code: formattedPAT,
          cycle_number: currentCycle,
          cycle_closed_at: new Date().toISOString(),
          closed_by: user?.id,
          reason: "Novo ciclo de manutenção iniciado",
          archived_withdrawals_count: pendingWithdrawals.length,
        });
      }

      setLifecycleDecision("new");
      setCurrentCycle(currentCycle + 1);
      toast.success("Novo ciclo iniciado! As peças antigas foram arquivadas.");
    } catch (error: any) {
      toast.error("Erro ao arquivar peças antigas: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let formattedPAT = "";
    
    // Validar PAT apenas se NÃO for saída para venda
    if (!isSaleWithdrawal) {
      formattedPAT = formatPAT(equipmentCode);
      if (!formattedPAT) {
        toast.error("PAT inválido! O PAT deve conter apenas números (máximo 6 dígitos).");
        return;
      }

      // Validar se o equipamento existe
      if (!equipment) {
        toast.error("Equipamento não encontrado! Verifique o PAT digitado.");
        return;
      }
    }

    if (!workSite || !company) {
      toast.error("Preencha todos os campos obrigatórios: Obra e Empresa!");
      return;
    }

    // Validar colaborador principal se for Manutenção Interna
    if (showCollaborators && !principalCollaborator.trim()) {
      toast.error("Responsável Malta (Principal) é obrigatório para Manutenção Interna!");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item!");
      return;
    }

    // Validate each item (skip stock validation for non-cataloged products)
    const invalidItems = items.filter(
      item => !item.product_id || item.quantity <= 0 || 
      (!item.isNonCataloged && item.quantity > item.availableQuantity)
    );

    if (invalidItems.length > 0) {
      toast.error("Verifique os itens: quantidades inválidas ou superiores ao estoque disponível!");
      return;
    }

    // Validate with Zod
    const validationErrors: string[] = [];
    items.forEach((item, index) => {
      const validation = withdrawalSchema.safeParse({
        product_id: item.product_id,
        quantity: item.quantity,
        withdrawal_date: withdrawalDate,
        withdrawal_reason: withdrawalReason,
      });
      
      if (!validation.success) {
        validationErrors.push(`Item ${index + 1}: ${validation.error.errors[0].message}`);
      }
    });

    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    const confirmed = await confirm({
      title: "Confirmar Retirada",
      description: `Confirma a retirada de ${items.length} ${items.length === 1 ? 'produto' : 'produtos'}? O estoque será atualizado automaticamente.`,
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const withdrawals = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        withdrawn_by: user?.id,
        // For non-cataloged products, store custom description in withdrawal_reason
        withdrawal_reason: item.isNonCataloged 
          ? `[PRODUTO NÃO CATALOGADO] ${item.customDescription}` 
          : (withdrawalReason || (isSaleWithdrawal ? "VENDA" : null)),
        withdrawal_date: withdrawalDate,
        equipment_code: isSaleWithdrawal ? "VENDA" : formattedPAT,
        work_site: workSite,
        company: company,
        lifecycle_cycle: currentCycle,
        is_archived: false
      }));

      const { data: insertedWithdrawals, error } = await supabase
        .from("material_withdrawals")
        .insert(withdrawals)
        .select("id");

      if (error) throw error;

      // Se for Manutenção Interna, salvar colaboradores
      if (showCollaborators && principalCollaborator && insertedWithdrawals) {
        const collaboratorsToInsert = [];
        
        for (const withdrawal of insertedWithdrawals) {
          // Colaborador principal
          collaboratorsToInsert.push({
            withdrawal_id: withdrawal.id,
            collaborator_name: principalCollaborator.trim(),
            is_principal: true
          });
          
          // Colaboradores adicionais
          additionalCollaborators.forEach(name => {
            collaboratorsToInsert.push({
              withdrawal_id: withdrawal.id,
              collaborator_name: name.trim(),
              is_principal: false
            });
          });
        }
        
        const { error: collabError } = await supabase
          .from("material_withdrawal_collaborators")
          .insert(collaboratorsToInsert);

        if (collabError) {
          console.error("Erro ao salvar colaboradores:", collabError);
          toast.error("Retirada registrada, mas houve erro ao salvar colaboradores.");
        }
      }

      // Registrar evento no histórico do equipamento APENAS se não for venda
      if (!isSaleWithdrawal) {
        // Buscar o equipamento novamente para garantir que temos o ID correto
        const { data: assetData, error: assetError } = await supabase
          .from("assets")
          .select("id, equipment_name")
          .eq("asset_code", formattedPAT)
          .maybeSingle();

        if (assetData && !assetError) {
        try {
          const productNames = items.map(item => `${item.productName} (${item.quantity}x)`).join(", ");
          const detalhesEvento = `Retirada de material: ${productNames}. Empresa: ${company}. Obra: ${workSite}.${withdrawalReason ? ` Motivo: ${withdrawalReason}` : ""}`;
          
          const { error: historyError } = await supabase.rpc("registrar_evento_patrimonio", {
            p_pat_id: assetData.id,
            p_codigo_pat: formattedPAT,
            p_tipo_evento: "RETIRADA DE MATERIAL",
            p_detalhes_evento: detalhesEvento,
            p_campo_alterado: null,
            p_valor_antigo: null,
            p_valor_novo: null,
          });

          if (historyError) {
            console.error("❌ Erro ao registrar no histórico:", historyError);
            toast.warning("Retirada registrada, mas não foi possível adicionar ao histórico do equipamento.");
          } else {
            console.log("✅ Evento registrado no histórico do PAT:", formattedPAT);
          }
        } catch (historyError) {
          console.error("❌ Exceção ao registrar no histórico:", historyError);
          toast.warning("Retirada registrada, mas não foi possível adicionar ao histórico do equipamento.");
        }
        } else if (!assetData) {
          console.warn("⚠️ Equipamento não encontrado no sistema:", formattedPAT);
          toast.warning(`Retirada registrada, mas o PAT ${formattedPAT} não está cadastrado no sistema.`);
        }
      }

      toast.success("Retirada de material registrada com sucesso!");
      navigate("/inventory/history");
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar retirada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div className="space-y-2">
        <BackButton />
        <h1 className="text-2xl sm:text-3xl font-bold">Retirada de Material</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Registre a saída de produtos do estoque</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Informações da Retirada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox 
                  id="saleWithdrawal"
                  checked={isSaleWithdrawal}
                  onCheckedChange={(checked) => {
                    setIsSaleWithdrawal(checked as boolean);
                    if (checked) {
                      setEquipmentCode("");
                      setEquipmentName("");
                      setShowCollaborators(false);
                      setPrincipalCollaborator("");
                      setAdditionalCollaborators([]);
                    }
                  }}
                />
                <Label htmlFor="saleWithdrawal" className="text-sm font-medium cursor-pointer">
                  Saída para Venda (não vinculada a equipamento)
                </Label>
              </div>
              {isSaleWithdrawal && (
                <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs">
                    Esta retirada será registrada como venda e não será associada a nenhum equipamento.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isSaleWithdrawal && (
                <div className="space-y-2">
                  <Label htmlFor="equipment" className="text-xs sm:text-sm">PAT do Equipamento * (6 dígitos)</Label>
                <div className="relative">
                  <Input
                    id="equipment"
                    type="text"
                    value={equipmentCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove não-números
                      if (value.length <= 6) {
                        setEquipmentCode(value);
                      }
                      if (!value) {
                        setEquipmentName("");
                        setWorkSite("");
                        setCompany("");
                      }
                    }}
                    onBlur={(e) => {
                      const formatted = formatPAT(e.target.value);
                      if (formatted) {
                        setEquipmentCode(formatted);
                      }
                    }}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="text-sm font-mono"
                  />
                  {loadingEquipment && equipmentCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
                {equipmentCode && !loadingEquipment && (
                  equipment ? (
                    <>
                      <Alert className="mt-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                          Equipamento encontrado: {equipment.equipment_name}
                        </AlertDescription>
                      </Alert>
                      {equipment.location_type === "deposito_malta" && (
                        <Alert className="mt-2 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Manutenção Interna:</strong> Este equipamento está no Depósito Malta. Os custos serão registrados como manutenção interna.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert className="mt-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                        Equipamento não encontrado. Verifique o PAT.
                      </AlertDescription>
                    </Alert>
                  )
                )}
                </div>
              )}
            </div>

            {/* Alerta de Peças Pendentes */}
            {!isSaleWithdrawal && equipmentCode && !loadingEquipment && equipment && !loadingPendingWithdrawals && 
              lifecycleDecision === "pending" && pendingWithdrawals.length > 0 && (
              <PendingWithdrawalsAlert
                withdrawals={pendingWithdrawals}
                equipmentCode={formatPAT(equipmentCode) || ""}
                onKeepHistory={handleKeepHistory}
                onNewCycle={handleNewCycle}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workSite" className="text-xs sm:text-sm">Obra *</Label>
                <Input
                  id="workSite"
                  type="text"
                  value={workSite}
                  onChange={(e) => setWorkSite(e.target.value)}
                  placeholder="Digite a obra"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs sm:text-sm">Empresa *</Label>
                <Input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Digite a empresa"
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs sm:text-sm">Data da Retirada *</Label>
                <Input
                  id="date"
                  type="date"
                  value={withdrawalDate}
                  onChange={(e) => setWithdrawalDate(e.target.value)}
                  required
                  className="text-sm"
                />
                <RetroactiveDateWarning selectedDate={withdrawalDate} />
              </div>

              {showCollaborators && (
                <>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="principal" className="text-xs sm:text-sm">
                      Responsável Malta (Principal) *
                    </Label>
                    <Input
                      id="principal"
                      type="text"
                      value={principalCollaborator}
                      onChange={(e) => setPrincipalCollaborator(e.target.value)}
                      placeholder="Nome do responsável principal"
                      required
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs sm:text-sm">
                      Colaboradores Adicionais Malta (Opcional)
                    </Label>
                    <WithdrawalCollaboratorsManager
                      collaborators={additionalCollaborators}
                      onCollaboratorsChange={setAdditionalCollaborators}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs sm:text-sm">Motivo da Retirada</Label>
              <Textarea
                id="reason"
                rows={3}
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                placeholder="Descreva o motivo da retirada..."
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Produtos</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                type="button" 
                onClick={addItem} 
                size="sm" 
                className="w-full sm:w-auto text-xs sm:text-sm"
                disabled={lifecycleDecision === "pending"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowNonCatalogedDialog(true)}
                size="sm" 
                variant="outline"
                className="w-full sm:w-auto text-xs sm:text-sm"
                disabled={lifecycleDecision === "pending"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Produto Não Catalogado
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lifecycleDecision === "pending" && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-900">
                  Por favor, decida o que fazer com as peças pendentes antes de adicionar novos produtos.
                </AlertDescription>
              </Alert>
            )}
            {!isSaleWithdrawal && equipment && compatibleProducts && (
              <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs flex items-center gap-2 flex-wrap">
                  <span>Mostrando apenas peças compatíveis com:</span>
                  <Badge variant="outline" className="font-mono">
                    {equipment.manufacturer} {equipment.equipment_name} {equipment.model}
                  </Badge>
                  <span className="text-muted-foreground">
                    ({compatibleProducts.length} peças encontradas)
                  </span>
                </AlertDescription>
              </Alert>
            )}
            {items.length === 0 ? (
              <p className="text-center text-sm sm:text-base text-muted-foreground py-8">
                Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
              </p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm sm:text-base">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Produto *</Label>
                      {item.isNonCataloged ? (
                        <div className="border rounded-md p-3 bg-muted">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">Não Catalogado</Badge>
                          </div>
                          <p className="text-sm font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.customDescription}</p>
                        </div>
                      ) : (
                        <ProductSelector
                          products={availableProducts}
                          value={item.product_id}
                          onValueChange={(value) => updateItem(index, "product_id", value)}
                          showStock={true}
                          required={true}
                          showCompatibility={!isSaleWithdrawal && !!equipment}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm">Quantidade *</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(index, "quantity", Math.max(1, item.quantity - 1))}
                          className="flex-shrink-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.availableQuantity}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                          className="text-center text-sm"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => updateItem(index, "quantity", Math.min(item.availableQuantity, item.quantity + 1))}
                          className="flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.product_id && !item.isNonCataloged && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Estoque atual: {item.availableQuantity}
                          </p>
                          <p className="text-xs font-medium text-warning">
                            Após retirada: {item.availableQuantity - item.quantity}
                          </p>
                        </div>
                      )}
                      {item.isNonCataloged && (
                        <p className="text-xs text-muted-foreground">
                          Sem controle de estoque
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="text-xs sm:text-sm"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || items.length === 0} className="text-xs sm:text-sm">
            {loading ? "Salvando..." : "Registrar Retirada"}
          </Button>
        </div>
      </form>

      <NonCatalogedProductDialog
        open={showNonCatalogedDialog}
        onOpenChange={setShowNonCatalogedDialog}
        onConfirm={addNonCatalogedItem}
      />

      <ConfirmDialog />
    </div>
  );
};

export default MaterialWithdrawal;
