"use client";

import { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';
import { FiUpload, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { Button, Input } from '@/components/common';
import { removeImageFromUrl } from '@/lib/clientUtils';
import { handleMultipleImageUpload } from '@/lib/imageUpload';
import { Subject } from '@/types/course';
import toast from 'react-hot-toast';
import { Editor } from '@tinymce/tinymce-react';

export interface CourseFormData {
  title: string;
  description: string;
  max_price: number;
  discounted_price: number;
  discount_percentage: number;
  images: string[];
  subjects: {
    id: string;
    order: number;
  }[];
  createNew?: boolean;
}

interface CourseFormProps {
  initialData?: CourseFormData;
  onSubmit: (data: CourseFormData, createNew?: boolean) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  submitButtonText: string;
  showCreateNewButton?: boolean;
  subjects: Subject[];
  isLoadingSubjects: boolean;
}

export default function CourseForm({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  submitButtonText,
  showCreateNewButton = false,
  subjects,
  isLoadingSubjects
}: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>(
    initialData || {
      title: '',
      description: '',
      max_price: 0,
      discounted_price: 0,
      discount_percentage: 0,
      images: [],
      subjects: []
    }
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Set selected subjects based on initial data
      const initialSubjects = subjects.filter(subject => 
        initialData.subjects.some(s => s.id === subject.id)
      );
      setSelectedSubjects(initialSubjects);
    }
  }, [initialData, subjects]);

  // Clear validation error when form data changes
  useEffect(() => {
    setValidationError(null);
  }, [formData]);

  const handleSubmit = async (e: FormEvent, createNew: boolean = false) => {
    e.preventDefault();
    setValidationError(null);
    
    // Validation
    if (!formData.title.trim()) {
      setValidationError('Please enter a course title');
      return;
    }
    
    if (formData.subjects.length === 0) {
      setValidationError('Please add at least one subject');
      return;
    }
    
    try {
      await onSubmit(formData, createNew);
      toast.success(createNew ? 'Course created successfully!' : 'Course saved successfully!');
      
      // Reset form if createNew is true
      if (createNew) {
        setFormData({
          title: '',
          description: '',
          max_price: 0,
          discounted_price: 0,
          discount_percentage: 0,
          images: [],
          subjects: []
        });
        setSelectedSubjects([]);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setValidationError(err instanceof Error ? err.message : 'An error occurred while saving the course');
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

  const addSubject = (subject: Subject) => {
    if (!selectedSubjects.find(s => s.id === subject.id)) {
      setSelectedSubjects(prev => [...prev, subject]);
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, { id: subject.id, order: prev.subjects.length }]
      }));
    }
  };

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects(prev => prev.filter(s => s.id !== subjectId));
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== subjectId)
    }));
  };

  const moveSubject = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedSubjects.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSubjects = [...selectedSubjects];
    const temp = newSubjects[index];
    newSubjects[index] = newSubjects[newIndex];
    newSubjects[newIndex] = temp;

    setSelectedSubjects(newSubjects);
    setFormData(prev => ({
      ...prev,
      subjects: newSubjects.map((s, i) => ({ id: s.id, order: i }))
    }));
  };

  const handlePriceChange = (value: string, field: 'max_price' | 'discounted_price') => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => {
      const newData = { ...prev, [field]: numValue };
      if (field === 'max_price' && newData.max_price > 0) {
        newData.discount_percentage = ((newData.max_price - newData.discounted_price) / newData.max_price) * 100;
      } else if (field === 'discounted_price' && newData.max_price > 0) {
        newData.discount_percentage = ((newData.max_price - newData.discounted_price) / newData.max_price) * 100;
      }
      return newData;
    });
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

      {/* Description */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="max_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Maximum Price *
          </label>
          <Input
            type="number"
            id="max_price"
            value={formData.max_price}
            onChange={(e) => handlePriceChange(e.target.value, 'max_price')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label htmlFor="discounted_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Discounted Price *
          </label>
          <Input
            type="number"
            id="discounted_price"
            value={formData.discounted_price}
            onChange={(e) => handlePriceChange(e.target.value, 'discounted_price')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Discount Percentage
          </label>
          <Input
            type="number"
            id="discount_percentage"
            value={formData.discount_percentage}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm bg-gray-50 dark:bg-gray-600"
          />
        </div>
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
                alt={`Course image ${index + 1}`}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Subjects *
        </label>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Subjects</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {isLoadingSubjects ? (
                  <p className="text-sm text-gray-500">Loading subjects...</p>
                ) : (
                  subjects
                    .filter(subject => !selectedSubjects.find(s => s.id === subject.id))
                    .map(subject => (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => addSubject(subject)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {subject.title}
                      </button>
                    ))
                )}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected Subjects</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedSubjects.map((subject, index) => (
                  <div key={subject.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{subject.title}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => moveSubject(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                      >
                        <FiArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSubject(index, 'down')}
                        disabled={index === selectedSubjects.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                      >
                        <FiArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSubject(subject.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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