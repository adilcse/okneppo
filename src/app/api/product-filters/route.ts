import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withCors } from '@/lib/cors';

export const GET = withCors(async () => {
  try {
    // Fetch unique categories from products
    const products = await db.find('products');
    
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(products.map(product => product.category as string))
    ).filter(Boolean).sort();
    
    // Define price ranges
    const priceRanges = [
      { min: 0, max: 500, label: 'Under ₹500' },
      { min: 500, max: 1000, label: '₹500 - ₹1,000' },
      { min: 1000, max: 5000, label: '₹1,000 - ₹5,000' },
      { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
      { min: 10000, max: Infinity, label: 'Over ₹10,000' }
    ];
    
    // Get min and max prices to potentially create dynamic price ranges
    const prices = products
      .map(product => {
        const price = product.price;
        return typeof price === 'string' ? parseFloat(price) : Number(price);
      })
      .filter(price => !isNaN(price));
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000;
    
    return NextResponse.json({
      categories: uniqueCategories,
      priceRanges,
      priceStats: {
        min: minPrice,
        max: maxPrice
      }
    });
  } catch (error) {
    console.error('Error fetching product filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product filters' },
      { status: 500 }
    );
  }
}); 