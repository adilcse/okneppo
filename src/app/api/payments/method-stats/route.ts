import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30days';

    // Calculate date filter
    let dateFilter = '';

    if (period === '7days') {
      dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'7 days\'';
    } else if (period === '30days') {
      dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'30 days\'';
    }
    // For 'all', no date filter is applied

    // Query to get payment method statistics
    const methodStatsQuery = `
      SELECT 
        p.payment_method,
        COUNT(*) as payment_count,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount
      FROM payments p
      WHERE p.status = 'captured'
      ${dateFilter}
      GROUP BY p.payment_method
      ORDER BY total_amount DESC
    `;

    const methodStats = await db.query(methodStatsQuery);

    // Calculate total stats
    const totalStatsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount
      FROM payments p
      WHERE p.status = 'captured'
      ${dateFilter}
    `;

    const totalStatsResult = await db.query(totalStatsQuery);
    const totalStats = totalStatsResult[0] || {
      total_payments: 0,
      total_amount: 0,
      average_amount: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        methodStats: methodStats.map(stat => ({
          payment_method: stat.payment_method,
          payment_count: parseInt(stat.payment_count as string),
          total_amount: parseFloat(stat.total_amount as string),
          average_amount: parseFloat(stat.average_amount as string)
        })),
        totalStats: {
          totalPayments: parseInt(totalStats.total_payments as string),
          totalAmount: parseFloat(totalStats.total_amount as string),
          averageAmount: parseFloat(totalStats.average_amount as string)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching method payment stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch method payment statistics' },
      { status: 500 }
    );
  }
}
