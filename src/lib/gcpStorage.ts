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

export { storage, bucketName };