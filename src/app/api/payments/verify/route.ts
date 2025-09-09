import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { PaymentStatus } from '@/models/Payment';
import { RegistrationStatus } from '@/models/CourseRegistration';
import { whatsappService } from '@/lib/whatsapp';
import { WHATSAPP_GROUP_INVITE_CODE } from '@/constant';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const [updatedPaymentCount, updatedPayments] = await db.update(
      'payments',
      {
        razorpay_order_id: razorpay_order_id, 
        $or: [
          { razorpay_payment_id: razorpay_payment_id },
          { razorpay_payment_id: 'IS_NULL' }
        ]
   },
      {
        razorpay_payment_id,
        razorpay_signature,
        status: PaymentStatus.CAPTURED,
      }
    );

    if (updatedPaymentCount === 0) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const registration_id = updatedPayments[0].registration_id;

    // update the registration status to completed
    await db.update(
      'course_registrations',
      { id: registration_id },
      { status: RegistrationStatus.COMPLETED }
    );

    // Send WhatsApp welcome message with group invite
    try {
      // Get registration details for WhatsApp message
      const registration = await db.findOne('course_registrations', { id: registration_id });
      
      if (registration && WHATSAPP_GROUP_INVITE_CODE) {
        const groupInviteLink = `https://chat.whatsapp.com/${WHATSAPP_GROUP_INVITE_CODE}`;
        
        const whatsappResult = await whatsappService.sendRegistrationWelcomeMessage(
          registration.phone as string,
          registration.name as string,
          registration.course_title as string,
          groupInviteLink
        );

        if (whatsappResult.success) {
          console.log('WhatsApp welcome message sent successfully:', whatsappResult.messageId);
        } else {
          console.error('Failed to send WhatsApp welcome message:', whatsappResult.error);
        }
      }
    } catch (whatsappError) {
      // Don't fail the payment verification if WhatsApp fails
      console.error('Error sending WhatsApp message:', whatsappError);
    }

    return NextResponse.json({ success: true, registration_id }, { status: 200 });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
} 