import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, QrCode } from "lucide-react";
import { assetSchema, type AssetFormData } from "@/lib/validations";
import { useConfirm } from "@/hooks/useConfirm";

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const { ConfirmDialog, confirm } = useConfirm();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      location_type: "escritorio",
    },
  });

  const locationType = watch("location_type");

  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [id]);

  const fetchAsset = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setValue("asset_code", data.asset_code);
        setValue("equipment_name", data.equipment_name);
        setValue("location_type", data.location_type as "escritorio" | "locacao");
        setValue("rental_company", data.rental_company || "");
        setValue("rental_work_site", data.rental_work_site || "");
        setValue("rental_start_date", data.rental_start_date || "");
        setValue("rental_end_date", data.rental_end_date || "");
        setValue("qr_code_data", data.qr_code_data || "");
      }
    } catch (error) {
      console.error("Erro ao buscar patrimônio:", error);
      toast.error("Erro ao carregar patrimônio");
      navigate("/assets");
    }
  };

  const onSubmit = async (data: AssetFormData) => {
    setLoading(true);
    try {
      const payload = {
        asset_code: data.asset_code,
        equipment_name: data.equipment_name,
        location_type: data.location_type,
        rental_company: data.location_type === "locacao" ? data.rental_company : null,
        rental_work_site: data.location_type === "locacao" ? data.rental_work_site : null,
        rental_start_date: data.location_type === "locacao" ? data.rental_start_date : null,
        rental_end_date: data.location_type === "locacao" ? data.rental_end_date : null,
        qr_code_data: data.qr_code_data || null,
      };

      if (id) {
        const { error } = await supabase
          .from("assets")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
        toast.success("Patrimônio atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("assets")
          .insert([payload]);

        if (error) throw error;
        toast.success("Patrimônio cadastrado com sucesso!");
      }

      navigate("/assets");
    } catch (error: any) {
      console.error("Erro ao salvar patrimônio:", error);
      toast.error(error.message || "Erro ao salvar patrimônio");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Excluir Patrimônio",
      description: "Tem certeza que deseja excluir este patrimônio? Esta ação não pode ser desfeita.",
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Patrimônio excluído com sucesso!");
      navigate("/assets");
    } catch (error) {
      console.error("Erro ao excluir patrimônio:", error);
      toast.error("Erro ao excluir patrimônio");
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <ConfirmDialog />
      
      <Button
        variant="ghost"
        onClick={() => navigate("/assets")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">
          {id ? "Editar Patrimônio" : "Cadastrar Patrimônio"}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="asset_code">Código do Patrimônio (PAT)*</Label>
            <div className="flex gap-2">
              <Input
                id="asset_code"
                {...register("asset_code")}
                placeholder="Ex: PAT001"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/assets/scanner")}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
            {errors.asset_code && (
              <p className="text-sm text-destructive">{errors.asset_code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_name">Nome do Equipamento*</Label>
            <Input
              id="equipment_name"
              {...register("equipment_name")}
              placeholder="Ex: Notebook Dell Latitude"
            />
            {errors.equipment_name && (
              <p className="text-sm text-destructive">{errors.equipment_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Localização*</Label>
            <RadioGroup
              value={locationType}
              onValueChange={(value) => setValue("location_type", value as "escritorio" | "locacao")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="escritorio" id="escritorio" />
                <Label htmlFor="escritorio" className="font-normal cursor-pointer">
                  Escritório
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="locacao" id="locacao" />
                <Label htmlFor="locacao" className="font-normal cursor-pointer">
                  Locação
                </Label>
              </div>
            </RadioGroup>
          </div>

          {locationType === "locacao" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rental_company">Empresa*</Label>
                <Input
                  id="rental_company"
                  {...register("rental_company")}
                  placeholder="Ex: Construtora ABC"
                />
                {errors.rental_company && (
                  <p className="text-sm text-destructive">{errors.rental_company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rental_work_site">Obra*</Label>
                <Input
                  id="rental_work_site"
                  {...register("rental_work_site")}
                  placeholder="Ex: Obra Centro"
                />
                {errors.rental_work_site && (
                  <p className="text-sm text-destructive">{errors.rental_work_site.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rental_start_date">Data Inicial*</Label>
                  <Input
                    id="rental_start_date"
                    type="date"
                    {...register("rental_start_date")}
                  />
                  {errors.rental_start_date && (
                    <p className="text-sm text-destructive">{errors.rental_start_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rental_end_date">Data Final</Label>
                  <Input
                    id="rental_end_date"
                    type="date"
                    {...register("rental_end_date")}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : id ? "Atualizar" : "Cadastrar"}
            </Button>
            {id && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
