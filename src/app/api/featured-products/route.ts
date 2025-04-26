import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Query products collection for featured items
    const featuredProducts = await db.find(
      'products', 
      { featured: true },
      { orderBy: 'id', order: 'DESC' }
    );

    return NextResponse.json(featuredProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
} 