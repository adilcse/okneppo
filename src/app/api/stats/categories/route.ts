import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Query for distinct categories count
    const result = await db.query<{ count: string }[]>(`
      SELECT COUNT(DISTINCT category) as count
      FROM products
    `);
    
    // Convert the count from string to number
    const count = result[0]?.count ? parseInt(result[0].count as string, 10) : 0;
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching category count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category count', count: 0 },
      { status: 500 }
    );
  }
} 