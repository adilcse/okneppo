import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mapProductFields } from '@/lib/types';

// Get all products with filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null;
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    // Build query criteria
    const criteria: Record<string, string> = {};
    
    if (category && category !== 'All') {
      criteria.category = category;
    }
    
    // Apply price filters using query parameters
    // We'll handle the price filtering after query execution
    
    // Execute query
    const options = sortBy ? {
      orderBy: sortBy,
      order: (sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC') as 'ASC' | 'DESC'
    } : {};
    
    // Execute the query
    const products = await db.find('products', criteria, options);
    
    // Apply price filtering in memory if needed
    const filteredProducts = products.filter(product => {
      // Check if we need to filter by price
      if (minPrice === null && maxPrice === null) {
        return true;
      }
      
      const productPrice = typeof product.price === 'number' 
        ? product.price 
        : parseFloat(String(product.price).replace(/[^\d.]/g, '') || '0');
      
      if (minPrice !== null && maxPrice !== null) {
        return productPrice >= minPrice && productPrice <= maxPrice;
      } else if (minPrice !== null) {
        return productPrice >= minPrice;
      } else if (maxPrice !== null) {
        return productPrice <= maxPrice;
      }
      
      return true;
    });
    
    // Map products to ensure consistent field structure
    const mappedProducts = filteredProducts.map(mapProductFields);
    
    return NextResponse.json(mappedProducts);
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