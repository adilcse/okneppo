import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CourseRegistrationCreationAttributes, RegistrationStatus } from '@/models/CourseRegistration';
import { generateUniqueOrderNumber } from '@/lib/orderUtils';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body: CourseRegistrationCreationAttributes & { amount: number; coupon_code?: string } = await req.json();

    // Check for existing registrations with the same phone or email
    const existingPhone = await db.findOne('course_registrations', { phone: body.phone });
    const existingEmail = await db.findOne('course_registrations', { email: body.email });

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number is already registered. Please use a different phone number.' },
        { status: 400 }
      );
    }

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email address is already registered. Please use a different email address.' },
        { status: 400 }
      );
    }

    // Validate terms and conditions acceptance
    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions to proceed.' },
        { status: 400 }
      );
    }

    // Create new registration
    const newRegistration = await db.create('course_registrations', {
      status: RegistrationStatus.PENDING,
      amount_due: body.amountDue,
      course_title: body.courseTitle,
      course_id: body.courseId,
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      highest_qualification: body.highestQualification || null,
      aadhar_number: body.aadharNumber || null,
      date_of_birth: body.dateOfBirth || null,
      profession: body.profession || null,
      terms_accepted: body.termsAccepted,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round(body.amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `reg_${newRegistration.id}`,
      notes: {
        registration_id: newRegistration.id,
        course_title: body.courseTitle,
        student_name: body.name,
        coupon_code: body.coupon_code || null,
      },
    };

    const order = await razorpay.orders.create(orderOptions);

    // Generate unique order number
    const orderNumber = await generateUniqueOrderNumber(async (orderNum) => {
      const existing = await db.findOne('payments', { order_number: orderNum });
      return !!existing;
    });

    // Create payment record
    const paymentRecord = await db.create('payments', {
      registration_id: newRegistration.id,
      order_number: orderNumber,
      razorpay_order_id: order.id,
      amount: body.amount,
      currency: 'INR',
      status: 'created',
      coupon_code: body.coupon_code || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

    return NextResponse.json({
      success: true,
      registration: newRegistration,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      payment: {
        id: paymentRecord.id,
        order_number: paymentRecord.order_number,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating registration with order:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
