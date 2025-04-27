import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';
import crypto from 'crypto';

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

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique file name
    const fileExtension = path.extname(file.name);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    
    // Define the storage path
    const storagePath = `images/products/${fileName}`;
    
    // Create a file reference in the bucket
    const fileRef = bucket.file(storagePath);
    
    // Upload the file to Google Cloud Storage
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true, // Make the file publicly accessible
    });
    
    // Make the file publicly accessible
    await fileRef.makePublic();
    
    // Generate the correct public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
    
    return NextResponse.json({ 
      success: true, 
      filePath: publicUrl
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

