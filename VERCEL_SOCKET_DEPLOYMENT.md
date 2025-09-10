# Vercel Socket.IO Long Polling Deployment Guide

This guide explains how to deploy your Next.js app with Socket.IO long polling support on Vercel.

## Architecture

- **Next.js App**: Deployed on Vercel (serverless)
- **Socket.IO Server**: Deployed separately (Railway, Render, or similar)
- **Communication**: Long polling only (no WebSockets)

## Setup Steps

### 1. Deploy Socket.IO Server

The Socket.IO server is now in a separate repository: `../okneppo-socket-server/`

#### Option A: Railway (Recommended)
1. Create a new project on [Railway](https://railway.app)
2. Connect the `okneppo-socket-server` repository
3. Deploy automatically (Railway will detect the package.json)
4. Add environment variables:
   - `NEXT_PUBLIC_APP_URL`: Your Vercel app URL
   - `PORT`: Auto-assigned by Railway

#### Option B: Render
1. Create a new Web Service on [Render](https://render.com)
2. Connect the `okneppo-socket-server` repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables as above

#### Option C: Manual Deployment
```bash
cd ../okneppo-socket-server
npm install
npm start
```

### 2. Update Environment Variables

Add to your Vercel project environment variables:

```bash
# Socket.IO server URL
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
SOCKET_SERVER_URL=https://your-socket-server.railway.app
```

### 3. Deploy to Vercel

Your Next.js app will now work with Socket.IO long polling:

```bash
# Deploy to Vercel
vercel --prod
```

## How It Works

1. **Client Connection**: The `useSocket` hook connects to your external Socket.IO server using long polling only
2. **Event Emission**: WhatsApp webhooks call the external Socket.IO server via HTTP API
3. **Real-time Updates**: Clients receive updates through long polling connections

## Configuration

### Socket.IO Client (Long Polling Only)
```typescript
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const socketPath = socketUrl.includes('localhost:3001') ? '/socket.io' : '/api/socket.io';

const socketInstance = io(socketUrl, {
  path: socketPath,
  transports: ['polling'], // Force long polling only
  upgrade: false, // Disable transport upgrades
  rememberUpgrade: false
});
```

### Socket.IO Server (Long Polling Only)
```javascript
const io = new Server(server, {
  transports: ['polling'], // Force long polling only
  allowEIO3: true
});
```

## Benefits

- ✅ Works with Vercel's serverless environment
- ✅ No WebSocket connections required
- ✅ Automatic reconnection on connection loss
- ✅ Same Socket.IO API as before
- ✅ Real-time WhatsApp message updates

## Testing

1. Deploy both services
2. Open your Vercel app
3. Check browser console for "Socket connected via long polling"
4. Send a WhatsApp message to test real-time updates

## Troubleshooting

### Connection Issues
- Verify `NEXT_PUBLIC_SOCKET_URL` is set correctly
- Check Socket.IO server is running and accessible
- Ensure CORS is configured properly

### Performance
- Long polling has slightly higher latency than WebSockets
- Consider connection pooling for high-traffic applications
- Monitor server resources on your Socket.IO hosting platform

## Alternative: Server-Sent Events (SSE)

If you prefer a simpler solution, you can use the SSE implementation I created earlier:
- Files: `src/app/api/events/route.ts` and `src/hooks/useSSE.ts`
- No external server required
- Works entirely within Vercel's serverless environment
