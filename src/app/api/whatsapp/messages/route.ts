import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { whatsappService } from '@/lib/whatsapp';

/**
 * WhatsApp Messages API
 * GET /api/whatsapp/messages - Get all messages with pagination and filtering
 * POST /api/whatsapp/messages - Send a new message
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const direction = searchParams.get('direction'); // 'inbound' or 'outbound'
    const phoneNumber = searchParams.get('phoneNumber');
    const offset = (page - 1) * limit;

    // Build filter criteria
    const criteria: any = {};
    if (direction) {
      criteria.direction = direction;
    }
    if (phoneNumber) {
      criteria.$or = [
        { from_number: phoneNumber },
        { to_number: phoneNumber }
      ];
    }

    // Get messages with pagination
    const messages = await db.find(
      'whatsapp_messages',
      criteria,
      {
        orderBy: 'timestamp',
        order: 'DESC',
        limit,
        offset
      }
    );

    // Get total count for pagination
    const totalCount = await db.count('whatsapp_messages', criteria);

    return NextResponse.json({
      success: true,
      data: {
        messages,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, message, type = 'text' } = await req.json();

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // Send message via WhatsApp service
    const result = await whatsappService.sendMessage({ to, message, type });

    if (result.success && result.messageId) {
      // Store the sent message in database
      const messageData = {
        message_id: result.messageId,
        from_number: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        to_number: to,
        business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        message_type: type,
        content: message,
        direction: 'outbound' as const,
        status: 'sent',
        timestamp: new Date(),
        metadata: {
          sent_via: 'admin_panel'
        }
      };

      await db.upsert('whatsapp_messages', messageData, ['message_id'], ['status', 'timestamp', 'updated_at']);

      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: result.messageId,
          to,
          message,
          type
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
