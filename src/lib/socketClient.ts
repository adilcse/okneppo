/* eslint-disable @typescript-eslint/no-explicit-any */
// Client for emitting events to external generic Socket.IO server
// This works with Vercel's serverless environment

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3001';

// Function to emit events to external Socket.IO server
async function emitToSocketServer(event: string, data: any, room?: string, rooms?: string[]) {
  try {
    const payload: any = { event, data };
    
    if (rooms && Array.isArray(rooms)) {
      payload.rooms = rooms;
    } else if (room) {
      payload.room = room;
    }

    const response = await fetch(`${SOCKET_SERVER_URL}/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Failed to emit to socket server:', response.statusText);
    }
  } catch (error) {
    console.error('Error emitting to socket server:', error);
  }
}

// Generic event emission functions
export const emitEvent = (event: string, data: any, room?: string, rooms?: string[]) => {
  emitToSocketServer(event, data, room, rooms);
};

// Helper functions for emitting WhatsApp events (backward compatibility)
export const emitNewMessage = (message: Record<string, unknown>, conversation: Record<string, unknown>) => {
  emitToSocketServer('whatsapp:new-message', { message, conversation }, 'whatsapp-admin');
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
  }, 'whatsapp-admin');
};

export const emitNewConversation = (conversation: Record<string, unknown>) => {
  emitToSocketServer('whatsapp:new-conversation', conversation, 'whatsapp-admin');
};

export const emitConversationUpdate = (phoneNumber: string, update: Record<string, unknown>) => {
  emitToSocketServer('whatsapp:conversation-update', { phoneNumber, update }, 'whatsapp-admin');
};
