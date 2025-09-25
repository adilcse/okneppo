import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all'; // '7days', '30days', 'all'
    
    // Calculate date range based on period
    let dateFilter = '';
    const dateParams: string[] = [];
    
    if (period === '7days') {
      dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'7 days\'';
    } else if (period === '30days') {
      dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'30 days\'';
    }
    
    // Query to get payment amounts by course
    const query = `
      SELECT 
        cr.course_title,
        cr.course_id,
        COUNT(p.id) as payment_count,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount
      FROM payments p
      JOIN course_registrations cr ON p.registration_id = cr.id
      WHERE p.status = 'captured'
      ${dateFilter}
      GROUP BY cr.course_id, cr.course_title
      ORDER BY total_amount DESC
    `;
    
    const result = await db.query(query, dateParams);
    
    // Get total stats for the period
    const totalQuery = `
      SELECT 
        COUNT(p.id) as total_payments,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount
      FROM payments p
      WHERE p.status = 'captured'
      ${dateFilter}
    `;
    
    const totalResult = await db.query(totalQuery, dateParams);
    const totalStats = totalResult[0] || { total_payments: 0, total_amount: 0, average_amount: 0 };
    
    return NextResponse.json({
      success: true,
      data: {
        courseStats: result,
        totalStats: {
          totalPayments: Number(totalStats.total_payments) || 0,
          totalAmount: Number(totalStats.total_amount) || 0,
          averageAmount: Number(totalStats.average_amount) || 0
        },
        period
      }
    });

  } catch (error) {
    console.error('Error fetching payment course stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment course stats' },
      { status: 500 }
    );
  }
}
