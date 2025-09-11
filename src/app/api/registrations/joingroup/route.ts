import { NextResponse } from 'next/server';
import { WHATSAPP_GROUP_INVITE_CODE } from '@/constant';

const groupInviteLink = `https://chat.whatsapp.com/${WHATSAPP_GROUP_INVITE_CODE}`;

export async function GET() {
    try {
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
