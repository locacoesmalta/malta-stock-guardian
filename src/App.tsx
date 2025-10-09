import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { PermissionRoute } from "@/components/PermissionRoute";

// Lazy load routes for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const Products = lazy(() => import("./pages/admin/Products"));
const Users = lazy(() => import("./pages/admin/Users"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const NewReport = lazy(() => import("./pages/reports/NewReport"));
const ReportsList = lazy(() => import("./pages/reports/ReportsList"));
const StatusReports = lazy(() => import("./pages/reports/StatusReports"));
const MaterialWithdrawal = lazy(() => import("./pages/inventory/MaterialWithdrawal"));
const WithdrawalHistory = lazy(() => import("./pages/inventory/WithdrawalHistory"));
const AssetsList = lazy(() => import("./pages/assets/AssetsList"));
const AssetView = lazy(() => import("./pages/assets/AssetView"));
const AssetEdit = lazy(() => import("./pages/assets/AssetEdit"));
const AssetMovement = lazy(() => import("./pages/assets/AssetMovement"));
const AssetRegister = lazy(() => import("./pages/assets/AssetRegister"));
const AssetScanner = lazy(() => import("./pages/assets/AssetScanner"));
const AssetTraceability = lazy(() => import("./pages/assets/AssetTraceability"));
const AssetsControlDashboard = lazy(() => import("./pages/assets/AssetsControlDashboard"));
const PostInspection = lazy(() => import("./pages/assets/PostInspection"));
const AssetReplacement = lazy(() => import("./pages/assets/AssetReplacement"));
const FinancialForecast = lazy(() => import("./pages/admin/FinancialForecast"));
const RentalCompaniesList = lazy(() => import("./pages/rental/RentalCompaniesList"));
const RentalCompanyForm = lazy(() => import("./pages/rental/RentalCompanyForm"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Welcome = lazy(() => import("./pages/Welcome"));

const queryClient = new QueryClient();

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppHeader />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 pt-14 md:pt-16 lg:pt-20 p-3 sm:p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, permissions, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin && (!permissions || !permissions.can_access_admin)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Acesso Negado</h2>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Entre em contato com o administrador para solicitar acesso.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-2 text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/welcome" element={<ProtectedLayout><Welcome /></ProtectedLayout>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_view_products">
                      <Dashboard />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/reports/new" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_create_reports">
                      <NewReport />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_view_reports">
                      <ReportsList />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/reports/status" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_access_assets">
                      <StatusReports />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/inventory/withdrawal" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_create_withdrawals">
                      <MaterialWithdrawal />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/inventory/history" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_view_withdrawal_history">
                      <WithdrawalHistory />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/control" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_access_assets">
                      <AssetsControlDashboard />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_access_assets">
                      <AssetsList />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/register" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_create_assets">
                      <AssetRegister />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/scanner" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_scan_assets">
                      <AssetScanner />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/traceability" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_access_assets">
                      <AssetTraceability />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/view/:id" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_access_assets">
                      <AssetView />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/edit/:id" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_edit_assets">
                      <AssetEdit />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/movement/:id" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_edit_assets">
                      <AssetMovement />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/post-inspection/:id" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_edit_assets">
                      <PostInspection />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/assets/replacement/:id" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_edit_assets">
                      <AssetReplacement />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/rental-companies" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_access_assets">
                      <RentalCompaniesList />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/rental-companies/new" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_create_assets">
                      <RentalCompanyForm />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route 
                path="/rental-companies/:id/edit" 
                element={
                  <ProtectedLayout>
                    <PermissionRoute permission="can_edit_assets">
                      <RentalCompanyForm />
                    </PermissionRoute>
                  </ProtectedLayout>
                } 
              />
              <Route path="/admin/financial-forecast" element={<ProtectedLayout><AdminRoute><FinancialForecast /></AdminRoute></ProtectedLayout>} />
              <Route path="/admin/products" element={<ProtectedLayout><AdminRoute><Products /></AdminRoute></ProtectedLayout>} />
              <Route path="/admin/users" element={<ProtectedLayout><AdminRoute><Users /></AdminRoute></ProtectedLayout>} />
              <Route path="/admin/logs" element={<ProtectedLayout><AdminRoute><AuditLogs /></AdminRoute></ProtectedLayout>} />
              <Route path="/admin/settings" element={<ProtectedLayout><AdminRoute><Settings /></AdminRoute></ProtectedLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
