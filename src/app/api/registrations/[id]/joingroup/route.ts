
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WHATSAPP_GROUP_INVITE_CODE } from '@/constant';

const groupInviteLink = `https://chat.whatsapp.com/${WHATSAPP_GROUP_INVITE_CODE}`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
    
        const payments = await db.find('payments', { order_number: id });
        const payment= payments.find((p: unknown) => (p as { status: string }).status === 'captured') || payments[0];
        if (!payment) {
          return new NextResponse('Payment not found', { status: 404 });
        }
        const registration = await db.findById('course_registrations', payment.registration_id as number);
        if (!registration) {
          return new NextResponse('Registration not found', { status: 404 });
        }
      // Redirect to the WhatsApp group invite link
      return NextResponse.redirect(groupInviteLink, 302);
  } catch (error) {
    console.error('Failed to redirect to WhatsApp group:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to redirect to WhatsApp group' },
      { status: 500 }
    );
  }
}
