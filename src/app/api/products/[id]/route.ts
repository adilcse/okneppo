import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/api';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id;
    const productData = await getProduct(productId);
    
    return NextResponse.json(productData);
  } catch (error) {
    console.error('Error fetching product in API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
} 