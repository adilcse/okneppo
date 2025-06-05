"use client";

import { useState, useEffect, FormEvent, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiUpload, FiX } from 'react-icons/fi';
import { Button } from '@/components/common';
import { Course, Subject } from '@/types/course';
import axiosClient from '@/lib/axios';
import { removeImageFromUrl } from '@/lib/clientUtils';
import { GetSubjectsResponse } from '@/types/api';

interface CourseFormData {
  title: string;
  description: string;
  max_price: number;
  discounted_price: number;
  discount_percentage: number;
  images: string[];
  subjects: Subject[];
}


// API functions
const fetchCourse = async (id: string) : Promise<Course> => {
  const response = await axiosClient.get(`/api/courses/${id}`);
  console.log(response.data);
  return response.data as Course;
};

const updateCourse = async ({ id, data }: { id: string; data: CourseFormData }) => {
  const response = await axiosClient.put(`/api/courses/${id}`, data);
  return response.data;
};

const fetchSubjects = async (page: number): Promise<GetSubjectsResponse> => {
  const response = await axiosClient.get(`/api/subjects?page=${page}&limit=100`);
  return response.data;
};

export default function EditCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    max_price: 0,
    discounted_price: 0,
    discount_percentage: 0,
    images: [],
    subjects: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch course query
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id),
  });

  console.log(course);

  // Fetch subjects query
  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery<GetSubjectsResponse>({
    queryKey: ['subjects', 1],
    queryFn: () => fetchSubjects(1),
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      router.push('/admin/courses');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  // Update form data when course is loaded
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        max_price: course.max_price,
        discounted_price: course.discounted_price,
        discount_percentage: course.discount_percentage,
        images: course.images,
        subjects: course.subjects || [],
      });
      setSelectedSubjects(course.subjects || []);
    }
  }, [course]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a course title');
      return;
    }
    
    if (formData.subjects.length === 0) {
      setError('Please add at least one subject');
      return;
    }
    
    updateMutation.mutate({ id, data: formData });
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

  const addSubject = (subject: Subject) => {
    if (!selectedSubjects.find(s => s.id === subject.id)) {
      setSelectedSubjects(prev => [...prev, subject]);
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subject]
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
      subjects: newSubjects
    }));
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <Link
            href="/admin/courses"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Courses
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="max_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Price
              </label>
              <input
                type="number"
                id="max_price"
                value={formData.max_price}
                onChange={(e) => setFormData(prev => ({ ...prev, max_price: Number(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="discounted_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discounted Price
              </label>
              <input
                type="number"
                id="discounted_price"
                value={formData.discounted_price}
                onChange={(e) => setFormData(prev => ({ ...prev, discounted_price: Number(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="discount_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Percentage
              </label>
              <input
                type="number"
                id="discount_percentage"
                value={formData.discount_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: Number(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                min="0"
                max="100"
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
              Subjects
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Available Subjects */}
              <div className="border rounded-lg p-4 dark:border-gray-600">
                <h3 className="font-medium mb-2 dark:text-gray-300">Available Subjects</h3>
                {isLoadingSubjects ? (
                  <p className="text-gray-500 dark:text-gray-400">Loading subjects...</p>
                ) : (
                  <div className="space-y-2">
                    {subjectsData?.subjects
                      .filter(subject => !selectedSubjects.find(s => s.id === subject.id))
                      .map(subject => (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <span className="dark:text-gray-300">{subject.title}</span>
                          <button
                            type="button"
                            onClick={() => addSubject(subject)}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Selected Subjects */}
              <div className="border rounded-lg p-4 dark:border-gray-600">
                <h3 className="font-medium mb-2 dark:text-gray-300">Selected Subjects</h3>
                <div className="space-y-2">
                  {selectedSubjects?.map((subject, index) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <span className="dark:text-gray-300">{subject.title}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => moveSubject(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSubject(index, 'down')}
                          disabled={index === selectedSubjects.length - 1}
                          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/courses')}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 