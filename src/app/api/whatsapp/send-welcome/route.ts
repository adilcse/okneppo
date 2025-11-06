import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppWelcomeMessageAfterPayment } from '@/lib/whatsapp';
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

    const whatsappResult = await sendWhatsAppWelcomeMessageAfterPayment(registrationId)

    if (whatsappResult.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp welcome message sent successfully',
        messageId: whatsappResult.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: whatsappResult.error
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
