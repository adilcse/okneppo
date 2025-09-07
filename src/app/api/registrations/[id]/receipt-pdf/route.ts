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

    // Create PDF with better styling
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 20;

    // Colors
    const primaryColor = [41, 128, 185]; // Professional blue
    const secondaryColor = [52, 73, 94]; // Dark gray
    const lightGray = [236, 240, 241];
    const successColor = [39, 174, 96]; // Green

    // Header with background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const companyName = 'OKNEPPO';
    const companyWidth = doc.getTextWidth(companyName);
    doc.text(companyName, (pageWidth - companyWidth) / 2, 25);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const subtitle = 'Course Registration Receipt';
    const subtitleWidth = doc.getTextWidth(subtitle);
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 35);

    yPos = 60;

    // Receipt info box
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order #: ${payment.order_number}`, margin + 5, yPos + 10);
    doc.text(`Date: ${new Date(String(payment.created_at)).toLocaleDateString()}`, margin + 5, yPos + 20);

    // Status badge
    const status = String(payment.status).toUpperCase();
    const statusWidth = doc.getTextWidth(status) + 10;
    const statusX = pageWidth - margin - statusWidth - 5;
    
    if (status === 'CAPTURED' || status === 'SUCCESS') {
      doc.setFillColor(successColor[0], successColor[1], successColor[2]);
    } else {
      doc.setFillColor(231, 76, 60); // Red for other statuses
    }
    doc.roundedRect(statusX, yPos + 5, statusWidth, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(status, statusX + 5, yPos + 14);

    yPos += 40;

    // Two column layout
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;
    const colWidth = pageWidth / 2 - margin - 10;

    // Billed To section
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(leftColX, yPos, colWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO', leftColX + 5, yPos + 10);

    yPos += 20;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const billedToData = [
      String(registration.name || ''),
      String(registration.address || ''),
      String(registration.email || ''),
      String(registration.phone || '')
    ].filter(item => item.trim() !== '');

    billedToData.forEach((item, index) => {
      if (index === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }
      doc.text(item, leftColX + 5, yPos);
      yPos += 12;
    });

    // Reset yPos for right column
    yPos -= billedToData.length * 12 + 20;

    // Payment Details section
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(rightColX, yPos, colWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', rightColX + 5, yPos + 10);

    yPos += 20;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    // Course details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Course:', rightColX + 5, yPos);
    doc.setFont('helvetica', 'normal');
    const courseTitle = String(registration.course_title || '');
    const lines = doc.splitTextToSize(courseTitle, colWidth - 10);
    doc.text(lines, rightColX + 5, yPos + 10);
    yPos += 10 + (lines.length * 10);

    // Amount
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Amount Paid:', rightColX + 5, yPos);
    doc.setFontSize(14);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text(`${payment.amount || ''} INR`, rightColX + 5, yPos + 12);

    // Transaction ID if available
    if (payment.transaction_id) {
      yPos += 25;
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Transaction ID:', rightColX + 5, yPos);
      doc.text(String(payment.transaction_id), rightColX + 5, yPos + 8);
    }

    // Summary box
    yPos = Math.max(yPos + 40, 180);
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 30, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 30);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY', margin + 5, yPos + 12);
    
    const totalText = `Total Amount: ${payment.amount || ''} INR`;
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.setFontSize(14);
    doc.text(totalText, margin + 5, yPos + 20);

    // Footer
    yPos = pageHeight - 50;
    
    // Divider line
    doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 15;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const thankYou = 'Thank you for your enrollment!';
    const thankYouWidth = doc.getTextWidth(thankYou);
    doc.text(thankYou, (pageWidth - thankYouWidth) / 2, yPos);

    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const contact = 'For any queries, please contact us at okneppo@gmail.com';
    const contactWidth = doc.getTextWidth(contact);
    doc.text(contact, (pageWidth - contactWidth) / 2, yPos);

    yPos += 8;
    const website = 'www.okneppo.in';
    const websiteWidth = doc.getTextWidth(website);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(website, (pageWidth - websiteWidth) / 2, yPos);

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