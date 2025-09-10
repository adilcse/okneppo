/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SSEEventHandlers {
  onNewMessage?: (data: Record<string, unknown>) => void;
  onMessageStatusUpdate?: (data: Record<string, unknown>) => void;
  onNewConversation?: (data: Record<string, unknown>) => void;
  onConversationUpdate?: (data: Record<string, unknown>) => void;
}

export const useSSE = (handlers: SSEEventHandlers = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource('/api/events');
    eventSourceRef.current = eventSource;

    // Connection event handlers
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setError(null);
    };

    eventSource.onerror = (event) => {
      console.error('SSE connection error:', event);
      setIsConnected(false);
      setError('Connection error');
    };

    // Handle incoming events
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE event:', data);

        switch (data.type) {
          case 'connected':
            console.log('SSE connected:', data.data.message);
            break;

          case 'heartbeat':
            // Just acknowledge heartbeat, no action needed
            break;

          case 'whatsapp:new-message':
            handleNewMessage(data.data);
            handlers.onNewMessage?.(data.data);
            break;

          case 'whatsapp:message-status-update':
            handleMessageStatusUpdate(data.data);
            handlers.onMessageStatusUpdate?.(data.data);
            break;

          case 'whatsapp:new-conversation':
            handleNewConversation(data.data);
            handlers.onNewConversation?.(data.data);
            break;

          case 'whatsapp:conversation-update':
            handleConversationUpdate(data.data);
            handlers.onConversationUpdate?.(data.data);
            break;

          default:
            console.log('Unknown SSE event type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, []);

  // Handle new message event
  const handleNewMessage = (data: any) => {
    if (data.message && data.conversation) {
      // Update messages cache
      queryClient.setQueryData(['whatsapp', 'messages', data.conversation.phone_number], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          messages: [...oldData.messages, data.message]
        };
      });

      // Update conversations cache
      queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: any) => {
        if (!oldData) return oldData;
        
        const updatedConversations = oldData.conversations.map((conv: any) => {
          if (conv.phone_number === data.conversation.phone_number) {
            return {
              ...conv,
              message_count: conv.message_count + 1,
              last_message_time: data.conversation.last_message_time,
              last_message_content: data.conversation.last_message_content,
              last_message_direction: data.conversation.last_message_direction,
              inbound_count: conv.inbound_count + 1
            };
          }
          return conv;
        });

        // If conversation doesn't exist, add it
        const existingConversation = updatedConversations.find(
          (conv: any) => conv.phone_number === data.conversation.phone_number
        );

        if (!existingConversation) {
          updatedConversations.unshift({
            phone_number: data.conversation.phone_number,
            message_count: 1,
            last_message_time: data.conversation.last_message_time,
            last_inbound_time: data.conversation.last_message_time,
            last_outbound_time: null,
            last_message_content: data.conversation.last_message_content,
            last_message_direction: data.conversation.last_message_direction,
            inbound_count: 1,
            outbound_count: 0
          });
        }

        return {
          ...oldData,
          conversations: updatedConversations
        };
      });
    }
  };

  // Handle message status update event
  const handleMessageStatusUpdate = (data: any) => {
    if (data.messageId && data.phoneNumber) {
      queryClient.setQueryData(['whatsapp', 'messages', data.phoneNumber], (oldData: any) => {
        if (!oldData) return oldData;
        
        console.log('Updating message status for:', data.messageId, 'in conversation:', data.phoneNumber);
        
        const updatedMessages = oldData.messages.map((msg: any) => {
          // Multiple matching strategies for robust message identification
          const matchesByRealId = msg.message_id === data.messageId;
          const matchesByMetadataRealId = msg.metadata?.real_message_id === data.messageId || 
                                        msg.metadata?.realMessageId === data.messageId;
          const matchesByContent = msg.isOptimistic && 
            msg.direction === 'outbound' && 
            msg.status === 'sending' &&
            msg.content === data.content;
          
          if (matchesByRealId || matchesByMetadataRealId || matchesByContent) {
            console.log('Found matching message, updating status from', msg.status, 'to', data.status);
            
            return {
              ...msg,
              message_id: data.messageId,
              status: data.status,
              timestamp: data.timestamp,
              isOptimistic: false,
              metadata: {
                ...msg.metadata,
                isOptimistic: false,
                real_message_id: data.messageId,
                realMessageId: data.messageId,
                status_updated_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            };
          }
          return msg;
        });
        
        return {
          ...oldData,
          messages: updatedMessages
        };
      });
    }
  };

  // Handle new conversation event
  const handleNewConversation = (data: any) => {
    queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        conversations: [data, ...oldData.conversations]
      };
    });
  };

  // Handle conversation update event
  const handleConversationUpdate = (data: any) => {
    queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: any) => {
      if (!oldData) return oldData;
      
      const updatedConversations = oldData.conversations.map((conv: any) => {
        if (conv.phone_number === data.phoneNumber) {
          return {
            ...conv,
            ...data.update
          };
        }
        return conv;
      });
      
      return {
        ...oldData,
        conversations: updatedConversations
      };
    });
  };

  return {
    isConnected,
    error,
    // For compatibility with existing code that might expect an emit function
    emit: (event: string, data: any) => {
      console.log('SSE does not support client-to-server events. Event:', event, 'Data:', data);
    }
  };
};
