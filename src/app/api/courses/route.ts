import { NextRequest, NextResponse } from 'next/server';
import { db, FilterCriteria } from '@/lib/db';
import { withCors } from '@/lib/cors';
import { Course, Subject } from '@/types/course';

// Get all courses with optional pagination and filtering
export const GET = withCors(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build criteria object for filtering
    const criteria: FilterCriteria = {};
    if (search) {
      criteria.title = { $like: `%${search}%` };
    }
    
    // Get total count for pagination
    const totalCount = await db.count('courses', criteria);
    
    // Execute query with pagination and JOIN
    const options = {
      limit,
      offset,
      orderBy: 'courses.created_at',
      order: 'DESC' as const,
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
    
    // Execute the query
    const courses = await db.find<Course & { subject_ids?: string }>('courses', criteria, options);
    
    // Process the results
    const coursesWithSubjects = courses.map(course => {
      const subjectIds = course.subject_ids ? course.subject_ids.split(',').map(Number) : [];
      return {
        ...course,
        subject_ids: undefined, // Remove the temporary field
        subjects: subjectIds.length > 0 ? subjectIds : []
      };
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      courses: coursesWithSubjects,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
});

// Create a new course
export const POST = withCors(async (request: NextRequest) => {
  try {
    // Parse request body
    const courseData = await request.json();
    
    // Validate required fields
    if (!courseData.title || !courseData.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new course
    const newCourse = await db.create<Course>('courses', {
      title: courseData.title,
      description: courseData.description,
      max_price: courseData.max_price || 0,
      discounted_price: courseData.discounted_price || 0,
      discount_percentage: courseData.discount_percentage || 0,
      images: courseData.images || [],
    });

    if (courseData.subjects) {
      const orderedSubjects = courseData.subjects.sort((a: { order: number, id: string }, b: { order: number, id: string }) => a.order - b.order);
      await db.createMany('course_subjects', orderedSubjects.map((subject: { id: string }) => ({
        course_id: newCourse.id,
        subject_id: subject.id
      })));
    }

    return NextResponse.json({
      success: true,
      course: { ...newCourse }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
});

export async function GET_SUBJECTS() {
  try {
    const courses = await db.find<Course>('courses', {}, {
      orderBy: 'created_at',
      order: 'DESC'
    });

    // Fetch subjects for each course
    const coursesWithSubjects = await Promise.all(
      courses.map(async (course) => {
        const subjects = await db.find<Subject>('subjects', { course_id: course.id });
        return { ...course, subjects };
      })
    );

    return NextResponse.json(coursesWithSubjects);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
} 