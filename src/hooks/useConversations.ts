import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConversationService, ConversationWithLastMessage } from '@/services/conversationService';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';
import { useEffect } from 'react';
import { useToast } from './use-toast';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];

/**
 * Hook para gestionar conversaciones
 */
export const useConversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener todas las conversaciones
  const conversationsQuery = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => ConversationService.getConversations(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 30000, // 30 segundos
    refetchInterval: 60000, // Refetch cada minuto
  });

  // Query para obtener el conteo de no leídos
  const unreadCountQuery = useQuery({
    queryKey: ['unreadCount', user?.id],
    queryFn: () => ConversationService.getUnreadCount(user?.id || ''),
    enabled: !!user?.id,
    staleTime: 10000, // 10 segundos
    refetchInterval: 30000, // Refetch cada 30 segundos
  });

  // Mutation para marcar como leído
  const markAsReadMutation = useMutation({
    mutationFn: ConversationService.markAsRead,
    onSuccess: (_, conversationId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
    onError: (error) => {
      console.error('Error marking as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar la conversación como leída',
        variant: 'destructive',
      });
    },
  });

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    const subscription = ConversationService.subscribeToConversations(
      user.id,
      (payload) => {
        console.log('Conversation change:', payload);
        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    conversations: conversationsQuery.data || [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    unreadCount: unreadCountQuery.data || 0,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    refetch: conversationsQuery.refetch,
  };
};

/**
 * Hook para buscar conversaciones
 */
export const useSearchConversations = (searchTerm: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['searchConversations', user?.id, searchTerm],
    queryFn: () => ConversationService.searchConversations(user?.id || '', searchTerm),
    enabled: !!user?.id && searchTerm.length > 0,
    staleTime: 10000,
  });
};

/**
 * Hook para gestionar mensajes de una conversación específica
 */
export const useMessages = (conversationId: string | null) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para obtener mensajes
  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => ConversationService.getMessages(conversationId || '', user?.id || ''),
    enabled: !!conversationId && !!user?.id,
    staleTime: 10000,
  });

  // Mutation para enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: ConversationService.sendMessage,
    onSuccess: (newMessage) => {
      if (newMessage && conversationId) {
        // Agregar el nuevo mensaje a la cache
        queryClient.setQueryData(
          ['messages', conversationId],
          (oldMessages: Message[] = []) => [...oldMessages, newMessage]
        );
        
        // Invalidar conversaciones para actualizar último mensaje
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el mensaje',
        variant: 'destructive',
      });
    },
  });

  // Suscripción a cambios en tiempo real de mensajes
  useEffect(() => {
    if (!conversationId) return;

    const subscription = ConversationService.subscribeToMessages(
      conversationId,
      (payload) => {
        console.log('Message change:', payload);
        
        if (payload.eventType === 'INSERT') {
          // Agregar nuevo mensaje a la cache
          queryClient.setQueryData(
            ['messages', conversationId],
            (oldMessages: Message[] = []) => {
              // Evitar duplicados
              const exists = oldMessages.some(msg => msg.id === payload.new.id);
              if (exists) return oldMessages;
              return [...oldMessages, payload.new];
            }
          );
        }
        
        // Invalidar conversaciones para actualizar último mensaje
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, queryClient]);

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    refetch: messagesQuery.refetch,
  };
};

/**
 * Hook para obtener una conversación específica
 */
export const useConversation = (conversationId: string | null) => {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => ConversationService.getConversationById(conversationId || ''),
    enabled: !!conversationId,
    staleTime: 60000,
  });
};