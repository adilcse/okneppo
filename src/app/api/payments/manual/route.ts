import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentCreationAttributes, PaymentStatus } from '@/models/Payment';
import { RegistrationStatus } from '@/models/CourseRegistration';
import { sendWhatsAppWelcomeMessageAfterPayment } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const { registration_id, amount, note } = await req.json();

    if (!registration_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    // Check if registration exists
    const registration = await db.findOne('course_registrations', { id: registration_id });
    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const paymentData: PaymentCreationAttributes = {
      registration_id,
      amount,
      currency: 'INR',
      status: PaymentStatus.CAPTURED, // Manual payments are immediately captured
      payment_method: 'manual',
      description: note || 'Manual payment added by admin',
      captured: true,
    };

    const payment = await db.create('payments', paymentData);

    // Update registration status to completed if it's not already
    if (registration.status !== RegistrationStatus.COMPLETED) {
      await db.update(
        'course_registrations',
        { id: registration_id },
        { status: RegistrationStatus.COMPLETED }
      );

      // Send WhatsApp welcome message
      try {
        await sendWhatsAppWelcomeMessageAfterPayment(registration_id);
      } catch (whatsappError) {
        console.error('Error sending WhatsApp message:', whatsappError);
        // Don't fail the payment creation if WhatsApp fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      payment,
      message: 'Manual payment added successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating manual payment:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
