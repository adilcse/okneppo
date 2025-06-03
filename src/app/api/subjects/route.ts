import { NextRequest, NextResponse } from 'next/server';
import { db, FilterCriteria } from '@/lib/db';
import { withCors } from '@/lib/cors';
import { Subject } from '@/types/course';

// Get all subjects with optional pagination and filtering
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
    const totalCount = await db.count('subjects', criteria);
    
    // Execute query with pagination and JOIN
    const options = {
      limit,
      offset,
      orderBy: 'subjects.created_at',
      order: 'DESC' as const,
      join: {
        table: 'course_subjects',
        on: 'subjects.id = course_subjects.subject_id',
        type: 'LEFT' as const
      },
      select: [
        'subjects.*',
        'STRING_AGG(DISTINCT course_subjects.course_id::text, \',\') as course_ids'
      ],
      groupBy: 'subjects.id'
    };
    
    // Execute the query
    const subjects = await db.find<Subject & { course_ids?: string }>('subjects', criteria, options);
    
    // Process the results
    const subjectsWithCourses = subjects.map(subject => {
      const courseIds = subject.course_ids ? subject.course_ids.split(',').map(Number) : [];
      return {
        ...subject,
        course_ids: undefined, // Remove the temporary field
        courses: courseIds.length > 0 ? courseIds : []
      };
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      subjects: subjectsWithCourses,
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
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
});

// Create a new subject
export const POST = withCors(async (request: NextRequest) => {
  try {
    // Parse request body
    const subjectData = await request.json();
    
    // Validate required fields
    if (!subjectData.title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new subject
    const newSubject = await db.create<Subject>('subjects', {
      title: subjectData.title,
      description: subjectData.description || '',
      images: subjectData.images || [],
    });
    
    return NextResponse.json({
      success: true,
      subject: { ...newSubject }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}); 