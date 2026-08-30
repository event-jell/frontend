import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { messagesApi } from '../lib/api';
import { socket } from '../lib/socket';
import { toast } from 'sonner';
import type { ChatMessage, ConversationItem } from '../types';

export const MESSAGES_QUERY_KEYS = {
  conversations: ['messages', 'conversations'] as const,
  conversation: (id: string) => ['messages', 'conversation', id] as const,
  withUser: (userId: string) => ['messages', 'with-user', userId] as const,
};

export function useConversations() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversations });
    };
    const handleReadReceipt = () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversations });
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:read_receipt', handleReadReceipt);
    socket.on('chat:message_global', handleNewMessage);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:read_receipt', handleReadReceipt);
      socket.off('chat:message_global', handleNewMessage);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: MESSAGES_QUERY_KEYS.conversations,
    queryFn: messagesApi.getConversations,
    staleTime: 5000,
  });
}

export function useConversationMessages(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    // Join room
    socket.emit('chat:join', { conversationId });

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.conversation_id === conversationId) {
        queryClient.setQueryData<ChatMessage[]>(
          MESSAGES_QUERY_KEYS.conversation(conversationId),
          (prev) => {
            if (!prev) return [msg];
            if (prev.some((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          },
        );
        queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversations });
      }
    };

    socket.on('chat:new_message', handleNewMessage);

    return () => {
      socket.emit('chat:leave', { conversationId });
      socket.off('chat:new_message', handleNewMessage);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: MESSAGES_QUERY_KEYS.conversation(conversationId || ''),
    queryFn: () => (conversationId ? messagesApi.getMessagesByConversation(conversationId) : []),
    enabled: !!conversationId,
  });
}

export function useMessagesWithUser(otherUserId?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: MESSAGES_QUERY_KEYS.withUser(otherUserId || ''),
    queryFn: () => (otherUserId ? messagesApi.getMessagesWithUser(otherUserId) : []),
    enabled: !!otherUserId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagesApi.sendMessage,
    onSuccess: (newMsg) => {
      queryClient.setQueryData<ChatMessage[]>(
        MESSAGES_QUERY_KEYS.conversation(newMsg.conversation_id),
        (prev) => {
          if (!prev) return [newMsg];
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        },
      );
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversations });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send message');
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: messagesApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MESSAGES_QUERY_KEYS.conversations });
    },
  });
}
