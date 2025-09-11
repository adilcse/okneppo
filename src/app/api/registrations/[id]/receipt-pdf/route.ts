import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // const registration = await db.findById('course_registrations', parseInt(id, 10));
    // if (!registration) {
    //   return new NextResponse('Registration not found', { status: 404 });
    // }
    const payments = await db.find('payments', { order_number: id });
    const payment= payments.find((p: unknown) => (p as { status: string }).status === 'captured') || payments[0];
    if (!payment) {
      return new NextResponse('Payment not found', { status: 404 });
    }
    const registration = await db.findById('course_registrations', payment.registration_id as number);
    if (!registration) {
      return new NextResponse('Registration not found', { status: 404 });
    }

    // Create PDF with clean styling
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 20;

    // Colors - minimal and clean
    const textColor = [31, 41, 55]; // Gray-800
    const lightGray = [243, 244, 246]; // Gray-100
    const borderColor = [209, 213, 219]; // Gray-300

    // Header - clean and simple
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const companyName = 'Payment Receipt';
    const companyNameWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - companyNameWidth) / 2, yPos);
    
    yPos += 20;

    // Receipt info - right aligned
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order #: ${payment.order_number}`, pageWidth - margin - doc.getTextWidth(`Order #: ${payment.order_number}`), yPos);
    yPos += 8;
    doc.text(`Date: ${new Date(String(payment.created_at)).toLocaleDateString()}`, pageWidth - margin - doc.getTextWidth(`Date: ${new Date(String(payment.created_at)).toLocaleDateString()}`), yPos);

    yPos += 20;

    // Two column layout for Payment Information and Billed To
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;
    const colWidth = pageWidth / 2 - margin - 10;
    const sectionHeight = 80;

    // Payment Information Section (Left Column)
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(leftColX, yPos, colWidth, sectionHeight, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(leftColX, yPos, colWidth, sectionHeight);

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Information', leftColX + 5, yPos + 10);

    // Payment ID
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Payment ID:', leftColX + 5, yPos + 25);
    doc.setFont('helvetica', 'bold');
    doc.text(String(payment.razorpay_payment_id || payment.order_number), leftColX + 35, yPos + 25);

    // Payment Type
    doc.setFont('helvetica', 'normal');
    doc.text('Payment Type:', leftColX + 5, yPos + 35);
    doc.setFont('helvetica', 'bold');
    const paymentType = payment.payment_method === 'manual' ? 'Manual Payment' : 'Online Payment';
    doc.text(paymentType, leftColX + 35, yPos + 35);

    // Payment Status
    doc.setFont('helvetica', 'normal');
    doc.text('Status:', leftColX + 5, yPos + 45);
    doc.setFont('helvetica', 'bold');
    const status = String(payment.status).charAt(0).toUpperCase() + String(payment.status).slice(1);
    doc.text(status, leftColX + 35, yPos + 45);

    // Description
    if (payment.description || payment.error_description) {
      doc.setFont('helvetica', 'normal');
      doc.text('Description:', leftColX + 5, yPos + 55);
      const description = String(payment.description || payment.error_description || 'No description provided');
      const descriptionLines = doc.splitTextToSize(description, colWidth - 40);
      doc.text(descriptionLines, leftColX + 35, yPos + 55);
    }

    // Billed To section (Right Column)
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(rightColX, yPos, colWidth, sectionHeight, 'F');
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(rightColX, yPos, colWidth, sectionHeight);

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To', rightColX + 5, yPos + 10);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const billedToData = [
      String(registration.name || ''),
      String(registration.address || ''),
      String(registration.email || ''),
      String(registration.phone || '')
    ].filter(item => item.trim() !== '');

    let billedYPos = yPos + 25;
    billedToData.forEach((item, index) => {
      if (index === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
      }
      const lines = doc.splitTextToSize(item, colWidth - 10);
      doc.text(lines, rightColX + 5, billedYPos);
      billedYPos += lines.length * 8 + 2;
    });

    yPos += sectionHeight + 15;

    // Payment Details section - clean style
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details', margin, yPos);
    yPos += 20;

    // Course details table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Table header
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPos);
    doc.text('Amount', pageWidth - margin - 50, yPos);
    
    // Table line
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 5, pageWidth - margin, yPos + 5);
    yPos += 10;

    // Course row
    doc.setFont('helvetica', 'normal');
    const courseTitle = String(registration.course_title || '');
    const lines = doc.splitTextToSize(courseTitle, pageWidth - 2 * margin - 60);
    doc.text(lines, margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${payment.amount || ''}`, pageWidth - margin - 50, yPos);
    yPos += Math.max(lines.length * 10, 15);

    // Total row
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Paid', margin, yPos);
    doc.text(`${payment.amount || ''}`, pageWidth - margin - 50, yPos);
    yPos += 20;

    // Payment Method (Status is now in Payment Information section)
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Footer
    yPos = pageHeight - 70;
    
    yPos += 15;
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const thankYou = 'Thank you for your payment!';
    const thankYouWidth = doc.getTextWidth(thankYou);
    doc.text(thankYou, (pageWidth - thankYouWidth) / 2, yPos);

    yPos += 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const company = 'Ok Neppo';
    const companyFooterWidth = doc.getTextWidth(company);
    doc.text(company, (pageWidth - companyFooterWidth) / 2, yPos);

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=receipt-${payment.order_number}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 