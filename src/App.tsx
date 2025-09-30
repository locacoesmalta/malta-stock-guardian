import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Products from "./pages/admin/Products";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";
import NewReport from "./pages/reports/NewReport";
import ReportsList from "./pages/reports/ReportsList";
import MaterialWithdrawal from "./pages/inventory/MaterialWithdrawal";
import WithdrawalHistory from "./pages/inventory/WithdrawalHistory";
import AssetsList from "./pages/assets/AssetsList";
import AssetForm from "./pages/assets/AssetForm";
import AssetScanner from "./pages/assets/AssetScanner";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/welcome" element={<ProtectedLayout><Welcome /></ProtectedLayout>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/reports/new" element={<ProtectedLayout><NewReport /></ProtectedLayout>} />
            <Route path="/reports" element={<ProtectedLayout><ReportsList /></ProtectedLayout>} />
            <Route path="/inventory/withdrawal" element={<ProtectedLayout><MaterialWithdrawal /></ProtectedLayout>} />
            <Route path="/inventory/history" element={<ProtectedLayout><WithdrawalHistory /></ProtectedLayout>} />
            <Route path="/assets" element={<ProtectedLayout><AssetsList /></ProtectedLayout>} />
            <Route path="/assets/scanner" element={<ProtectedLayout><AssetScanner /></ProtectedLayout>} />
            <Route path="/assets/new" element={<ProtectedLayout><AdminRoute><AssetForm /></AdminRoute></ProtectedLayout>} />
            <Route path="/assets/edit/:id" element={<ProtectedLayout><AdminRoute><AssetForm /></AdminRoute></ProtectedLayout>} />
            <Route path="/admin/products" element={<ProtectedLayout><AdminRoute><Products /></AdminRoute></ProtectedLayout>} />
            <Route path="/admin/users" element={<ProtectedLayout><AdminRoute><Users /></AdminRoute></ProtectedLayout>} />
            <Route path="/admin/settings" element={<ProtectedLayout><AdminRoute><Settings /></AdminRoute></ProtectedLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
