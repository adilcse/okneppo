import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const registrations = await db.findAll('course_registrations', { orderBy: 'created_at', order: 'DESC' });
    const formattedRegistrations = registrations.map(reg => {
      const {
        id,
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
      } = reg;
      return {
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
    });
    
    return NextResponse.json(formattedRegistrations, { status: 200 });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 