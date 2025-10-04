import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isActive: boolean;
  permissions: UserPermissions | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
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

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleError) {
        console.error("Error fetching role:", roleError);
      }

      const isUserAdmin = roleData?.role === "admin";
      setIsAdmin(isUserAdmin);

      // Fetch all permissions
      const { data: permData, error: permError } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (permError) {
        console.error("Error fetching permissions:", permError);
      }

      if (permData) {
        setPermissions(permData as UserPermissions);
        setIsActive(permData.is_active === true);
      } else {
        // Admins get all permissions by default
        if (isUserAdmin) {
          setPermissions({
            is_active: true,
            can_access_main_menu: true,
            can_access_admin: true,
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
          });
          setIsActive(true);
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      setIsAdmin(false);
      setIsActive(false);
      setPermissions(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setIsActive(false);
    setPermissions(null);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isActive, permissions, loading, signOut }}>
      {children}
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
