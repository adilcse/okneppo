import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapProductFields } from '@/lib/types';

// Get all products with filtering, sorting and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Pagination parameters
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 9;
    const offset = (page - 1) * limit;
    
    // Build query criteria
    const criteria: Record<string, unknown> = {};
    
    if (category && category !== 'All') {
      criteria.category = category;
    }
    
    // Apply price filters directly in the database query
    if (minPrice !== null || maxPrice !== null) {
      criteria.price = {};
      
      if (minPrice !== null) {
        (criteria.price as Record<string, number>)['>='] = minPrice;
      }
      
      if (maxPrice !== null && maxPrice !== Infinity) {
        (criteria.price as Record<string, number>)['<='] = maxPrice;
      }
    }
    
    // Get total count for pagination
    const totalCount = await db.count('products', criteria);
    
    // Execute query with pagination
    const options = {
      limit,
      offset,
      ...(sortBy ? {
        orderBy: sortBy,
        order: (sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC') as 'ASC' | 'DESC'
      } : {})
    };
    
    // Execute the query
    const products = await db.find('products', criteria, options);
    
    // Map products to ensure consistent field structure
    const mappedProducts = products.map(mapProductFields);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      products: mappedProducts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Create a new product
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const productData = await request.json();
    
    // Ensure price is a number
    if (typeof productData.price === 'string') {
      productData.price = parseFloat(productData.price.replace(/[^0-9.]/g, '')) || 0;
    }
    
    // Validate required fields
    if (!productData.name || productData.price === undefined || 
        !productData.category || !productData.images || productData.images.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Ensure optional fields are present (even if empty)
    const finalProductData = {
      name: productData.name,
      price: productData.price,
      category: productData.category,
      description: productData.description,
      images: productData.images,
      details: Array.isArray(productData.details) ? productData.details : [],
      care_instructions: productData.careInstructions || '',
      delivery_time: productData.deliveryTime || '',
      featured: Boolean(productData.featured)
    };
    
    // Create new product
    const newProduct = await db.create('products', finalProductData);
    
    // Map to ensure consistent field structure
    const mappedProduct = mapProductFields(newProduct);
    
    return NextResponse.json({
      success: true,
      product: mappedProduct
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
} 