import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  conversation_id: string | null;
  is_global: boolean;
  user_name?: string | null;
  user_email?: string;
}

export const useConversationMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessageId, setNewMessageId] = useState<string | null>(null);

  // Fetch messages for specific conversation or global
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (conversationId) {
        query = query.eq("conversation_id", conversationId);
      } else {
        query = query.eq("is_global", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user profiles for each message
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", msg.user_id)
            .maybeSingle();

          return {
            ...msg,
            user_name: profile?.full_name,
            user_email: profile?.email,
          };
        })
      );

      return messagesWithProfiles as Message[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages-${conversationId || 'global'}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: conversationId 
            ? `conversation_id=eq.${conversationId}`
            : `is_global=eq.true`,
        },
        async (payload) => {
          console.log("New message:", payload);
          setNewMessageId(payload.new.id);
          
          // Fetch the new message with profile data
          const [msgResult, profileResult] = await Promise.all([
            supabase.from("messages").select("*").eq("id", payload.new.id).single(),
            supabase.from("profiles").select("full_name, email").eq("id", payload.new.user_id).maybeSingle()
          ]);

          if (msgResult.data) {
            const messageWithProfile: Message = {
              ...msgResult.data,
              user_name: profileResult.data?.full_name,
              user_email: profileResult.data?.email,
            };

            queryClient.setQueryData<Message[]>(["messages", conversationId], (old = []) => {
              if (old.some(msg => msg.id === messageWithProfile.id)) return old;
              return [...old, messageWithProfile];
            });
          }

          setTimeout(() => setNewMessageId(null), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, conversationId, user]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          content: content.trim(),
          is_global: !conversationId,
          conversation_id: conversationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast.error("Erro ao enviar mensagem");
      console.error("Send message error:", error);
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    newMessageId,
  };
};
