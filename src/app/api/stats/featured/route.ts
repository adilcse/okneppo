import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get the count of featured products
    const count = await db.count('products', { featured: true });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching featured product count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured product count', count: 0 },
      { status: 500 }
    );
  }
} 