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

    // Validate terms and conditions acceptance
    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions to proceed.' },
        { status: 400 }
      );
    }

    // Check for existing registration with the same phone
    const existingRegistration = await db.findOne('course_registrations', { phone: body.phone });
    
    // Only check for existing email if email is provided and not empty
    let existingEmail = null;
    if (body.email && body.email.trim()) {
      existingEmail = await db.findOne('course_registrations', { email: body.email });
    }

    // If email exists and it's different from the phone-based registration, return error
    if (existingEmail && existingRegistration && existingEmail.id !== existingRegistration.id) {
      return NextResponse.json(
        { error: 'Email address is already registered with a different phone number.' },
        { status: 400 }
      );
    }

    // If registration exists and is completed, return redirect info
    if (existingRegistration && existingRegistration.status === 'completed') {
      return NextResponse.json({
        success: false,
        alreadyRegistered: true,
        message: 'You are already registered for this course.',
        orderNumber: existingRegistration.order_number,
        redirectUrl: `/receipt/${existingRegistration.order_number}`,
      }, { status: 200 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newRegistration: any;
    
    if (existingRegistration) {
      // Update existing registration (keeps existing order_number)
      const [, updatedRegistrations] = await db.update(
        'course_registrations',
        { id: existingRegistration.id },
        {
          status: RegistrationStatus.PENDING,
          amount_due: body.amountDue,
          course_title: body.courseTitle,
          course_id: body.courseId,
          name: body.name,
          address: body.address,
          email: body.email && body.email.trim() ? body.email : null,
          highest_qualification: body.highestQualification || null,
          aadhar_number: body.aadharNumber || null,
          date_of_birth: body.dateOfBirth || null,
          profession: body.profession || null,
          terms_accepted: body.termsAccepted,
        }
      );
      newRegistration = updatedRegistrations[0];
    } else {
      // Generate unique order number for new registration
      const orderNumber = await generateUniqueOrderNumber(async (orderNum) => {
        const existing = await db.findOne('course_registrations', { order_number: orderNum });
        return !!existing;
      });

      // Create new registration with order number
      newRegistration = await db.create('course_registrations', {
        status: RegistrationStatus.PENDING,
        amount_due: body.amountDue,
        course_title: body.courseTitle,
        course_id: body.courseId,
        name: body.name,
        address: body.address,
        phone: body.phone,
        email: body.email && body.email.trim() ? body.email : null,
        highest_qualification: body.highestQualification || null,
        aadhar_number: body.aadharNumber || null,
        date_of_birth: body.dateOfBirth || null,
        profession: body.profession || null,
        terms_accepted: body.termsAccepted,
        order_number: orderNumber,
      });
    }

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

    // Create payment record
    const paymentRecord = await db.create('payments', {
      registration_id: newRegistration.id,
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
        order_number: newRegistration.order_number,
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
