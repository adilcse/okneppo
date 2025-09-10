// Client for emitting events to external Socket.IO server
// This works with Vercel's serverless environment

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';

// Function to emit events to external Socket.IO server
async function emitToSocketServer(event: string, data: any) {
  try {
    const response = await fetch(`${SOCKET_SERVER_URL}/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event, data, room: 'whatsapp-admin' }),
    });

    if (!response.ok) {
      console.error('Failed to emit to socket server:', response.statusText);
    }
  } catch (error) {
    console.error('Error emitting to socket server:', error);
  }
}

// Helper functions for emitting WhatsApp events
export const emitNewMessage = (message: Record<string, unknown>, conversation: Record<string, unknown>) => {
  emitToSocketServer('whatsapp:new-message', { message, conversation });
};

export const emitMessageStatusUpdate = (
  messageId: string, 
  status: string, 
  phoneNumber: string, 
  timestamp: string, 
  direction: string, 
  content: string, 
  messageType: string
) => {
  emitToSocketServer('whatsapp:message-status-update', {
    messageId,
    status,
    phoneNumber,
    timestamp,
    direction,
    content,
    messageType
  });
};

export const emitNewConversation = (conversation: Record<string, unknown>) => {
  emitToSocketServer('whatsapp:new-conversation', conversation);
};

export const emitConversationUpdate = (phoneNumber: string, update: Record<string, unknown>) => {
  emitToSocketServer('whatsapp:conversation-update', { phoneNumber, update });
};
