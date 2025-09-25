import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30days'; // '7days', '30days', 'all'
    
    // Calculate date range based on period
    let dateFilter = '';
    
    if (period === '7days') {
      dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'7 days\'';
    } else if (period === '30days') {
      dateFilter = 'AND p.created_at >= NOW() - INTERVAL \'30 days\'';
    }
    
    // Query to get daily payment data by status
    const dailyQuery = `
      SELECT 
        DATE(p.created_at) as payment_date,
        p.status,
        COUNT(p.id) as payment_count,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount
      FROM payments p
      ${dateFilter ? `WHERE p.created_at >= NOW() - INTERVAL '${period === '7days' ? '7' : '30'} days'` : ''}
      GROUP BY DATE(p.created_at), p.status
      ORDER BY payment_date ASC, p.status
    `;
    
    const dailyResult = await db.query(dailyQuery);
    
    // Query to get payment amounts by status
    const statusQuery = `
      SELECT 
        p.status,
        COUNT(p.id) as payment_count,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount
      FROM payments p
      ${dateFilter ? `WHERE p.created_at >= NOW() - INTERVAL '${period === '7days' ? '7' : '30'} days'` : ''}
      GROUP BY p.status
      ORDER BY total_amount DESC
    `;
    
    const statusResult = await db.query(statusQuery);
    
    // Get total stats for the period
    const totalQuery = `
      SELECT 
        COUNT(p.id) as total_payments,
        SUM(CASE WHEN p.status = 'captured' THEN p.amount ELSE 0 END) as captured_amount,
        SUM(CASE WHEN p.status = 'failed' THEN p.amount ELSE 0 END) as failed_amount,
        SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount,
        AVG(CASE WHEN p.status = 'captured' THEN p.amount ELSE NULL END) as average_captured_amount
      FROM payments p
      ${dateFilter ? `WHERE p.created_at >= NOW() - INTERVAL '${period === '7days' ? '7' : '30'} days'` : ''}
    `;
    
    const totalResult = await db.query(totalQuery);
    const totalStats = totalResult[0] || { 
      total_payments: 0, 
      captured_amount: 0, 
      failed_amount: 0, 
      pending_amount: 0,
      average_captured_amount: 0 
    };
    
    return NextResponse.json({
      success: true,
      data: {
        dailyStats: dailyResult,
        statusStats: statusResult,
        totalStats: {
          totalPayments: Number(totalStats.total_payments) || 0,
          capturedAmount: Number(totalStats.captured_amount) || 0,
          failedAmount: Number(totalStats.failed_amount) || 0,
          pendingAmount: Number(totalStats.pending_amount) || 0,
          averageCapturedAmount: Number(totalStats.average_captured_amount) || 0
        },
        period
      }
    });

  } catch (error) {
    console.error('Error fetching daily payment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily payment stats' },
      { status: 500 }
    );
  }
}
