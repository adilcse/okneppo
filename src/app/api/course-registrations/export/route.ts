import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SearchConditions {
  $or?: Array<{
    name?: { $like: string };
    email?: { $like: string };
    phone?: { $like: string };
  }>;
  status?: string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const courseId = searchParams.get('courseId') || '';
    
    // Build search conditions
    const searchConditions: SearchConditions = {};
    
    // Add text search conditions
    if (search) {
      searchConditions.$or = [
        { name: { $like: `%${search}%` } },
        { email: { $like: `%${search}%` } },
        { phone: { $like: `%${search}%` } }
      ];
    }
    
    // Add status filter
    if (status && status !== 'all') {
      searchConditions.status = status;
    }
    
    // Add course filter
    if (courseId && courseId !== 'all') {
      searchConditions.course_id = parseInt(courseId, 10);
    }
    
    // Get all registrations matching the filters (no pagination)
    const registrations = await db.find('course_registrations', searchConditions, {
      orderBy: 'created_at',
      order: 'DESC',
    });
    
    // Format as CSV
    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Address',
      'Course ID',
      'Course Title',
      'Amount Due',
      'Status',
      'Order Number',
      'Highest Qualification',
      'Profession',
      'Date of Birth',
      'Aadhar Number',
      'Terms Accepted',
      'Created At',
      'Updated At'
    ];
    
    const csvRows = [headers.join(',')];
    
    for (const reg of registrations) {
      const name = String(reg.name || '');
      const email = String(reg.email || '');
      const address = String(reg.address || '');
      const courseTitle = String(reg.course_title || '');
      const highestQualification = String(reg.highest_qualification || '');
      const profession = String(reg.profession || '');
      
      const row = [
        reg.id,
        `"${name.replace(/"/g, '""')}"`,
        `"${email.replace(/"/g, '""')}"`,
        reg.phone || '',
        `"${address.replace(/"/g, '""')}"`,
        reg.course_id || '',
        `"${courseTitle.replace(/"/g, '""')}"`,
        reg.amount_due || 0,
        reg.status || '',
        reg.order_number || '',
        `"${highestQualification.replace(/"/g, '""')}"`,
        `"${profession.replace(/"/g, '""')}"`,
        reg.date_of_birth || '',
        reg.aadhar_number || '',
        reg.terms_accepted ? 'Yes' : 'No',
        reg.created_at || '',
        reg.updated_at || ''
      ];
      csvRows.push(row.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Generate filename with timestamp and filters
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `registrations_${timestamp}`;
    
    if (courseId && courseId !== 'all' && registrations.length > 0) {
      const course = String(registrations[0]?.course_title || courseId);
      filename += `_${course.replace(/[^a-z0-9]/gi, '_')}`;
    }
    
    if (status && status !== 'all') {
      filename += `_${status}`;
    }
    
    filename += '.csv';
    
    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting registrations:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

