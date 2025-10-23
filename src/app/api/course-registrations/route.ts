import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { snakeCase } from '@/lib/utils';

interface SearchConditions {
  $or?: Array<{
    name?: { $like: string };
    email?: { $like: string };
    phone?: { $like: string };
  }>;
  status?: string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'DESC';
    const status = searchParams.get('status') || '';
    const courseId = searchParams.get('courseId') || '';
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build search conditions
    const searchConditions: SearchConditions = {};
    
    // Add text search conditions
    if (search) {
      searchConditions.$or = [
        { name: { $like: `%${search}%` } },
        { email: { $like: `%${search}%` } },
        { phone: { $like: `%${search}%` } }
      ];
    }
    
    // Add status filter
    if (status && status !== 'all') {
      searchConditions.status = status;
    }
    
    // Add course filter
    if (courseId && courseId !== 'all') {
      searchConditions.course_id = parseInt(courseId, 10);
    }
    
    // Log the search conditions for debugging
    console.log('Search conditions:', JSON.stringify(searchConditions, null, 2));
    
    // Get total count for pagination (without JOIN for accurate count)
    const totalCount = await db.count('course_registrations', searchConditions);
    
    // Get paginated registrations (simple query for better performance)
    const registrations = await db.find('course_registrations', searchConditions, {
      orderBy: snakeCase(sortBy),
      order: sortOrder,
      limit,
      offset
    });
    
    // Format the results
    const formattedRegistrations = registrations.map(reg => ({
      id: reg.id,
      name: reg.name,
      address: reg.address,
      phone: reg.phone,
      email: reg.email,
      courseId: reg.course_id,
      courseTitle: reg.course_title,
      amountDue: reg.amount_due,
      status: reg.status,
      orderNumber: reg.order_number || null,
      createdAt: reg.created_at,
      updatedAt: reg.updated_at,
    }));
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      data: formattedRegistrations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 