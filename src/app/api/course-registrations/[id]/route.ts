import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RegistrationStatus } from '@/models/CourseRegistration';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const registration = await db.findById('course_registrations', parseInt(id, 10));

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const {
      name,
      address,
      phone,
      email,
      course_id,
      course_title,
      amount_due,
      status,
      created_at,
      updated_at,
    } = registration;

    const formattedRegistration = {
      id,
      name,
      address,
      phone,
      email,
      courseId: course_id,
      courseTitle: course_title,
      amountDue: amount_due,
      status,
      createdAt: created_at,
      updatedAt: updated_at,
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