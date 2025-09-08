import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';
import { bucketName, storage } from '@/lib/gcpStorage';
// WebP conversion quality (0-100)
const WEBP_QUALITY = 95;
// Maximum width for resized images (maintain aspect ratio)
const MAX_WIDTH = 1200;
// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Optimizes an image by:
 * 1. Converting to WebP format for better compression
 * 2. Resizing large images to a reasonable max width
 * 3. Stripping metadata to reduce file size
 */
async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    // Initialize sharp with the input buffer
    let imageProcessor = sharp(buffer);
    
    // Get image metadata to check dimensions
    const metadata = await imageProcessor.metadata();
    
    // Resize if the image is wider than MAX_WIDTH
    if (metadata.width && metadata.width > MAX_WIDTH) {
      imageProcessor = imageProcessor.resize({
        width: MAX_WIDTH,
        withoutEnlargement: true, // Don't enlarge if smaller than MAX_WIDTH
      });
    }
    
    // Convert to WebP with optimal settings
    return await imageProcessor
      .webp({
        quality: WEBP_QUALITY,
        effort: 4, // Higher compression effort (0-6)
        smartSubsample: true, // Enables high quality chroma subsampling
        lossless: true, // Use lossy compression for better size reduction
      })
      .toBuffer();
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw error;
  }
}

// Handle file upload
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

    // Check if the request is multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize the image (convert to WebP and resize if needed)
    const optimizedBuffer = await optimizeImage(buffer);

    // Create a unique file name with WebP extension
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const fileName = `${uniqueId}.webp`;
    
    // Define the storage path
    const storagePath = `images/products/${fileName}`;
    
    // Create a file reference in the bucket
    const fileRef = bucket.file(storagePath);
    
    // Upload the optimized WebP image to Google Cloud Storage
    await fileRef.save(optimizedBuffer, {
      metadata: {
        contentType: 'image/webp',
      },
      public: true, // Make the file publicly accessible
    });
    
    // Make the file publicly accessible
    await fileRef.makePublic();
    
    // Generate the correct public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
    
    return NextResponse.json({ 
      success: true, 
      filePath: publicUrl,
      originalSize: buffer.length,
      optimizedSize: optimizedBuffer.length,
      compressionRatio: Math.round((buffer.length - optimizedBuffer.length) / buffer.length * 100)
    });
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'File upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/* 
SETUP INSTRUCTIONS FOR GOOGLE CLOUD STORAGE:

1. Install Google Cloud Storage library:
   npm install @google-cloud/storage

2. Get your Google Cloud Service Account:
   - Go to Google Cloud Console -> IAM & Admin -> Service Accounts
   - Create a new service account or select an existing one
   - Create a new key (JSON format) and download it
   - Give it the "Storage Admin" role (or a more restrictive custom role if needed)

3. Set up your environment variables in Vercel:
   - GCP_SERVICE_ACCOUNT: The entire service account JSON, stringified
     (You can use: JSON.stringify(require('./path-to-service-account.json')))
   - GCP_STORAGE_BUCKET: your-bucket-name

4. Create a bucket in Google Cloud Storage:
   - Go to Cloud Storage in the Google Cloud Console
   - Create a new bucket or use an existing one
   - Set the appropriate access control (public read is needed for direct URL access)

NOTES:
- Make sure CORS is properly configured on your GCS bucket to allow uploads from your domain
- Keep your service account credentials secure - never commit them to your repository
- For production, use a more restrictive IAM role than "Storage Admin" if possible
*/ 

