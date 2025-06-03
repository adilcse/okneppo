import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withCors } from '@/lib/cors';

export const GET = withCors(async () => {
  try {
    const count = await db.count('subjects', {});
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching subjects count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects count' },
      { status: 500 }
    );
  }
}); 