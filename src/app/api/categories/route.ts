import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Query to get all unique categories from products
    const categoriesResult = await db.query<{ category: string }[]>(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );
    
    // Extract categories from result
    const categories = categoriesResult.map(row => row.category);
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 