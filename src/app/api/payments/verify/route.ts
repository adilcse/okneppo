import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { PaymentStatus } from '@/models/Payment';
import { RegistrationStatus } from '@/models/CourseRegistration';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const [updatedPaymentCount, updatedPayments] = await db.update(
      'payments',
      { razorpay_order_id },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: PaymentStatus.CAPTURED,
      }
    );

    if (updatedPaymentCount === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const registration_id = updatedPayments[0].registration_id;

    await db.update(
      'course_registrations',
      { id: registration_id },
      { status: RegistrationStatus.COMPLETED }
    );

    return NextResponse.json({ success: true, registration_id }, { status: 200 });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 