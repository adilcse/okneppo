'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseRegistration, RegistrationStatus } from '@/models/CourseRegistration';
import { Course } from '@/types/course';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import axiosClient from '@/lib/axios';

async function getRegistration(id: string) {
  const res = await fetch(`/api/course-registrations/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch registration');
  }
  return res.json();
}

async function getCourses() {
  const response = await axiosClient.get('/api/courses?is_online_course=true&limit=100');
  const allCourses = response.data.courses as Course[];
  // Filter to show only online courses
  return allCourses.filter(course => course.is_online_course);
}

async function updateRegistration(id: string, data: Partial<CourseRegistration>) {
  const res = await fetch(`/api/course-registrations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update registration');
  }
  
  return res.json();
}

export default function EditRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params?.id as string;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    courseId: 0,
    courseTitle: '',
    amountDue: 0,
    status: RegistrationStatus.PENDING,
    highestQualification: '',
    profession: '',
    dateOfBirth: '',
    aadharNumber: '',
    termsAccepted: true,
  });

  const { data: registration, isLoading: loadingRegistration } = useQuery<CourseRegistration>({
    queryKey: ['registration', id],
    queryFn: () => getRegistration(id),
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['online-courses'],
    queryFn: getCourses,
  });

  useEffect(() => {
    if (registration) {
      setFormData({
        name: registration.name || '',
        email: registration.email || '',
        phone: registration.phone || '',
        address: registration.address || '',
        courseId: registration.courseId || 0,
        courseTitle: registration.courseTitle || '',
        amountDue: registration.amountDue || 0,
        status: registration.status || RegistrationStatus.PENDING,
        highestQualification: registration.highestQualification || '',
        profession: registration.profession || '',
        dateOfBirth: registration.dateOfBirth ? new Date(registration.dateOfBirth).toISOString().split('T')[0] : '',
        aadharNumber: registration.aadharNumber || '',
        termsAccepted: registration.termsAccepted ?? true,
      });
    }
  }, [registration]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CourseRegistration>) => updateRegistration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration', id] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast.success('Registration updated successfully');
      router.push(`/admin/registrations/${id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update registration');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.phone || !formData.address || !formData.courseId) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Format date if provided
    const updateData = {
      ...formData,
      dateOfBirth: formData.dateOfBirth || undefined,
    };

    updateMutation.mutate(updateData);
  };

  const selectedCourse = useMemo(() => {
    return courses.find(c => c.id === formData.courseId);
  }, [formData.courseId, courses]);

  const courseFee = useMemo(() => {
    return selectedCourse?.max_price || 0;
  }, [selectedCourse?.max_price]);

  const basicDiscount = useMemo(() => {
    const courseFeeNum = typeof selectedCourse?.max_price === 'string' ? parseFloat(selectedCourse.max_price) : (selectedCourse?.max_price || 0);
    const discountedPrice = typeof selectedCourse?.discounted_price === 'string' ? parseFloat(selectedCourse.discounted_price) : (selectedCourse?.discounted_price || 0);
    return courseFeeNum - discountedPrice;
  }, [selectedCourse?.max_price, selectedCourse?.discounted_price]);

  const finalFee = useMemo(() => {
    const baseFee = typeof selectedCourse?.discounted_price === 'string' ? parseFloat(selectedCourse.discounted_price) : (selectedCourse?.discounted_price || 0);
    return baseFee;
  }, [selectedCourse?.discounted_price]);

  const handleCourseChange = (courseId: number) => {
    const selected = courses.find(c => c.id === courseId);
    if (selected) {
      const fee = typeof selected.discounted_price === 'string' ? parseFloat(selected.discounted_price) : selected.discounted_price;
      setFormData(prev => ({
        ...prev,
        courseId: selected.id,
        courseTitle: selected.title,
        amountDue: fee,
      }));
    }
  };

  if (loadingRegistration || loadingCourses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Registration not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        href={`/admin/registrations/${id}`} 
        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mb-4 inline-block"
      >
        &larr; Back to Registration Details
      </Link>
      
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Registration</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h2>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Educational & Professional Details */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Educational & Professional Details</h2>
            
            <div>
              <label htmlFor="highestQualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Highest Qualification
              </label>
              <select
                id="highestQualification"
                value={formData.highestQualification}
                onChange={(e) => setFormData(prev => ({ ...prev, highestQualification: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select your highest qualification</option>
                <option value="below_10th">Below 10th Standard</option>
                <option value="10th">10th Standard</option>
                <option value="12th">12th Standard</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor&apos;s Degree</option>
                <option value="Master">Master&apos;s Degree</option>
                <option value="PhD">PhD</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profession
              </label>
              <input
                type="text"
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aadhar Number
              </label>
              <input
                type="text"
                id="aadharNumber"
                value={formData.aadharNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                maxLength={12}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Course & Status */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Course & Status</h2>
            
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                id="course"
                value={formData.courseId}
                onChange={(e) => handleCourseChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
                disabled={loadingCourses}
              >
                <option value="">Select an online course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Details */}
            {selectedCourse && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md space-y-2 text-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fee Details</h3>
                <div className="flex justify-between">
                  <span>Course Fee:</span>
                  <span>₹{Number(courseFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Basic Discount ({selectedCourse.discount_percentage || 10}%):</span>
                  <span className="text-green-600 dark:text-green-400">-₹{Number(basicDiscount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Discounted Fee:</span>
                  <span>₹{Number(finalFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2 border-gray-300 dark:border-gray-600">
                  <span>Final Fee:</span>
                  <span>₹{finalFee.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="amountDue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount Due <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="amountDue"
                value={formData.amountDue}
                onChange={(e) => setFormData(prev => ({ ...prev, amountDue: parseFloat(e.target.value) }))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Auto-populated from course, but can be manually adjusted if needed
              </p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as RegistrationStatus }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value={RegistrationStatus.PENDING}>Pending</option>
                <option value={RegistrationStatus.COMPLETED}>Completed</option>
                <option value={RegistrationStatus.FAILED}>Failed</option>
                <option value={RegistrationStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Registration'}
          </button>
          <Link
            href={`/admin/registrations/${id}`}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-md transition-colors inline-block"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

