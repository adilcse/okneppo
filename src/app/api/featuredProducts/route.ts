import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapProductFields } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    console.log(searchParams);
    // Query for products where featured = true, limit to 4
    const products = await db.query(
      'SELECT * FROM products WHERE featured = ? LIMIT 4',
      [true]
    );
    console.log(products);

    // Map products and format fields
    const mappedProducts = products.map((product) => {
      const mappedProduct = mapProductFields(product);
      
      // Truncate description if too long
      if (mappedProduct.description && mappedProduct.description.length > 120) {
        mappedProduct.description = mappedProduct.description.substring(0, 120) + '...';
      }
      
      return mappedProduct;
    });

    return NextResponse.json(mappedProducts);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
} 