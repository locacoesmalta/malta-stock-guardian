import { useAuth } from "@/contexts/AuthContext";

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = async () => {
    if (!user) return;
    // Note: Audit logs are now handled automatically by database triggers
    // This hook is kept for backward compatibility but doesn't insert directly
  };

  return { logAction };
};
