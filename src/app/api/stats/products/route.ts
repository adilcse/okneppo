import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get the total count of products
    const count = await db.count('products');
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching product count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product count', count: 0 },
      { status: 500 }
    );
  }
} 