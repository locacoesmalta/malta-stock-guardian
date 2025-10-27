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
  user_name?: string | null;
  user_email?: string;
}

export const useMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessageId, setNewMessageId] = useState<string | null>(null);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user profiles for each message
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", msg.user_id)
            .single();

          return {
            ...msg,
            user_name: profile?.full_name,
            user_email: profile?.email,
          };
        })
      );

      return messagesWithProfiles as Message[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message:", payload);
          setNewMessageId(payload.new.id);
          
          // Fetch the new message with profile data
          Promise.all([
            supabase.from("messages").select("*").eq("id", payload.new.id).single(),
            supabase.from("profiles").select("full_name, email").eq("id", payload.new.user_id).single()
          ]).then(([msgResult, profileResult]) => {
            if (msgResult.data) {
              const messageWithProfile: Message = {
                ...msgResult.data,
                user_name: profileResult.data?.full_name,
                user_email: profileResult.data?.email,
              };

              queryClient.setQueryData<Message[]>(["messages"], (old = []) => {
                // Avoid duplicates
                if (old.some(msg => msg.id === messageWithProfile.id)) return old;
                return [...old, messageWithProfile];
              });
            }
          });

          // Clear new message highlight after animation
          setTimeout(() => setNewMessageId(null), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from("messages")
        .insert({
          user_id: user.id,
          content: content.trim(),
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
