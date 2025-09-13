import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RegistrationStatus } from '@/models/CourseRegistration';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const orderNumber = searchParams?.get('order_number');
    const getPayments = searchParams?.get('payment') === 'true';
    let registration, payments;
    
    if (orderNumber) {
      // Find registration by order_number
      registration = await db.findOne('course_registrations', { order_number: orderNumber });
      if (!registration) {
        return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
      }
    } else {
      registration = await db.findById('course_registrations', parseInt(id, 10));
    }

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    
    // Get payment for this registration
    const payment = await db.findOne('payments', { registration_id: registration.id });

    if (getPayments) {
      payments = await db.find('payments', { registration_id: registration.id });
    }

    const formattedRegistration = {
      id: registration.id,
      name: registration.name,
      address: registration.address,
      phone: registration.phone,
      email: registration.email,
      courseId: registration.course_id,
      courseTitle: registration.course_title,
      amountDue: registration.amount_due,
      status: registration.status,
      orderNumber: registration.order_number || null,
      createdAt: registration.created_at,
      updatedAt: registration.updated_at,
      payment: getPayments ? payments : null,
      couponCode: payment?.coupon_code || null,
      aadharNumber: registration.aadhar_number || null,
      dateOfBirth: registration.date_of_birth || null,
      profession: registration.profession || null,
      highestQualification: registration.highest_qualification || null,
      termsAccepted: registration.terms_accepted,
    };

    return NextResponse.json(formattedRegistration, { status: 200 });
  } catch (error) {
    console.error('Error fetching registration:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!Object.values(RegistrationStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const [updatedCount, updatedRegistrations] = await db.update(
      'course_registrations',
      { id: parseInt(id, 10) },
      { status }
    );

    if (updatedCount === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: updatedRegistrations[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating registration status:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 