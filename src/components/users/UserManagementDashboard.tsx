import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Crown, Shield, User } from "lucide-react";

interface UserManagementDashboardProps {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  adminCount: number;
  superuserCount: number;
  userCount: number;
}

export const UserManagementDashboard = ({
  totalUsers,
  activeUsers,
  pendingUsers,
  adminCount,
  superuserCount,
  userCount,
}: UserManagementDashboardProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {adminCount} admins, {superuserCount} super, {userCount} users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
          <p className="text-xs text-muted-foreground">Podem acessar o sistema</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usuários Pendentes</CardTitle>
          <UserX className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{pendingUsers}</div>
          <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Nível</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-amber-500" />
              <span className="font-semibold">{adminCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              <span className="font-semibold">{superuserCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold">{userCount}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Admin | Super | User</p>
        </CardContent>
      </Card>
    </div>
  );
};
