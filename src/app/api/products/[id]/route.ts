import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/api';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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