import { NextRequest } from 'next/server';

// Store active connections
const connections = new Set<ReadableStreamDefaultController>();

// Event types for WhatsApp
export type WhatsAppEvent = 
  | { type: 'whatsapp:new-message'; data: { message: Record<string, unknown>; conversation: Record<string, unknown> } }
  | { type: 'whatsapp:message-status-update'; data: { messageId: string; status: string; phoneNumber: string; timestamp: string; direction: string; content: string; messageType: string } }
  | { type: 'whatsapp:new-conversation'; data: Record<string, unknown> }
  | { type: 'whatsapp:conversation-update'; data: { phoneNumber: string; update: Record<string, unknown> } };

// Function to broadcast events to all connected clients
export function broadcastEvent(event: WhatsAppEvent) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  
  connections.forEach(controller => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (sseError) {
      console.error('Error sending SSE message:', sseError);
      connections.delete(controller);
    }
  });
}

// Helper functions for emitting WhatsApp events (replacing socket functions)
export const emitNewMessage = (message: Record<string, unknown>, conversation: Record<string, unknown>) => {
  broadcastEvent({
    type: 'whatsapp:new-message',
    data: { message, conversation }
  });
};

export const emitMessageStatusUpdate = (messageId: string, status: string, phoneNumber: string, timestamp: string, direction: string, content: string, messageType: string) => {
  broadcastEvent({
    type: 'whatsapp:message-status-update',
    data: { messageId, status, phoneNumber, timestamp, direction, content, messageType }
  });
};

export const emitNewConversation = (conversation: Record<string, unknown>) => {
  broadcastEvent({
    type: 'whatsapp:new-conversation',
    data: conversation
  });
};

export const emitConversationUpdate = (phoneNumber: string, update: Record<string, unknown>) => {
  broadcastEvent({
    type: 'whatsapp:conversation-update',
    data: { phoneNumber, update }
  });
};

export async function GET(req: NextRequest) {
  // Create a new SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller);
      
      // Send initial connection message
      const welcomeMessage = `data: ${JSON.stringify({ type: 'connected', data: { message: 'Connected to WhatsApp events' } })}\n\n`;
      controller.enqueue(new TextEncoder().encode(welcomeMessage));
      
      // Send periodic heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = `data: ${JSON.stringify({ type: 'heartbeat', data: { timestamp: new Date().toISOString() } })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeatMessage));
        } catch (heartbeatError) {
            console.error('Error sending heartbeat:', heartbeatError);
          clearInterval(heartbeat);
          connections.delete(controller);
        }
      }, 30000); // Send heartbeat every 30 seconds
      
      // Clean up on connection close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        connections.delete(controller);
        try {
          controller.close();
        } catch (closeError) {
          console.error('Error closing connection:', closeError);
          // Connection already closed
        }
      });
    },
    
    cancel(controller) {
      // Remove connection when client disconnects
      connections.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
