import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withCors } from '@/lib/cors';
import { Course, Subject } from '@/types/course';

// Get a single course by ID
export const GET = withCors(async (request: NextRequest) => {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Get course with subjects using a join
    const options = {
      join: {
        table: 'course_subjects',
        on: 'courses.id = course_subjects.course_id',
        type: 'LEFT' as const
      },
      select: [
        'courses.*',
        'STRING_AGG(DISTINCT course_subjects.subject_id::text, \',\') as subject_ids'
      ],
      groupBy: 'courses.id'
    };

    const courses = await db.find<Course & { subject_ids?: string; subject_orders?: string }>('courses', { id }, options);
    const course = courses[0];

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get subject details for each subject ID
    const subjectIds = course.subject_ids ? course.subject_ids.split(',').map(Number) : [];
    const subjects = subjectIds.length > 0 
      ? await db.find<Subject>('subjects', { id: { $in: subjectIds } })
      : [];


    // Format the response
    const formattedCourse = {
      ...course,
      subjects: subjects,
    };

    return NextResponse.json(formattedCourse);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
});

// Update a course
export const PUT = withCors(async (request: NextRequest) => {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const courseData = await request.json();
    
    // Validate required fields
    if (!courseData.title || !courseData.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if course exists
    const existingCourse = await db.findById<Course>('courses', id);
    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      title: courseData.title,
      description: courseData.description,
      max_price: courseData.max_price || 0,
      discounted_price: courseData.discounted_price || 0,
      discount_percentage: courseData.discount_percentage || 0,
      images: courseData.images || [],
    };

    // Update course
    const [count, updatedCourse] = await db.update('courses', { id }, updateData);

    if (count === 0) {
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }

    // Update subjects if provided
    if (courseData.subjects) {
      // Delete existing subject associations
      await db.destroy('course_subjects', { course_id: id });

      // Create new subject associations
      const orderedSubjects = courseData.subjects.sort((a: { order: number }, b: { order: number }) => a.order - b.order);
      await db.createMany('course_subjects', orderedSubjects.map((subject: { id: string }) => ({
        course_id: id,
        subject_id: subject.id,
      })));
    }

    return NextResponse.json({
      success: true,
      course: updatedCourse[0]
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
});

// Delete a course
export const DELETE = withCors(async (request: NextRequest) => {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Delete course and its subject associations
    const deleted = await db.destroy('courses', { id });
    await db.destroy('course_subjects', { course_id: id });

    if (deleted === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}); 