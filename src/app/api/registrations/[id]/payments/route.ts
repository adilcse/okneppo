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
      // Find registration by order_number first, then get its payments
      const registration = await db.findOne('course_registrations', { order_number: orderNumber });
      if (!registration) {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }
      payments = await db.find('payments', { registration_id: registration.id });
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