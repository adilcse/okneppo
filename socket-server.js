// Standalone Socket.IO server for Vercel deployment
// Deploy this to Railway, Render, or any platform that supports persistent connections

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Enable CORS
app.use(cors({
  origin: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://your-vercel-app.vercel.app' // Replace with your actual Vercel URL
  ],
  credentials: true
}));

// Initialize Socket.IO with long polling only
const io = new Server(server, {
  cors: {
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'https://your-vercel-app.vercel.app' // Replace with your actual Vercel URL
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling'], // Force long polling only
  allowEIO3: true
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected via long polling:', socket.id);

  // Join admin room for WhatsApp updates
  socket.join('whatsapp-admin');

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connections: io.engine.clientsCount });
});

// Endpoint for external API calls to emit events
app.post('/emit', express.json(), (req, res) => {
  const { event, data, room } = req.body;
  
  if (!event || !data) {
    return res.status(400).json({ error: 'Missing event or data' });
  }

  try {
    if (room) {
      io.to(room).emit(event, data);
    } else {
      io.emit(event, data);
    }
    
    res.json({ success: true, event, room });
  } catch (error) {
    console.error('Error emitting event:', error);
    res.status(500).json({ error: 'Failed to emit event' });
  }
});

// Make io available globally for external API calls
global.io = io;

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT} with long polling only`);
});

// Export for external use
export { io, server };
