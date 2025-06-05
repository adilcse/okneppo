"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUpload, FiX } from 'react-icons/fi';
import { Button } from '@/components/common';
import axiosClient from '@/lib/axios';
import { removeImageFromUrl } from '@/lib/clientUtils';

interface SubjectFormData {
  title: string;
  description: string;
  images: string[];
  createNew?: boolean;
}

// API functions
const createSubject = async (data: SubjectFormData) => {
  const response = await axiosClient.post('/api/subjects', data);
  return response.data;
};

export default function NewSubject() {
  const [formData, setFormData] = useState<SubjectFormData>({
    title: '',
    description: '',
    images: []
  });
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const router = useRouter();
  const queryClient = useQueryClient();

  // Create subject mutation
  const createMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      if (variables.createNew) {
        // Reset form data
        setFormData({
          title: '',
          description: '',
          images: []
        });
        setError(null);
      } else {
        router.push('/admin/subjects');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (e: FormEvent, createNew: boolean = false) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a subject title');
      return;
    }
    
    if (!formData.images.length) {
      setError('Please upload at least one subject image');
      return;
    }
    
    createMutation.mutate({ ...formData, createNew });
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
        const response = await axiosClient.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Update progress to 100%
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 100
        }));
        
        // Add the uploaded image path to form data
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, response.data.filePath]
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

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index];
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    const success = await removeImageFromUrl(imageUrl);
    if (!success) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Subject</h1>
          <Link
            href="/admin/subjects"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Subjects
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Images
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <Image
                    src={image}
                    alt={`Subject image ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-100 transition-opacity z-1"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      Uploading...
                    </p>
                    <div className="w-full px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save & Create New'}
            </Button>
            <Button
              type="submit"
              onClick={(e) => handleSubmit(e, false)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 