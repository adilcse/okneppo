import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * WhatsApp Conversations API
 * GET /api/whatsapp/conversations - Get all conversations (grouped by phone number)
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20') || 20;
    const offset = (page - 1) * limit;

    // Get conversations with proper business account filtering - simplified and more efficient
    const conversationsQuery = `
      WITH conversation_partners AS (
        -- Get all unique phone numbers that have conversations with our business account
        SELECT DISTINCT 
          CASE 
            WHEN from_number = $2 THEN to_number 
            ELSE from_number 
          END as phone_number
        FROM whatsapp_messages 
        WHERE business_account_id = $1
          AND (from_number = $2 OR to_number = $2)
      ),
      conversation_stats AS (
        -- Get aggregated stats for each conversation
        SELECT 
          cp.phone_number,
          COUNT(wm.id) as message_count,
          MAX(wm.timestamp) as last_message_time,
          MAX(CASE WHEN wm.direction = 'inbound' THEN wm.timestamp END) as last_inbound_time,
          MAX(CASE WHEN wm.direction = 'outbound' THEN wm.timestamp END) as last_outbound_time,
          COUNT(CASE WHEN wm.direction = 'inbound' THEN 1 END) as inbound_count,
          COUNT(CASE WHEN wm.direction = 'outbound' THEN 1 END) as outbound_count
        FROM conversation_partners cp
        LEFT JOIN whatsapp_messages wm ON (
          (wm.from_number = cp.phone_number AND wm.to_number = $2) OR
          (wm.to_number = cp.phone_number AND wm.from_number = $2)
        ) AND wm.business_account_id = $1
        GROUP BY cp.phone_number
      ),
      last_messages AS (
        -- Get the most recent message content and direction for each conversation
        SELECT DISTINCT ON (cp.phone_number)
          cp.phone_number,
          wm.content as last_message_content,
          wm.direction as last_message_direction
        FROM conversation_partners cp
        LEFT JOIN whatsapp_messages wm ON (
          (wm.from_number = cp.phone_number AND wm.to_number = $2) OR
          (wm.to_number = cp.phone_number AND wm.from_number = $2)
        ) AND wm.business_account_id = $1
        ORDER BY cp.phone_number, wm.timestamp DESC
      )
      SELECT 
        cs.phone_number,
        cs.message_count,
        cs.last_message_time,
        cs.last_inbound_time,
        cs.last_outbound_time,
        lm.last_message_content,
        lm.last_message_direction,
        cs.inbound_count,
        cs.outbound_count
      FROM conversation_stats cs
      LEFT JOIN last_messages lm ON cs.phone_number = lm.phone_number
      WHERE cs.phone_number IS NOT NULL
      ORDER BY cs.last_message_time DESC NULLS LAST
      LIMIT $3 OFFSET $4
    `;

    const conversations = await db.query(conversationsQuery, [
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      limit,
      offset
    ]);

    // Get total count of conversations
    const countQuery = `
      WITH conversation_partners AS (
        SELECT DISTINCT 
          CASE 
            WHEN from_number = $2 THEN to_number 
            ELSE from_number 
          END as phone_number
        FROM whatsapp_messages 
        WHERE business_account_id = $1
          AND (from_number = $2 OR to_number = $2)
      )
      SELECT COUNT(*) as count FROM conversation_partners WHERE phone_number IS NOT NULL
    `;

    const countResult = await db.query(countQuery, [
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      process.env.WHATSAPP_PHONE_NUMBER_ID || ''
    ]);
    const totalCount = Number(countResult[0]?.count) || 0;

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching WhatsApp conversations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
