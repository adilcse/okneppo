/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest } from 'next/server';
// import { Server as SocketIOServer } from 'socket.io';
// import { Server as HTTPServer } from 'http';
// import { initializeSocket } from '@/lib/socket';


// This is a placeholder route for Socket.IO
// The actual Socket.IO server will be initialized in the main server
export async function GET(req: NextRequest) {
  return new Response('Socket.IO endpoint', { status: 200 });
}

export async function POST(req: NextRequest) {
  return new Response('Socket.IO endpoint', { status: 200 });
}
