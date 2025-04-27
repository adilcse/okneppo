import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
let storage: Storage;
try {
  // If GCP_SERVICE_ACCOUNT is provided, use it
  const serviceAccount = process.env.GCP_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.GCP_SERVICE_ACCOUNT)
    : undefined;

  if (serviceAccount) {
    storage = new Storage({
      credentials: serviceAccount,
      projectId: serviceAccount.project_id
    });
    console.log('Google Cloud Storage initialized with service account');
  } else {
    // Fall back to application default credentials or environment variables
    storage = new Storage();
    console.log('Google Cloud Storage initialized with default credentials');
  }
} catch (err) {
  const error = err as Error;
  console.error('Google Cloud Storage initialization error:', error.message);
  storage = new Storage(); // Try with default credentials as fallback
}

// Get the bucket name from environment variable
const bucketName = process.env.GCP_STORAGE_BUCKET || '';

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
    } catch (err) {
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