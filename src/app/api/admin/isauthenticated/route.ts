import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Error checking authentication:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication' },
      { status: 500 }
    );
  }
} 