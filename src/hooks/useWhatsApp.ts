import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

// Types
interface WhatsAppMessage {
  id: number;
  message_id: string;
  from_number: string;
  to_number: string;
  message_type: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  timestamp: string;
  metadata: Record<string, unknown>;
  isOptimistic?: boolean; // Flag for optimistic messages
}

interface Conversation {
  phone_number: string;
  message_count: number;
  last_message_time: string;
  last_inbound_time: string;
  last_outbound_time: string;
  last_message_content: string;
  last_message_direction: 'inbound' | 'outbound';
  inbound_count: number;
  outbound_count: number;
  unread_outbound_count: number;
}

interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MessagesResponse {
  phoneNumber: string;
  messages: WhatsAppMessage[];
  stats: {
    messageCount: number;
    inboundCount: number;
    outboundCount: number;
    firstMessageTime: string;
    lastMessageTime: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SendMessageRequest {
  to: string;
  message: string;
  type: 'text';
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// API Functions
const fetchConversations = async (): Promise<ConversationsResponse> => {
  const response = await fetch('/api/whatsapp/conversations');
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch conversations');
  }
  
  return data.data;
};

const fetchMessages = async (phoneNumber: string): Promise<MessagesResponse> => {
  const response = await fetch(`/api/whatsapp/conversations/${phoneNumber}`);
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch messages');
  }
  
  return data.data;
};

const sendMessage = async (messageData: SendMessageRequest): Promise<SendMessageResponse> => {
  const response = await fetch('/api/whatsapp/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messageData),
  });

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to send message');
  }
  
  return data;
};

// Custom Hooks
export const useConversations = () => {
  return useQuery({
    queryKey: ['whatsapp', 'conversations'],
    queryFn: fetchConversations,
    staleTime: 5 * 60 * 1000, // 5 minutes - conversations don't change that frequently
    // Removed polling - using Socket.IO for real-time updates
  });
};

export const useMessages = (phoneNumber: string | null) => {
  return useQuery({
    queryKey: ['whatsapp', 'messages', phoneNumber],
    queryFn: () => fetchMessages(phoneNumber!),
    enabled: !!phoneNumber, // Only run query when phoneNumber is provided
    staleTime: 2 * 60 * 1000, // 2 minutes - messages don't change that frequently
    // Removed polling - using Socket.IO for real-time updates
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['whatsapp', 'messages', variables.to] });
      await queryClient.cancelQueries({ queryKey: ['whatsapp', 'conversations'] });

      // Snapshot the previous values
      const previousMessages = queryClient.getQueryData(['whatsapp', 'messages', variables.to]);
      const previousConversations = queryClient.getQueryData(['whatsapp', 'conversations']);

      // Create optimistic message
      const tempId = Date.now();
      const optimisticMessage: WhatsAppMessage = {
        id: tempId, // Temporary ID
        message_id: `temp_${tempId}`, // Temporary message ID
        from_number: process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '',
        to_number: variables.to,
        message_type: variables.type,
        content: variables.message,
        direction: 'outbound',
        status: 'sending',
        timestamp: new Date().toISOString(),
        metadata: { 
          isOptimistic: true,
          tempId: tempId,
          tempMessageId: `temp_${tempId}`
        },
        isOptimistic: true,
      };

      // Optimistically update messages
      queryClient.setQueryData(['whatsapp', 'messages', variables.to], (oldData: MessagesResponse | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          messages: [...oldData.messages, optimisticMessage],
        };
      });

      // Optimistically update conversations
      queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: ConversationsResponse | undefined) => {
        if (!oldData) return oldData;
        
        const updatedConversations = oldData.conversations.map(conv => {
          if (conv.phone_number === variables.to) {
            return {
              ...conv,
              message_count: conv.message_count + 1,
              last_message_time: new Date().toISOString(),
              last_outbound_time: new Date().toISOString(),
              last_message_content: variables.message,
              last_message_direction: 'outbound' as const,
              outbound_count: conv.outbound_count + 1,
            };
          }
          return conv;
        });
        
        return {
          ...oldData,
          conversations: updatedConversations,
        };
      });

      // Return context with previous values
      return { previousMessages, previousConversations, optimisticMessage };
    },
    onSuccess: (data, variables, context) => {
      // Update the optimistic message with real data
      if (context?.optimisticMessage && data.messageId) {
        queryClient.setQueryData(['whatsapp', 'messages', variables.to], (oldData: MessagesResponse | undefined) => {
          if (!oldData) return oldData;
          
          const updatedMessages = oldData.messages.map(msg => {
            if (msg.isOptimistic && msg.id === context.optimisticMessage.id) {
              return {
                ...msg,
                message_id: data.messageId!,
                status: 'sent' as const,
                isOptimistic: false,
                metadata: { 
                  ...msg.metadata, 
                  isOptimistic: false,
                  real_message_id: data.messageId,
                  realMessageId: data.messageId, // Store real message ID for socket matching
                  sent_at: new Date().toISOString()
                },
              };
            }
            return msg;
          });
          
          return {
            ...oldData,
            messages: updatedMessages,
          };
        });

        // Also update the conversations list to reflect the real message
        queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: ConversationsResponse | undefined) => {
          if (!oldData) return oldData;
          
          const updatedConversations = oldData.conversations.map(conv => {
            if (conv.phone_number === variables.to) {
              return {
                ...conv,
                last_message_content: variables.message,
                last_message_direction: 'outbound' as const,
                last_outbound_time: new Date().toISOString(),
                last_message_time: new Date().toISOString(),
              };
            }
            return conv;
          });
          
          return {
            ...oldData,
            conversations: updatedConversations,
          };
        });
      }
      
      toast.success('Message sent successfully');
    },
    onError: (error: Error, variables, context) => {
      // Update the optimistic message to show failed status
      if (context?.optimisticMessage) {
        queryClient.setQueryData(['whatsapp', 'messages', variables.to], (oldData: MessagesResponse | undefined) => {
          if (!oldData) return oldData;
          
          const updatedMessages = oldData.messages.map(msg => {
            if (msg.isOptimistic && msg.id === context.optimisticMessage.id) {
              return {
                ...msg,
                status: 'failed' as const,
              };
            }
            return msg;
          });
          
          return {
            ...oldData,
            messages: updatedMessages,
          };
        });
      }
      
      toast.error(error.message || 'Failed to send message');
    },
    onSettled: (data, error, variables) => {
      // Only invalidate on error - success updates are handled by optimistic updates and sockets
      if (error) {
        queryClient.invalidateQueries({ 
          queryKey: ['whatsapp', 'messages', variables.to] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['whatsapp', 'conversations'] 
        });
      }
    },
  });
};

// Utility hook for manual refresh
export const useRefreshWhatsApp = () => {
  const queryClient = useQueryClient();

  const refreshConversations = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['whatsapp', 'conversations'] 
    });
  };

  const refreshMessages = (phoneNumber: string) => {
    queryClient.invalidateQueries({ 
      queryKey: ['whatsapp', 'messages', phoneNumber] 
    });
  };

  const refreshAll = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['whatsapp'] 
    });
  };

  return {
    refreshConversations,
    refreshMessages,
    refreshAll,
  };
};

// Hook for retrying failed messages
export const useRetryMessage = () => {
  const sendMessageMutation = useSendMessage();
  const queryClient = useQueryClient();

  const retryMessage = (message: WhatsAppMessage) => {
    if (message.status !== 'failed' || message.direction !== 'outbound') {
      return;
    }

    // Remove the failed message from the UI
    queryClient.setQueryData(['whatsapp', 'messages', message.to_number], (oldData: MessagesResponse | undefined) => {
      if (!oldData) return oldData;
      
      const updatedMessages = oldData.messages.filter(msg => msg.id !== message.id);
      
      return {
        ...oldData,
        messages: updatedMessages,
      };
    });

    // Send the message again with optimistic update
    sendMessageMutation.mutate({
      to: message.to_number,
      message: message.content,
      type: message.message_type as 'text'
    });
  };

  return {
    retryMessage,
    isRetrying: sendMessageMutation.isPending,
  };
};
