"use client";

import { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { FiUpload, FiX } from 'react-icons/fi';
import { Button, Input } from '@/components/common';
import { removeImageFromUrl } from '@/lib/clientUtils';
import { handleMultipleImageUpload } from '@/lib/imageUpload';
import toast from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';

export interface SubjectFormData {
  title: string;
  description: string;
  images: string[];
  createNew?: boolean;
}

interface SubjectFormProps {
  initialData?: SubjectFormData;
  onSubmit: (data: SubjectFormData, createNew?: boolean) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  submitButtonText: string;
  showCreateNewButton?: boolean;
}

export default function SubjectForm({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  submitButtonText,
  showCreateNewButton = false
}: SubjectFormProps) {
  const [formData, setFormData] = useState<SubjectFormData>(
    initialData || {
      title: '',
      description: '',
      images: []
    }
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Clear validation error when form data changes
  useEffect(() => {
    setValidationError(null);
  }, [formData]);

  const handleSubmit = async (e: FormEvent, createNew: boolean = false) => {
    e.preventDefault();
    setValidationError(null);
    
    // Validation
    if (!formData.title.trim()) {
      setValidationError('Please enter a subject title');
      return;
    }
    
    if (!formData.images.length) {
      setValidationError('Please upload at least one subject image');
      return;
    }
    
    try {
      await onSubmit(formData, createNew);
      toast.success(createNew ? 'Subject created successfully!' : 'Subject saved successfully!');
      
      // Reset form if createNew is true
      if (createNew) {
        setFormData({
          title: '',
          description: '',
          images: []
        });
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setValidationError(err instanceof Error ? err.message : 'An error occurred while saving the subject');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    setValidationError(null);
    
    await handleMultipleImageUpload(files, {
      onProgressUpdate: setUploadProgress,
      onError: (error) => setValidationError(error),
      onSuccess: (filePath) => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, filePath]
        }));
      }
    });
    
    setUploadingImage(false);
    e.target.value = '';
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index];
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    const success = await removeImageFromUrl(imageUrl);
    if (!success) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
      setValidationError('Failed to remove image. Please try again.');
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {(error || validationError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <span className="block sm:inline">{error || validationError}</span>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title *
        </label>
        <Input
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
        <Editor
          id="description"
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
          value={formData.description}
          onEditorChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
          init={{
            height: 300,
            menubar: false,
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'table', 'code', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
          }}
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
        {showCreateNewButton && (
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save & Create New'}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : submitButtonText}
        </Button>
      </div>
    </form>
  );
} 