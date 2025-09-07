import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const orderNumber = searchParams?.get('order_number');
    let payments;
    if (orderNumber) {
      payments = await db.find('payments', { order_number: orderNumber });
    } else {
      payments = await db.find('payments', { registration_id: parseInt(id, 10) });
    }
    if (!payments) {
      return NextResponse.json({ error: 'Payments not found' }, { status: 404 });
    }

    return NextResponse.json(payments, { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 