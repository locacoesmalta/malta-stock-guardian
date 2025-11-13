import { Package, Eye, Edit, Trash, FilePlus, History, Building2, Plus, QrCode } from "lucide-react";
import { ModulePermissionCard } from "./ModulePermissionCard";
import { FinancialPermissionToggle } from "./FinancialPermissionToggle";
import { useUserManagement } from "@/hooks/useUserManagement";

interface UserPermissionsManagerProps {
  userId: string;
  permissions: any;
  isAdmin: boolean;
}

export const UserPermissionsManager = ({
  userId,
  permissions,
  isAdmin,
}: UserPermissionsManagerProps) => {
  const { updatePermission, toggleModulePermissions } = useUserManagement();

  const stockPermissions = [
    { key: "can_view_products", label: "Visualizar Produtos", icon: Eye },
    { key: "can_edit_products", label: "Editar Produtos", icon: Edit },
    { key: "can_delete_products", label: "Deletar Produtos", icon: Trash },
    { key: "can_create_withdrawals", label: "Criar Retiradas", icon: FilePlus },
    { key: "can_view_withdrawal_history", label: "Ver Histórico de Retiradas", icon: History },
  ];

  const assetsPermissions = [
    { key: "can_access_assets", label: "Acessar Ativos", icon: Eye },
    { key: "can_create_assets", label: "Criar Ativos", icon: Plus },
    { key: "can_edit_assets", label: "Editar Ativos", icon: Edit },
    { key: "can_delete_assets", label: "Deletar Ativos", icon: Trash },
    { key: "can_scan_assets", label: "Escanear QR Codes", icon: QrCode },
  ];

  const reportsPermissions = [
    { key: "can_create_reports", label: "Criar Relatórios", icon: FilePlus },
    { key: "can_view_reports", label: "Visualizar Relatórios", icon: Eye },
    { key: "can_edit_reports", label: "Editar Relatórios", icon: Edit },
    { key: "can_delete_reports", label: "Deletar Relatórios", icon: Trash },
  ];

  const hasAllStockPermissions = stockPermissions.every((p) => permissions[p.key]);
  const hasAllAssetsPermissions = assetsPermissions.every((p) => permissions[p.key]);
  const hasAllReportsPermissions = reportsPermissions.every((p) => permissions[p.key]);

  return (
    <div className="space-y-6">
      {/* Permissão Financeira (Destaque) */}
      <FinancialPermissionToggle
        hasPermission={permissions.can_view_financial_data || false}
        onToggle={(value) =>
          updatePermission.mutate({ userId, permission: "can_view_financial_data", value })
        }
        disabled={isAdmin}
      />

      {/* Módulos de Permissões */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ModulePermissionCard
        title="Controle de Estoque"
        icon={Package}
        permissions={stockPermissions}
        values={permissions}
        allEnabled={hasAllStockPermissions}
        onToggleAll={() =>
          toggleModulePermissions.mutate({
            userId,
            module: "stock",
            enable: !hasAllStockPermissions,
          })
        }
        onTogglePermission={(key, value) =>
          updatePermission.mutate({ userId, permission: key, value })
        }
        disabled={isAdmin}
      />

      <ModulePermissionCard
        title="Gestão de Patrimônio"
        icon={Building2}
        permissions={assetsPermissions}
        values={permissions}
        allEnabled={hasAllAssetsPermissions}
        onToggleAll={() =>
          toggleModulePermissions.mutate({
            userId,
            module: "assets",
            enable: !hasAllAssetsPermissions,
          })
        }
        onTogglePermission={(key, value) =>
          updatePermission.mutate({ userId, permission: key, value })
        }
        disabled={isAdmin}
      />

      <ModulePermissionCard
        title="Relatórios de Avarias"
        icon={FilePlus}
        permissions={reportsPermissions}
        values={permissions}
        allEnabled={hasAllReportsPermissions}
        onToggleAll={() =>
          toggleModulePermissions.mutate({
            userId,
            module: "reports",
            enable: !hasAllReportsPermissions,
          })
        }
        onTogglePermission={(key, value) =>
          updatePermission.mutate({ userId, permission: key, value })
        }
        disabled={isAdmin}
      />
      </div>
    </div>
  );
};
