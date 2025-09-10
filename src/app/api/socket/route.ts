import { NextRequest } from 'next/server';

// This route is only for local development
// In production, use the external Socket.IO server

export async function GET(req: NextRequest) {
  return new Response('Socket.IO endpoint - Use external server in production', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}

export async function POST(req: NextRequest) {
  return new Response('Socket.IO endpoint - Use external server in production', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}
