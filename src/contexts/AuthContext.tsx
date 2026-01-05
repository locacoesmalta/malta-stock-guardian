import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useVersionCheck } from "@/hooks/useVersionCheck";
import { useRealtimePresence } from "@/hooks/useRealtimePresence";
import { useSessionHealth } from "@/hooks/useSessionHealth";
import { IdleWarningDialog } from "@/components/IdleWarningDialog";
import { UpdateAvailableDialog } from "@/components/UpdateAvailableDialog";
import { setStoredVersion, APP_VERSION } from "@/lib/appVersion";
import { toast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { getISOStringInBelem } from "@/lib/dateUtils";

/**
 * Registra evento de LOGIN no audit_logs para rastreamento de jornada
 */
const registerLoginEvent = async (userId: string, userEmail: string, userName: string | null) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action: 'LOGIN',
      table_name: 'auth_session',
      record_id: userId,
      new_data: { 
        login_at: getISOStringInBelem(),
        user_agent: navigator.userAgent 
      },
    });
    logger.auth('LOGIN event registered', { userId });
  } catch (error) {
    logger.error('Failed to register LOGIN event', error);
  }
};

/**
 * Registra evento de LOGOUT no audit_logs para rastreamento de jornada
 */
const registerLogoutEvent = async (userId: string, userEmail: string, userName: string | null, reason: string) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action: 'LOGOUT',
      table_name: 'auth_session',
      record_id: userId,
      new_data: { 
        logout_at: getISOStringInBelem(),
        reason 
      },
    });
    logger.auth('LOGOUT event registered', { userId, reason });
  } catch (error) {
    logger.error('Failed to register LOGOUT event', error);
  }
};

interface UserPermissions {
  is_active: boolean;
  can_access_main_menu: boolean;
  can_access_admin: boolean;
  can_view_products: boolean;
  can_create_reports: boolean;
  can_view_reports: boolean;
  can_create_withdrawals: boolean;
  can_view_withdrawal_history: boolean;
  can_edit_products: boolean;
  can_delete_products: boolean;
  can_edit_reports: boolean;
  can_delete_reports: boolean;
  can_access_assets: boolean;
  can_create_assets: boolean;
  can_edit_assets: boolean;
  can_delete_assets: boolean;
  can_scan_assets: boolean;
  can_view_financial_data: boolean;
  must_change_password?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperuser: boolean;
  isStaff: boolean; // admin || superuser - acesso operacional completo
  isActive: boolean;
  isSystemOwner: boolean;
  permissions: UserPermissions | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSystemOwner, setIsSystemOwner] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // FASE 1: Limpar sessões antigas deste usuário ao fazer login
        if (session?.user) {
          logger.auth('User logged in, cleaning old sessions', { userId: session.user.id });
          
          // Deletar sessões antigas (>24h) deste usuário
          await supabase
            .from('user_presence')
            .delete()
            .eq('user_id', session.user.id)
            .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      logger.auth('Auth state changed', { event, userId: session?.user?.id });
      
      // Apenas operações síncronas aqui
      setSession(session);
      setUser(session?.user ?? null);
      
      // Defer async calls para evitar deadlock
      if (session?.user) {
        setTimeout(async () => {
          checkAdminStatus(session.user.id);
          
          // Registrar evento de LOGIN quando usuário faz login
          if (event === 'SIGNED_IN') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();
            
            await registerLoginEvent(
              session.user.id, 
              session.user.email || 'unknown',
              profile?.full_name || null
            );
          }
        }, 0);
      } else {
        setIsAdmin(false);
        setIsSuperuser(false);
        setIsActive(false);
        setPermissions(null);
      }
    });

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // FASE 2: Keep-alive otimizado com lock e BroadcastChannel
  const refreshLockRef = useRef<boolean>(false);
  const authChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (!session) return;

    // Criar BroadcastChannel para sincronizar entre abas
    authChannelRef.current = new BroadcastChannel('malta_auth');
    
    // Escutar refreshes de outras abas
    authChannelRef.current.onmessage = (event) => {
      if (event.data.type === 'SESSION_REFRESHED') {
        logger.session('Session updated by another tab');
        setSession(event.data.session);
        setUser(event.data.session.user);
      }
    };

    const keepAlive = setInterval(async () => {
      // Evitar refreshes simultâneos
      if (refreshLockRef.current) {
        logger.session('Refresh already in progress, skipping...');
        return;
      }
      
      refreshLockRef.current = true;
      
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          logger.error('Error refreshing session', error);
          return;
        }
        if (data.session) {
          logger.session('Session refreshed successfully');
          setSession(data.session);
          setUser(data.session.user);
          
          // Notificar outras abas
          authChannelRef.current?.postMessage({
            type: 'SESSION_REFRESHED',
            session: data.session,
          });
        }
      } catch (error) {
        logger.error('Keep-alive error', error);
      } finally {
        refreshLockRef.current = false;
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      clearInterval(keepAlive);
      authChannelRef.current?.close();
    };
  }, [session]);

  const checkAdminStatus = async (userId: string) => {
    // Previne múltiplas chamadas simultâneas
    if (isCheckingAuth) {
      console.log('[AUTH] Already checking auth, skipping...');
      return;
    }
    
    setIsCheckingAuth(true);
    console.log('[AUTH] Starting checkAdminStatus for user:', userId);
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 10000)
    );
    
    try {
      await Promise.race([
        (async () => {
          const { data: roleData, error: roleError } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();

          if (roleError && import.meta.env.DEV) {
            console.error("Error fetching role:", roleError);
          }

          console.log('[AUTH] Role fetched:', roleData);
          const isUserAdmin = roleData?.role === "admin";
          const isUserSuperuser = roleData?.role === "superuser";
          setIsAdmin(isUserAdmin);
          setIsSuperuser(isUserSuperuser);
          
          // Verificar se é o system owner via função SQL
          const { data: ownerCheck } = await supabase.rpc('is_system_owner', {
            _user_id: userId
          });
          setIsSystemOwner(ownerCheck || false);

          // Fetch all permissions
          const { data: permData, error: permError } = await supabase
            .from("user_permissions")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (permError && import.meta.env.DEV) {
            console.error("Error fetching permissions:", permError);
          }

          console.log('[AUTH] Permissions fetched:', permData);

          if (permData) {
            setPermissions(permData as UserPermissions);
            setIsActive(permData.is_active === true);
            
            // Check if user must change password
            if (permData.must_change_password === true) {
              console.log('[AUTH] User must change password, redirecting...');
              navigate("/change-password-required");
            }
          } else {
            // Admins e Superusers recebem permissões completas por padrão
            if (isUserAdmin || isUserSuperuser) {
              setPermissions({
                is_active: true,
                can_access_main_menu: true,
                can_access_admin: isUserAdmin, // Apenas admin acessa gestão de usuários
                can_view_products: true,
                can_create_reports: true,
                can_view_reports: true,
                can_create_withdrawals: true,
                can_view_withdrawal_history: true,
                can_edit_products: true,
                can_delete_products: true,
                can_edit_reports: true,
                can_delete_reports: true,
                can_access_assets: true,
                can_create_assets: true,
                can_edit_assets: true,
                can_delete_assets: true,
                can_scan_assets: true,
                can_view_financial_data: true,
              });
              setIsActive(true);
            }
          }
        })(),
        timeoutPromise
      ]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error checking user status:", error);
      }
      setIsAdmin(false);
      setIsSuperuser(false);
      setIsActive(false);
      setIsSystemOwner(false);
      setPermissions(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const signOut = async (logoutReason: string = 'manual') => {
    try {
      logger.auth('User signing out', { userId: user?.id, reason: logoutReason });
      
      // Registrar evento de LOGOUT
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        await registerLogoutEvent(
          user.id,
          user.email || 'unknown',
          profile?.full_name || null,
          logoutReason
        );
        
        // Deletar TODAS as sessões do usuário ao fazer logout
        await supabase
          .from('user_presence')
          .delete()
          .eq('user_id', user.id);
      }
      
      // Limpar localStorage (manter apenas app_version)
      const currentVersion = localStorage.getItem('app_version');
      localStorage.clear();
      if (currentVersion) {
        localStorage.setItem('app_version', currentVersion);
      }
      
      // Fazer logout no Supabase
      await supabase.auth.signOut();
      
      // Limpar estados
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setIsSuperuser(false);
      setIsActive(false);
      setIsSystemOwner(false);
      setPermissions(null);
      
      // Navegar para login
      navigate("/auth");
    } catch (error) {
      logger.error('Error during sign out', error);
      // Mesmo com erro, navegar para login
      navigate("/auth");
    }
  };

  const handleIdleLogout = async () => {
    toast({
      title: "Sessão Encerrada",
      description: "Você foi desconectado por inatividade.",
      variant: "destructive",
    });
    await signOut('idle_timeout');
  };

  const handleUpdateLogout = async () => {
    toast({
      title: "Sistema Atualizado",
      description: "Uma nova versão está disponível. Por favor, faça login novamente.",
    });
    await signOut('system_update');
    window.location.reload();
  };

  // Hook de rastreamento de inatividade
  const { isWarningShown, resetTimers } = useIdleTimeout({
    onIdle: handleIdleLogout,
    onWarning: () => setShowIdleWarning(true),
    isEnabled: !!user && !loading,
  });

  // Hook de verificação de versão
  useVersionCheck({
    onUpdateDetected: () => setShowUpdateDialog(true),
    isEnabled: !!user && !loading,
  });

  const handleContinueSession = () => {
    setShowIdleWarning(false);
    resetTimers();
  };

  // Hook de rastreamento de presença em tempo real
  useRealtimePresence({
    user,
    isEnabled: !!user && !loading,
  });

  // FASE 3: Health check de sessão
  const { isHealthy } = useSessionHealth({
    session,
    user,
    isEnabled: !!user && !loading,
  });

  // FASE 3: Logout automático se sessão corrompida
  useEffect(() => {
    if (!isHealthy && user) {
      logger.error('Corrupted session detected, forcing logout', { userId: user.id });
      toast({
        title: "Sessão Corrompida",
        description: "Sua sessão expirou. Redirecionando para login...",
        variant: "destructive",
      });
      signOut();
    }
  }, [isHealthy, user]);

  // FASE 4: Recarregar permissões ao atualizar
  useEffect(() => {
    if (!user) return;
    
    logger.permission('Subscribing to permission updates', { userId: user.id });
    
    const channel = supabase
      .channel('permissions_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_permissions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          logger.permission('Permissions updated, reloading...', payload.new);
          
          // Atualizar permissões em memória
          setPermissions(payload.new as UserPermissions);
          setIsActive(payload.new.is_active);
          
          toast({
            title: "Permissões Atualizadas",
            description: "Suas permissões foram modificadas por um administrador.",
          });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // isStaff = admin ou superuser (acesso operacional completo)
  const isStaff = isAdmin || isSuperuser;

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isSuperuser, isStaff, isActive, isSystemOwner, permissions, loading, signOut }}>
      {children}
      <IdleWarningDialog 
        open={showIdleWarning && isWarningShown} 
        onContinue={handleContinueSession}
      />
      <UpdateAvailableDialog
        open={showUpdateDialog}
        onUpdate={handleUpdateLogout}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
