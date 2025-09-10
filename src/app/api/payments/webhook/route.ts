import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendWhatsAppWelcomeMessageAfterPayment } from '@/lib/whatsapp';

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

// Extract payment data from webhook payload
function extractPaymentData(paymentEntity: Record<string, unknown>) {
  return {
    razorpay_payment_id: paymentEntity.id || null,
    invoice_id: paymentEntity.invoice_id || null,
    payment_method: paymentEntity.method || null,
    amount_refunded: paymentEntity.amount_refunded ? (Number(paymentEntity.amount_refunded) / 100) : 0,
    refund_status: paymentEntity.refund_status || null,
    description: paymentEntity.description || null,
    card_id: paymentEntity.card_id || null,
    bank: paymentEntity.bank || null,
    wallet: paymentEntity.wallet || null,
    vpa: paymentEntity.vpa || null,
    captured: paymentEntity.captured || false,
    fee: paymentEntity.fee ? (Number(paymentEntity.fee) / 100) : 0,
    tax: paymentEntity.tax ? (Number(paymentEntity.tax) / 100) : 0,
    error_code: paymentEntity.error_code || null,
    error_description: paymentEntity.error_description || null,
    error_source: paymentEntity.error_source || null,
    error_step: paymentEntity.error_step || null,
    error_reason: paymentEntity.error_reason || null,
    acquirer_data: paymentEntity.acquirer_data || null,
  };
}

// Update payment status in database
async function updatePaymentStatus(
  razorpayPaymentId: string,
  status: 'captured' | 'failed' | 'authorized',
  razorpayOrderId?: string,
  razorpaySignature?: string,
  paymentEntity?: Record<string, unknown>
) {
  try {
    // Find payment by razorpay_payment_id
    let payment = await db.findOne('payments', {
        razorpay_order_id: razorpayOrderId, 
        $or: [
          { razorpay_payment_id: razorpayPaymentId },
          { razorpay_payment_id: 'IS_NULL' }
        ]
   });
   let isNewPayment = false;

    if (!payment) {
      console.log(`Payment not found for razorpay_payment_id: ${razorpayPaymentId}`);
      const newPayment = await db.findOne('payments', {
        razorpay_order_id: razorpayOrderId,
      });
      if (newPayment) {
        isNewPayment = true;
        payment = newPayment;
      } else {
        return false;
      }
    }


    // Update payment status and additional data
    const updateData: Record<string, unknown> = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (razorpayOrderId) {
      updateData.razorpay_order_id = razorpayOrderId;
    }
    
    if (razorpaySignature) {
      updateData.razorpay_signature = razorpaySignature;
    }

    // Add additional payment data if available
    if (paymentEntity) {
      const additionalData = extractPaymentData(paymentEntity);
      Object.assign(updateData, additionalData);
    }

    if (!isNewPayment) { 
        await db.update(
            'payments',
            {
              razorpay_order_id: razorpayOrderId, 
              $or: [
                  { razorpay_payment_id: razorpayPaymentId },
                  { razorpay_payment_id: 'IS_NULL' }
                ]
         },
            updateData
          );
    } else {
        const newPaymentData = {
                registration_id: payment.registration_id,
                order_number: payment.order_number,
                razorpay_order_id: payment.razorpay_order_id,
                amount: payment.amount,
                currency: payment.currency,
                status: 'created',
                coupon_code: payment.coupon_code,
                ...updateData
        };
        await db.create('payments', newPaymentData);
    }


    // If payment is captured, update registration status to completed
    if (status === 'captured') {
      await db.update(
        'course_registrations',
        { id: payment.registration_id },
        { status: 'completed' }
      );
      sendWhatsAppWelcomeMessageAfterPayment(payment.registration_id as number);

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

    console.log('Webhook event :', event.payload?.payment?.entity);


    // Handle different payment events
    switch (event.event) {
      case 'payment.authorized':
        // Handle late authorized payments
        console.log('Payment authorized:', event.payload.payment.entity.id);
        await updatePaymentStatus(
          event.payload.payment.entity.id,
          'authorized',
          event.payload.payment.entity.order_id,
          signature,
          event.payload.payment.entity
        );
        break;

      case 'payment.captured':
        // Handle successful payments
        console.log('Payment captured:', event.payload.payment.entity.id);
        await updatePaymentStatus(
          event.payload.payment.entity.id,
          'captured',
          event.payload.payment.entity.order_id,
          signature,
          event.payload.payment.entity
        );
        break;

      case 'payment.failed':
        // Handle failed payments
        await updatePaymentStatus(
          event.payload.payment.entity.id,
          'failed',
          event.payload.payment.entity.order_id,
          signature,
          event.payload.payment.entity
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
            event.payload.order.entity.id,
            signature,
            event.payload.payment?.entity
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
