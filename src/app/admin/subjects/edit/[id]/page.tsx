"use client";

import { useState, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { Subject } from '@/types/course';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SubjectFormData {
  title: string;
  description: string;
  images: string[];
}

// API functions
const fetchSubject = async (id: string): Promise<Subject> => {
  const response = await fetch(`/api/subjects/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch subject');
  }
  return response.json();
};

const updateSubject = async ({ id, data }: { id: string; data: SubjectFormData }) => {
  const response = await fetch(`/api/subjects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Cookies.get('admin-token')}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error('Failed to update subject');
  }
  return response.json();
};

export default function EditSubject({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [formData, setFormData] = useState<SubjectFormData>({
    title: '',
    description: '',
    images: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch subject query
  const { data: subject, isLoading, error: fetchError } = useQuery<Subject>({
    queryKey: ['subject', resolvedParams.id],
    queryFn: () => fetchSubject(resolvedParams.id),
  });

  // Update form data when subject is loaded
  if (subject && !formData.title) {
    setFormData({
      title: subject.title,
      description: subject.description,
      images: subject.images || [],
    });
  }

  // Update subject mutation
  const updateMutation = useMutation({
    mutationFn: updateSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      router.push('/admin/subjects');
    }
  });

  // Check authentication
  const token = Cookies.get('admin-token');
  if (!token) {
    router.push('/admin/login');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      return;
    }
    
    updateMutation.mutate({ id: resolvedParams.id, data: formData });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `upload-${Date.now()}-${i}`;
      
      // Create an entry in the progress tracker
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        // Upload the file
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        // Update progress to 100%
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 100
        }));
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const data = await response.json();
        
        // Add the uploaded image path to form data
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.filePath]
        }));
        
        // Remove from progress tracker after 1 second
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = {...prev};
            delete newProgress[fileId];
            return newProgress;
          });
        }, 1000);
        
      } catch (err) {
        console.error('Upload error:', err);
        
        // Remove from progress tracker
        setUploadProgress(prev => {
          const newProgress = {...prev};
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }
    
    setUploadingImage(false);
    
    // Reset the file input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading subject data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/subjects" className="mr-6 hover:underline">
              ← Back to Subjects
            </Link>
            <h1 className="text-xl font-semibold">Edit Subject</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <span className="block sm:inline">Failed to load subject. Please try again.</span>
            </div>
          )}

          {updateMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <span className="block sm:inline">Failed to update subject. Please try again.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700">
                Images *
              </label>
              <input
                type="file"
                id="images"
                onChange={handleImageUpload}
                className="mt-1 block w-full"
                accept="image/*"
                multiple
              />
              {uploadingImage && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${uploadProgress['upload-0'] || 0}%` }}></div>
                  </div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={image}
                      alt={`Uploaded image ${index + 1}`}
                      priority={false}
                      loading="lazy"
                      width={100}
                      height={100}
                      className="rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 