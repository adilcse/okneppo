import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CourseRegistrationCreationAttributes, RegistrationStatus } from '@/models/CourseRegistration';

export async function POST(req: NextRequest) {
  try {
    const body: CourseRegistrationCreationAttributes = await req.json();

    // Check for existing registrations with the same phone or email
    const existingPhone = await db.findOne('course_registrations', { phone: body.phone });
    
    // Only check for existing email if email is provided and not empty
    let existingEmail = null;
    if (body.email && body.email.trim()) {
      existingEmail = await db.findOne('course_registrations', { email: body.email });
    }

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

    const newRegistration = await db.create('course_registrations', {
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
    });

    return NextResponse.json(newRegistration, { status: 201 });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 