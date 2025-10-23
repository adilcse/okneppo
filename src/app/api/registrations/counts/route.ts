import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || '';
    
    // Build base filter conditions
    const baseFilter: Record<string, unknown> = {};
    
    // Add course filter if provided
    if (courseId && courseId !== 'all') {
      baseFilter.course_id = parseInt(courseId, 10);
    }
    
    // Get counts for each status
    const [allCount, pendingCount, completedCount, failedCount, cancelledCount] = await Promise.all([
      db.count('course_registrations', baseFilter),
      db.count('course_registrations', { ...baseFilter, status: 'pending' }),
      db.count('course_registrations', { ...baseFilter, status: 'completed' }),
      db.count('course_registrations', { ...baseFilter, status: 'failed' }),
      db.count('course_registrations', { ...baseFilter, status: 'cancelled' })
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        all: allCount,
        pending: pendingCount,
        completed: completedCount,
        failed: failedCount,
        cancelled: cancelledCount
      }
    });

  } catch (error) {
    console.error('Error fetching registration counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registration counts' },
      { status: 500 }
    );
  }
}
