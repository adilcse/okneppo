import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp';
import { WHATSAPP_GROUP_INVITE_CODE } from '@/constant';

/**
 * Test endpoint for WhatsApp integration
 * POST /api/whatsapp/test
 * Body: { phone: string, name: string, courseTitle: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { phone, name, courseTitle } = await req.json();

    if (!phone || !name || !courseTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, name, courseTitle' },
        { status: 400 }
      );
    }

    if (!WHATSAPP_GROUP_INVITE_CODE) {
      return NextResponse.json(
        { error: 'WhatsApp group invite code not configured' },
        { status: 500 }
      );
    }

    const groupInviteLink = `https://chat.whatsapp.com/${WHATSAPP_GROUP_INVITE_CODE}`;

    const result = await whatsappService.sendRegistrationWelcomeMessage(
      phone,
      name,
      courseTitle,
      groupInviteLink
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error testing WhatsApp integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
