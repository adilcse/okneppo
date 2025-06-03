"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Subject } from '@/types/course';

interface CourseFormData {
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
}

interface SubjectsResponse {
  subjects: Subject[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// API functions
const createCourse = async (data: CourseFormData) => {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Cookies.get('admin-token')}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create course');
  }
  
  return response.json();
};

const fetchSubjects = async (page: number): Promise<SubjectsResponse> => {
  const response = await fetch(`/api/subjects?page=${page}&limit=100`);
  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }
  return response.json();
};

const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name}`);
  }
  
  return response.json();
};

export default function NewCourse() {
  const initialFormData: CourseFormData = {
    title: '',
    description: '',
    max_price: 0,
    discounted_price: 0,
    discount_percentage: 0,
    images: [],
    subjects: [],
  };

  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch subjects query
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery<SubjectsResponse>({
    queryKey: ['subjects', 1],
    queryFn: () => fetchSubjects(1),
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      router.push('/admin/courses');
    }
  });

  // Check authentication
  useEffect(() => {
    const token = Cookies.get('admin-token');
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      return;
    }
    
    createMutation.mutate(formData);
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
      
      try {
        // Upload the file
        const data = await uploadImage(file);
        
        // Update progress to 100%
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 100
        }));
        
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/courses" className="mr-6 hover:underline">
              ← Back to Courses
            </Link>
            <h1 className="text-xl font-semibold">New Course</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {createMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <span className="block sm:inline">
                {createMutation.error instanceof Error 
                  ? createMutation.error.message 
                  : 'Failed to create course. Please try again.'}
              </span>
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="max_price" className="block text-sm font-medium text-gray-700">
                  Max Price
                </label>
                <input
                  type="number"
                  id="max_price"
                  value={formData.max_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_price: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="discounted_price" className="block text-sm font-medium text-gray-700">
                  Discounted Price
                </label>
                <input
                  type="number"
                  id="discounted_price"
                  value={formData.discounted_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, discounted_price: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  id="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700">
                Images (optional)
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subjects
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Available Subjects */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Available Subjects</h3>
                  {isLoadingSubjects ? (
                    <p>Loading subjects...</p>
                  ) : (
                    <div className="space-y-2">
                      {subjectsData?.subjects
                        .filter(subject => !selectedSubjects.find(s => s.id === subject.id))
                        .map(subject => (
                          <div
                            key={subject.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span>{subject.title}</span>
                            <button
                              type="button"
                              onClick={() => addSubject(subject)}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Selected Subjects */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Selected Subjects</h3>
                  <div className="space-y-2">
                    {selectedSubjects.map((subject, index) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span>{subject.title}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => moveSubject(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSubject(index, 'down')}
                            disabled={index === selectedSubjects.length - 1}
                            className="text-gray-600 hover:text-gray-700 disabled:opacity-50"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSubject(subject.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 