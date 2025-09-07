import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// Webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

// Update payment status in database
async function updatePaymentStatus(
  razorpayPaymentId: string,
  status: 'captured' | 'failed' | 'authorized',
  razorpayOrderId?: string,
  razorpaySignature?: string
) {
  try {
    // Find payment by razorpay_payment_id
    const payment = await db.findOne('payments', {
        $or: [
          { razorpay_payment_id: razorpayPaymentId },
          { razorpay_order_id: razorpayOrderId }
        ]
    });

    if (!payment) {
      console.log(`Payment not found for razorpay_payment_id: ${razorpayPaymentId}`);
      return false;
    }

    // Update payment status
    const updateData: Record<string, unknown> = { status };
    
    if (razorpayOrderId) {
      updateData.razorpay_order_id = razorpayOrderId;
    }
    
    if (razorpaySignature) {
      updateData.razorpay_signature = razorpaySignature;
    }


    await db.update(
      'payments',
      { $or: [
        { razorpay_payment_id: razorpayPaymentId },
        { razorpay_order_id: razorpayOrderId }
      ] },
      updateData
    );


    // If payment is captured, update registration status to completed
    if (status === 'captured') {
      await db.update(
        'course_registrations',
        { id: payment.registration_id },
        { status: 'completed' }
      );
      console.log(`Updated registration ${payment.registration_id} to completed`);
    }

    console.log(`Updated payment ${razorpayPaymentId} status to ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(payload);
    console.log('Received webhook:', event);

    // Handle different payment events
    switch (event.event) {
      case 'payment.authorized':
        // Handle late authorized payments
        console.log('Payment authorized:', event.payload.payment.entity.id);
        await updatePaymentStatus(
          event.payload.payment.entity.id,
          'authorized',
          event.payload.payment.entity.order_id
        );
        break;

      case 'payment.captured':
        // Handle successful payments
        console.log('Payment captured:', event.payload.payment.entity.id);
        await updatePaymentStatus(
          event.payload.payment.entity.id,
          'captured',
          event.payload.payment.entity.order_id,
          event.payload.payment.entity.signature
        );
        break;

      case 'payment.failed':
        // Handle failed payments
        console.log('Payment failed:', event.payload.payment.entity);
        await updatePaymentStatus(
          event.payload.payment.entity.id,
          'failed',
          event.payload.payment.entity.order_id
        );
        break;

      case 'order.paid':
        // Handle order paid event (alternative to payment.captured)
        console.log('Order paid:', event.payload.order.entity.id);
        const paymentId = event.payload.payment?.entity?.id;
        if (paymentId) {
          await updatePaymentStatus(
            paymentId,
            'captured',
            event.payload.order.entity.id
          );
        }
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
        break;
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Handle GET requests for webhook verification (optional)
export async function GET() {
  return NextResponse.json({ 
    message: 'Razorpay webhook endpoint is active',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
