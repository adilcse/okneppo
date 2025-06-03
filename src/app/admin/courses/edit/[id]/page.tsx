"use client";

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Subject, Course } from '@/types/course';

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
const fetchCourse = async (id: string) => {
  const response = await fetch(`/api/courses/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch course');
  }
  return response.json();
};

const fetchSubjects = async (page: number) => {
  const response = await fetch(`/api/subjects?page=${page}&limit=100`);
  if (!response.ok) {
    throw new Error('Failed to fetch subjects');
  }
  return response.json();
};

const updateCourse = async ({ id, data }: { id: string; data: CourseFormData }) => {
  const response = await fetch(`/api/courses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Cookies.get('admin-token')}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update course');
  }
  
  return response.json();
};

export default function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
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

  // Fetch course query
  const { data: courseData, isLoading: isLoadingCourse } = useQuery<Course>({
    queryKey: ['course', resolvedParams.id],
    queryFn: () => fetchCourse(resolvedParams.id)
  });

  // Fetch subjects query
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery<SubjectsResponse>({
    queryKey: ['subjects', 1],
    queryFn: () => fetchSubjects(1),
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: updateCourse,
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

  // Update form data when course data is loaded
  useEffect(() => {
    if (courseData) {
      setFormData({
        title: courseData.title,
        description: courseData.description,
        max_price: courseData.max_price,
        discounted_price: courseData.discounted_price,
        discount_percentage: courseData.discount_percentage,
        images: courseData.images || [],
        subjects: courseData.subjects?.map((subject: Subject, index: number) => ({
          id: subject.id,
          order: index
        })) || []
      });
      setSelectedSubjects(courseData.subjects || []);
    }
  }, [courseData]);

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
    const newImages: string[] = [];
    const newProgress: {[key: string]: number} = {};

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        newProgress[file.name] = 0;
        setUploadProgress(newProgress);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        newImages.push(data.url);
        newProgress[file.name] = 100;
        setUploadProgress(newProgress);
      } catch (error) {
        console.error('Error uploading image:', error);
        newProgress[file.name] = -1; // Error state
        setUploadProgress(newProgress);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    setUploadingImage(false);
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

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl">Loading course...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/courses" className="mr-6 hover:underline">
              ← Back to Courses
            </Link>
            <h1 className="text-xl font-semibold">Edit Course</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {updateMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
              <span className="block sm:inline">
                {updateMutation.error instanceof Error 
                  ? updateMutation.error.message 
                  : 'Failed to update course. Please try again.'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-32 w-full">
                      <Image
                        src={image}
                        alt={`Course image ${index + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="mt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{filename}</span>
                    <span>{progress === -1 ? 'Error' : `${progress}%`}</span>
                  </div>
                  {progress !== -1 && progress !== 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
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
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Updating...' : 'Update Course'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 