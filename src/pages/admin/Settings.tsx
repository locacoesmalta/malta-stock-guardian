import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Database, Shield, FileText } from "lucide-react";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema Malta Locações
          </p>
        </div>
        <ChangePasswordDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Status:</div>
              <div className="text-muted-foreground">Conectado</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Produtos cadastrados:</div>
              <div className="text-muted-foreground">Visualize no Dashboard</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Autenticação:</div>
              <div className="text-muted-foreground">Ativa</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Controle de Acesso:</div>
              <div className="text-muted-foreground">Por permissões de usuário</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Fotos obrigatórias:</div>
              <div className="text-muted-foreground">6 por relatório</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Formato de exportação:</div>
              <div className="text-muted-foreground">PDF para impressão</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <div className="font-medium">Versão:</div>
              <div className="text-muted-foreground">1.0.0</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">Empresa:</div>
              <div className="text-muted-foreground">Malta Locações</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
