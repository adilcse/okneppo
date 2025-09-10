import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/lib/whatsapp';
import { WHATSAPP_GROUP_INVITE_CODE } from '@/constant';

/**
 * Send WhatsApp welcome message for a specific registration
 * POST /api/whatsapp/send-welcome
 * Body: { registrationId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { registrationId } = await req.json();

    if (!registrationId) {
      return NextResponse.json(
        { error: 'Missing required field: registrationId' },
        { status: 400 }
      );
    }

    if (!WHATSAPP_GROUP_INVITE_CODE) {
      return NextResponse.json(
        { error: 'WhatsApp group invite code not configured' },
        { status: 500 }
      );
    }

    // Import db here to avoid circular dependencies
    const { db } = await import('@/lib/db');
    
    // Get registration details
    const registration = await db.findOne('course_registrations', { id: registrationId });
    
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    const groupInviteLink = `https://chat.whatsapp.com/${WHATSAPP_GROUP_INVITE_CODE}`;

    const result = await whatsappService.sendRegistrationWelcomeMessage(
      registration.phone as string,
      registration.name as string,
      registration.course_title as string,
      groupInviteLink
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp welcome message sent successfully',
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending WhatsApp welcome message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
