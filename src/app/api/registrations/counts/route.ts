import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Get counts for each status
    const [allCount, pendingCount, completedCount, failedCount, cancelledCount] = await Promise.all([
      db.count('course_registrations', {}),
      db.count('course_registrations', { status: 'pending' }),
      db.count('course_registrations', { status: 'completed' }),
      db.count('course_registrations', { status: 'failed' }),
      db.count('course_registrations', { status: 'cancelled' })
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
