import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

interface SocketEventHandlers {
  onNewMessage?: (data: Record<string, unknown>) => void;
  onMessageStatusUpdate?: (data: Record<string, unknown>) => void;
  onNewConversation?: (data: Record<string, unknown>) => void;
  onConversationUpdate?: (data: Record<string, unknown>) => void;
}

export const useSocket = (handlers: SocketEventHandlers = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize socket connection with long polling only (Vercel compatible)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    const socketPath =  '/socket.io';
    
    const socketInstance = io(socketUrl, {
      path: socketPath,
      transports: ['websocket', 'polling'], // Force long polling only, no WebSockets
      upgrade: true, // Disable transport upgrades
      rememberUpgrade: true
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      
      // Auto-join WhatsApp admin room for backward compatibility
      socketInstance.emit('join-room', 'whatsapp-admin');
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Room management events
    socketInstance.on('room-joined', (data) => {
      console.log('Joined room:', data.room);
    });

    socketInstance.on('room-left', (data) => {
      console.log('Left room:', data.room);
    });

    // WhatsApp event handlers
    socketInstance.on('whatsapp:new-message', (data) => {
      console.log('Received new message via socket:', data);
      
      // Update messages cache
      if (data.message && data.conversation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient.setQueryData(['whatsapp', 'messages', data.conversation.phone_number], (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            messages: [...oldData.messages, data.message]
          };
        });

        // Update conversations cache
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: any) => {
          if (!oldData) return oldData;
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // Call custom handler if provided
      handlers.onNewMessage?.(data);
    });

    socketInstance.on('whatsapp:message-status-update', (data) => {
      console.log('Received message status update via socket:', data);
      
      // Update message status in cache
      if (data.messageId && data.phoneNumber) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient.setQueryData(['whatsapp', 'messages', data.phoneNumber], (oldData: any) => {
          if (!oldData) return oldData;
          
          console.log('Updating message status for:', data.messageId, 'in conversation:', data.phoneNumber);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.log('Current messages:', oldData.messages.map((msg: any) => ({ 
            message_id: msg.message_id, 
            status: msg.status, 
            isOptimistic: msg.isOptimistic 
          })));
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              console.log('Match type:', matchesByRealId ? 'real_id' : matchesByMetadataRealId ? 'metadata_real_id' : 'content');
              console.log('Message details:', {
                current_id: msg.message_id,
                current_status: msg.status,
                isOptimistic: msg.isOptimistic,
                content: msg.content
              });
              
              return {
                ...msg,
                message_id: data.messageId, // Always update to real message ID
                status: data.status,
                timestamp: data.timestamp,
                isOptimistic: false, // Mark as no longer optimistic
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
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hasChanges = updatedMessages.some((msg: any, index: number) => {
            const oldMsg = oldData.messages[index];
            const matchesByRealId = msg.message_id === data.messageId;
            const matchesByMetadataRealId = msg.metadata?.real_message_id === data.messageId || 
                                          msg.metadata?.realMessageId === data.messageId;
            const matchesByContent = msg.isOptimistic && 
              msg.direction === 'outbound' && 
              msg.status === 'sending' &&
              msg.content === data.content;
            
            return (matchesByRealId || matchesByMetadataRealId || matchesByContent) && 
                   oldMsg.status !== msg.status;
          });
          
          if (hasChanges) {
            console.log('Message status updated successfully');
          } else {
            console.log('No matching message found for status update');
          }
          
          return {
            ...oldData,
            messages: updatedMessages
          };
        });
      }

      // Call custom handler if provided
      handlers.onMessageStatusUpdate?.(data);
    });

    socketInstance.on('whatsapp:new-conversation', (data) => {
      console.log('Received new conversation via socket:', data);
      
      // Update conversations cache
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          conversations: [data, ...oldData.conversations]
        };
      });

      // Call custom handler if provided
      handlers.onNewConversation?.(data);
    });

    socketInstance.on('whatsapp:conversation-update', (data) => {
      console.log('Received conversation update via socket:', data);
      
      // Update specific conversation in cache
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(['whatsapp', 'conversations'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // Call custom handler if provided
      handlers.onConversationUpdate?.(data);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit: (event: string, data: any) => {
      if (socket) {
        socket.emit(event, data);
      }
    },
    joinRoom: (room: string) => {
      if (socket) {
        socket.emit('join-room', room);
      }
    },
    leaveRoom: (room: string) => {
      if (socket) {
        socket.emit('leave-room', room);
      }
    }
  };
};
