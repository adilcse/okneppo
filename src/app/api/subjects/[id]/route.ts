import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withCors } from '@/lib/cors';

// Get a single subject by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async () => {
    try {
      const { id } = await params;
    
      if (!id) {
        return NextResponse.json(
          { error: 'Subject ID is required' },
          { status: 400 }
        );
      }

      const subject = await db.findById('subjects', id);
      
      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(subject);
    } catch (error) {
      console.error('Error fetching subject:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subject' },
        { status: 500 }
      );
    }
  })(request);
}

// Update a subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async () => {
    try {
      const { id } = await params;
      const subjectData = await request.json();

      if (!id) {
        return NextResponse.json(
          { error: 'Subject ID is required' },
          { status: 400 }
        );
      }

      // Validate required fields
      if (!subjectData.title) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Prepare update data
      const updateData = {
        title: subjectData.title,
        description: subjectData.description || '',
        images: subjectData.images || [],
      };

      const [count, updatedSubject] = await db.update('subjects', { id }, updateData);

      if (count === 0) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        subject: updatedSubject[0]
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      return NextResponse.json(
        { error: 'Failed to update subject' },
        { status: 500 }
      );
    }
  })(request);
}

// Delete a subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withCors(async () => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { error: 'Subject ID is required' },
          { status: 400 }
        );
      }

      const deleted = await db.destroy('subjects', { id });
      await db.destroy('course_subjects', { subject_id: id });

      if (deleted === 0) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      return NextResponse.json(
        { error: 'Failed to delete subject' },
        { status: 500 }
      );
    }
  })(request);
} 