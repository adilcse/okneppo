import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CourseRegistrationCreationAttributes, RegistrationStatus } from '@/models/CourseRegistration';

export async function POST(req: NextRequest) {
  try {
    const body: CourseRegistrationCreationAttributes = await req.json();

    const newRegistration = await db.create('course_registrations', {
      status: RegistrationStatus.PENDING,
      amount_due: body.amountDue,
      course_title: body.courseTitle,
      course_id: body.courseId,
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
    });

    return NextResponse.json(newRegistration, { status: 201 });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 