import { storage, bucketName } from '@/lib/gcpStorage';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Validate GCP config
    if (!bucketName) {
      return NextResponse.json(
        { error: 'Google Cloud Storage is not properly configured - bucket name missing' },
        { status: 500 }
      );
    }

    // Get the bucket reference
    const bucket = storage.bucket(bucketName);
    
    // Get the image URL from the request body
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL provided' },
        { status: 400 }
      );
    }
    
    // Extract the file path from the URL
    // Format: https://storage.googleapis.com/bucketName/path/to/file.jpg
    let filePath;
    try {
      const url = new URL(imageUrl);
      if (url.hostname === 'storage.googleapis.com') {
        // Remove the leading slash and the bucket name from the pathname
        const pathWithBucket = url.pathname.substring(1); // Remove leading slash
        filePath = pathWithBucket.substring(pathWithBucket.indexOf('/') + 1);
      } else {
        throw new Error('Invalid Google Cloud Storage URL format');
      }
    } catch (error) {
      console.error('Error extracting file path from URL:', error);
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Could not extract file path from URL' },
        { status: 400 }
      );
    }
    
    // Delete the file from the bucket
    const file = bucket.file(filePath);
    await file.delete();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Image deleted successfully',
      deletedPath: filePath
    });
  } catch (error: unknown) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 