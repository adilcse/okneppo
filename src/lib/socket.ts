import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HTTPServer) => {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : "http://localhost:3000",
      methods: ["GET", "POST"]
    },
    path: '/api/socket.io'
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join admin room for WhatsApp updates
    socket.join('whatsapp-admin');

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

// Helper functions for emitting WhatsApp events
export const emitNewMessage = (message: Record<string, unknown>) => {
  const socket = getSocketIO();
  socket.to('whatsapp-admin').emit('whatsapp:new-message', message);
};

export const emitMessageStatusUpdate = (messageId: string, status: string, phoneNumber: string) => {
  const socket = getSocketIO();
  socket.to('whatsapp-admin').emit('whatsapp:message-status-update', {
    messageId,
    status,
    phoneNumber
  });
};

export const emitNewConversation = (conversation: Record<string, unknown>) => {
  const socket = getSocketIO();
  socket.to('whatsapp-admin').emit('whatsapp:new-conversation', conversation);
};

export const emitConversationUpdate = (phoneNumber: string, update: Record<string, unknown>) => {
  const socket = getSocketIO();
  socket.to('whatsapp-admin').emit('whatsapp:conversation-update', {
    phoneNumber,
    update
  });
};
