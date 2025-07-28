import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Razorpay from 'razorpay';
import { PaymentCreationAttributes, PaymentStatus } from '@/models/Payment';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(req: NextRequest) {
  try {
    const { registration_id, amount, coupon_code } = await req.json();

    if (!registration_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_order_${new Date().getTime()}`,
    };

    const order = await razorpay.orders.create(options);

    const paymentData: PaymentCreationAttributes = {
      registration_id,
      razorpay_order_id: order.id,
      amount,
      currency: 'INR',
      status: PaymentStatus.CREATED,
      coupon_code,
    };

    await db.create('payments', paymentData);

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 