import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * WhatsApp Conversation Messages API
 * GET /api/whatsapp/conversations/[phoneNumber] - Get messages for a specific phone number
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phoneNumber: string }> }
) {
  try {
    const { phoneNumber } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get messages for this phone number (both sent and received)
    const criteria = {
      $and: [
        {
          $or: [
            { from_number: phoneNumber },
            { to_number: phoneNumber }
          ]
        },
        { business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '' }
      ]
    };

    const messages = await db.find(
      'whatsapp_messages',
      criteria,
      {
        orderBy: 'timestamp',
        order: 'ASC',
        limit,
        offset
      }
    );

    // Get total count for pagination
    const totalCount = await db.count('whatsapp_messages', criteria);

    // Get conversation metadata
    const conversationQuery = `
      SELECT 
        COUNT(*) as message_count,
        MIN(timestamp) as first_message_time,
        MAX(timestamp) as last_message_time,
        COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_count,
        COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_count
      FROM whatsapp_messages 
      WHERE (from_number = $1 OR to_number = $1) AND business_account_id = $2
    `;

    const conversationStats = await db.query(conversationQuery, [
      phoneNumber,
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
    ]);
    const stats = conversationStats[0] || {};

    return NextResponse.json({
      success: true,
      data: {
        phoneNumber,
        messages,
        stats: {
          messageCount: parseInt(String(stats.message_count)) || 0,
          inboundCount: parseInt(String(stats.inbound_count)) || 0,
          outboundCount: parseInt(String(stats.outbound_count)) || 0,
          firstMessageTime: stats.first_message_time,
          lastMessageTime: stats.last_message_time
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversation messages' },
      { status: 500 }
    );
  }
}
