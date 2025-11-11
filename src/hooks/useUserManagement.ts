import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserManagement = () => {
  const queryClient = useQueryClient();

  const updatePermission = useMutation({
    mutationFn: async ({
      userId,
      permission,
      value,
    }: {
      userId: string;
      permission: string;
      value: boolean;
    }) => {
      const { error } = await supabase
        .from("user_permissions")
        .update({ [permission]: value })
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Permissão atualizada com sucesso");
    },
    onError: (error: any) => {
      console.error("Error updating permission:", error);
      toast.error("Erro ao atualizar permissão");
    },
  });

  const updateUserRole = useMutation({
    mutationFn: async ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: "user" | "superuser" | "admin";
    }) => {
      // Deletar role existente
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Inserir nova role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Nível do usuário alterado com sucesso");
    },
    onError: (error: any) => {
      console.error("Error updating role:", error);
      if (error.message?.includes("System owner cannot be demoted")) {
        toast.error("O proprietário do sistema não pode ter seu nível alterado");
      } else {
        toast.error("Erro ao alterar nível do usuário");
      }
    },
  });

  const toggleModulePermissions = useMutation({
    mutationFn: async ({
      userId,
      module,
      enable,
    }: {
      userId: string;
      module: "stock" | "assets" | "reports";
      enable: boolean;
    }) => {
      const permissionMap = {
        stock: {
          can_view_products: enable,
          can_edit_products: enable,
          can_delete_products: enable,
          can_create_withdrawals: enable,
          can_view_withdrawal_history: enable,
        },
        assets: {
          can_access_assets: enable,
          can_create_assets: enable,
          can_edit_assets: enable,
          can_delete_assets: enable,
          can_scan_assets: enable,
        },
        reports: {
          can_create_reports: enable,
          can_view_reports: enable,
          can_edit_reports: enable,
          can_delete_reports: enable,
        },
      };

      const { error } = await supabase
        .from("user_permissions")
        .update(permissionMap[module])
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Módulo atualizado com sucesso");
    },
    onError: (error: any) => {
      console.error("Error toggling module:", error);
      toast.error("Erro ao atualizar módulo");
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            user_id: userId,
            new_password: "Malta@2024",
            force_change_password: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao resetar senha");
      }
    },
    onSuccess: () => {
      toast.success("Senha resetada! Nova senha: Malta@2024 (usuário deverá alterá-la no próximo login)");
    },
    onError: (error: any) => {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erro ao resetar senha");
    },
  });

  return {
    updatePermission,
    updateUserRole,
    toggleModulePermissions,
    resetPassword,
  };
};
