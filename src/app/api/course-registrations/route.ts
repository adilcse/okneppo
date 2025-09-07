import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build search conditions
    const searchConditions = search ? {
      $or: [
        { name: { $like: `%${search}%` } },
        { email: { $like: `%${search}%` } },
        { phone: { $like: `%${search}%` } },
        { course_title: { $like: `%${search}%` } }
      ]
    } : {};
    
    // Get total count for pagination (without JOIN for accurate count)
    const totalCount = await db.count('course_registrations', searchConditions);
    
    // Get paginated registrations (simple query for better performance)
    const registrations = await db.findAll('course_registrations', {
      ...searchConditions,
      orderBy: 'created_at',
      order: 'DESC',
      limit,
      offset
    });
    
    // Get latest payment for each registration (efficient batch query)
    const registrationIds = registrations.map(reg => reg.id);
    const latestPayments: Record<number, string | null> = {};
    
    if (registrationIds.length > 0) {
      const payments = await db.find('payments', 
        { registration_id: { $in: registrationIds } },
        {
          select: ['registration_id', 'order_number'],
          distinct: true
        }
      );
      
      // Group by registration_id and take the latest (first due to DESC order)
      for (const payment of payments) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const regId = (payment as any).registration_id as number;
        if (!latestPayments[regId]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          latestPayments[regId] = (payment as any).order_number as string;
        }
      }
    }
    

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
      orderNumber: latestPayments[reg.id as number] || null,
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