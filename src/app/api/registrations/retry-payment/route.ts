import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body: { registration_id: number } = await req.json();

    if (!body.registration_id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Get the registration details
    const registration = await db.findById('course_registrations', body.registration_id);
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Get the existing payment record for this registration
    const existingPayment = await db.findOne('payments', { 
      registration_id: body.registration_id,
    });

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'No existing order found for this registration' },
        { status: 404 }
      );
    }

    // Return the existing order details
    return NextResponse.json({
      success: true,
      registration: registration,
      order: {
        id: existingPayment.razorpay_order_id,
        amount: Math.round((existingPayment.amount as number) * 100), // Convert to paise
        currency: existingPayment.currency,
        receipt: `reg_${registration.id}`,
      },
      payment: {
        id: existingPayment.id,
        order_number: existingPayment.order_number,
      },
    });

  } catch (error) {
    console.error('Error retrieving order for retry:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
