import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapProductFields } from '@/lib/types';

export async function GET() {
  try {
    // Query products collection for featured items
    console.log('Querying featured products');
    const featuredProducts = await db.find(
      'products', 
      { featured: true },
      { orderBy: 'id', order: 'DESC', limit: 4 }
    );

    // Map and format products
    const mappedProducts = featuredProducts.map(product => {
      const mappedProduct = mapProductFields(product);
      
      // Truncate description if too long
      if (mappedProduct.description && mappedProduct.description.length > 120) {
        mappedProduct.description = mappedProduct.description.substring(0, 120) + '...';
      }
      
      return {
        id: mappedProduct.id,
        name: mappedProduct.name,
        price: mappedProduct.price,
        images: mappedProduct.images,
        description: mappedProduct.description
      };
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