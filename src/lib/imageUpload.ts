import axiosClient from './axios';

interface UploadProgress {
  [key: string]: number;
}

interface ImageUploadOptions {
  onProgressUpdate?: (progress: UploadProgress) => void;
  onError?: (error: string) => void;
  onSuccess?: (filePath: string) => void;
}

export async function uploadImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string | null> {
  const { onProgressUpdate, onError, onSuccess } = options;
  const fileId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create an entry in the progress tracker
  onProgressUpdate?.({ [fileId]: 0 });
  
  // Create FormData object
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Upload the file
    const response = await axiosClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Update progress to 100%
    onProgressUpdate?.({ [fileId]: 100 });
    
    // Call success callback
    onSuccess?.(response.data.filePath);
    
    // Remove from progress tracker after 1 second
    setTimeout(() => {
      onProgressUpdate?.({});
    }, 1000);
    
    return response.data.filePath;
  } catch (err) {
    console.error('Upload error:', err);
    onError?.(`Failed to upload ${file.name}. Please try again.`);
    
    // Remove from progress tracker
    onProgressUpdate?.({});
    return null;
  }
}

export async function handleMultipleImageUpload(
  files: FileList | null,
  options: ImageUploadOptions = {}
): Promise<string[]> {
  if (!files || files.length === 0) return [];
  
  const uploadedPaths: string[] = [];
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = await uploadImage(file, options);
    if (filePath) {
      uploadedPaths.push(filePath);
    }
  }
  
  return uploadedPaths;
} 