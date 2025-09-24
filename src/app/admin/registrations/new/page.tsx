"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Course } from '@/types/course';
import axiosClient from '@/lib/axios';

// Helper component for required field indicator
const RequiredField = () => <span className="text-red-500 ml-1">*</span>;

interface FormData {
  course_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  highest_qualification: string;
  aadhar_number: string;
  date_of_birth: string;
  profession: string;
  terms_accepted: boolean;
  payment_status: 'pending' | 'captured' | 'failed';
  payment_method: 'manual' | 'razorpay';
}

interface FormErrors {
  course_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  highest_qualification?: string;
  aadhar_number?: string;
  date_of_birth?: string;
  profession?: string;
  terms_accepted?: string;
  general?: string;
}

const fetchCourses = async () => {
  const response = await axiosClient.get('/api/courses?is_online_course=true&limit=100');
  const allCourses = response.data.courses as Course[];
  // Filter to show only online courses
  return allCourses.filter(course => course.is_online_course);
};

export default function NewRegistrationPage() {
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['online-courses'],
    queryFn: fetchCourses,
  });
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    course_id: 0,
    name: '',
    email: '',
    phone: '',
    address: '',
    highest_qualification: 'Other',
    aadhar_number: '',
    date_of_birth: '',
    profession: '',
    terms_accepted: true,
    payment_status: 'pending',
    payment_method: 'manual',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validate = () => {
    const tempErrors: FormErrors = {};
    
    // Required fields
    if (!formData.course_id) {
      tempErrors.course_id = 'Please select a course';
    }
    if (!formData.name.trim()) {
      tempErrors.name = 'Name is required';
    }
    if (!formData.phone.trim()) {
      tempErrors.phone = 'Phone is required';
    }
    if (!formData.address.trim()) {
      tempErrors.address = 'Address is required';
    }
    if (!formData.highest_qualification.trim()) {
      tempErrors.highest_qualification = 'Highest qualification is required';
    }
    if (!formData.terms_accepted) {
      tempErrors.terms_accepted = 'You must accept the terms and conditions';
    }
    
    // Optional fields with validation (only if provided)
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email is invalid';
    }
    if (formData.aadhar_number.trim() && !/^\d{12}$/.test(formData.aadhar_number.replace(/\s/g, ''))) {
      tempErrors.aadhar_number = 'Aadhar number must be 12 digits';
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  useEffect(() => {
    if (courses.length > 0) {
      setFormData(prev => ({
        ...prev,
        course_id: courses[0].id,
      }));
    }
  }, [courses]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
    
    // Clear specific field error when user provides a value
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    if (name === 'course') {
        const selectedCourse = courses.find(c => c.id === parseInt(value, 10));
        setFormData(prev => ({
            ...prev,
            course_id: selectedCourse?.id ?? 0,
        }));
        // Clear course_id error when course is selected
        if (errors.course_id) {
          setErrors(prev => ({ ...prev, course_id: undefined }));
        }
    } else if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
        // Clear terms_accepted error when checkbox is checked
        if (name === 'terms_accepted' && checked && errors.terms_accepted) {
          setErrors(prev => ({ ...prev, terms_accepted: undefined }));
        }
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
        
        // Clear specific validation errors when user provides correct values
        if (name === 'email' && value.trim() && /\S+@\S+\.\S+/.test(value) && errors.email) {
          setErrors(prev => ({ ...prev, email: undefined }));
        }
        if (name === 'aadhar_number' && value.trim() && /^\d{12}$/.test(value.replace(/\s/g, '')) && errors.aadhar_number) {
          setErrors(prev => ({ ...prev, aadhar_number: undefined }));
        }
        if (name === 'phone' && value.trim().length >= 10 && errors.phone) {
          setErrors(prev => ({ ...prev, phone: undefined }));
        }
        if (name === 'name' && value.trim() && errors.name) {
          setErrors(prev => ({ ...prev, name: undefined }));
        }
        if (name === 'address' && value.trim() && errors.address) {
          setErrors(prev => ({ ...prev, address: undefined }));
        }
        if (name === 'highest_qualification' && value.trim() && errors.highest_qualification) {
          setErrors(prev => ({ ...prev, highest_qualification: undefined }));
        }
    }
  }, [courses, errors]);

  const { selectedCourse } = useMemo(() => {
    const selectedCourse = courses.find((c) => c.id === formData.course_id);
    
    if (!selectedCourse) {
      return { selectedCourse: null };
    }

    return { selectedCourse };
  }, [formData.course_id, courses]);

  const courseFee = useMemo(() => {
    const baseFee = selectedCourse?.max_price || 0;
    return baseFee;
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

  const courseOptions = useMemo(() => {
    return courses?.map((course: Course) => ({
      value: course.id,
      label: course.title
    })) || [];
  }, [courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    clearAllErrors();

    try {
      const registrationPayload = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        highestQualification: formData.highest_qualification,
        aadharNumber: formData.aadhar_number,
        dateOfBirth: formData.date_of_birth,
        profession: formData.profession,
        termsAccepted: formData.terms_accepted,
        courseId: formData.course_id,
        courseTitle: selectedCourse?.title,
        amountDue: finalFee,
        amount: finalFee,
        paymentStatus: formData.payment_status,
        paymentMethod: formData.payment_method,
      };
      
      const response = await axiosClient.post('/api/registrations/create-manual', registrationPayload);
      
      if (response.status === 200 || response.status === 201) {
        // Success - redirect to registrations list
        router.push('/admin/registrations');
      } else {
        throw new Error('Failed to create registration');
      }
    } catch (error: unknown) {
      console.error('Registration creation failed:', error);
      
      // Handle validation errors from the API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        
        if (axiosError.response?.status === 400 && axiosError.response?.data?.error) {
          setErrors({ 
            general: axiosError.response.data.error 
          });
          return;
        }
      }
      
      setErrors({ 
        general: 'Failed to create registration. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Create New Registration</h1>
        </div>
        
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-6">
              {/* General Error Display */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <span className="block sm:inline">{errors.general}</span>
                </div>
              )}
              
              {/* Form Fields */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <RequiredField />
                </label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.name ? 'border-red-500' : ''}`} 
                  required 
                  disabled={isSubmitting} 
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address <RequiredField />
                </label>
                <textarea 
                  name="address" 
                  id="address" 
                  value={formData.address} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" 
                  rows={3} 
                  required 
                  disabled={isSubmitting} 
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number (Whatsapp Number) <RequiredField />
                </label>
                <input 
                  type="tel" 
                  name="phone" 
                  id="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.phone ? 'border-red-500' : ''}`} 
                  required 
                  disabled={isSubmitting} 
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email ID <span className="text-gray-500 text-sm">(Optional)</span>
                </label>
                <input 
                  type="email" 
                  name="email" 
                  id="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.email ? 'border-red-500' : ''}`} 
                  disabled={isSubmitting} 
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="highest_qualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Highest Qualification <RequiredField />
                </label>
                <select 
                  name="highest_qualification" 
                  id="highest_qualification" 
                  value={formData.highest_qualification} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.highest_qualification ? 'border-red-500' : ''}`} 
                  required 
                  disabled={isSubmitting}
                >
                  <option value="" disabled>Select your highest qualification</option>
                  <option value="below_10th">Below 10th Standard</option>
                  <option value="10th">10th Standard</option>
                  <option value="12th">12th Standard</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor&apos;s Degree</option>
                  <option value="Master">Master&apos;s Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
                {errors.highest_qualification && <p className="text-red-500 text-xs mt-1">{errors.highest_qualification}</p>}
              </div>

              <div>
                <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aadhar Number <span className="text-gray-500 text-sm">(Optional)</span>
                </label>
                <input 
                  type="text" 
                  name="aadhar_number" 
                  id="aadhar_number" 
                  value={formData.aadhar_number} 
                  onChange={handleInputChange} 
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.aadhar_number ? 'border-red-500' : ''}`} 
                  disabled={isSubmitting} 
                />
                {errors.aadhar_number && <p className="text-red-500 text-xs mt-1">{errors.aadhar_number}</p>}
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth <span className="text-gray-500 text-sm">(Optional)</span>
                </label>
                <input 
                  type="date" 
                  name="date_of_birth" 
                  id="date_of_birth" 
                  value={formData.date_of_birth} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.date_of_birth ? 'border-red-500' : ''}`} 
                  disabled={isSubmitting} 
                />
                {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
              </div>

              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profession <span className="text-gray-500 text-sm">(Optional)</span>
                </label>
                <input 
                  type="text" 
                  name="profession" 
                  id="profession" 
                  value={formData.profession} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Student, Engineer, Teacher, etc."
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.profession ? 'border-red-500' : ''}`} 
                  disabled={isSubmitting} 
                />
                {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession}</p>}
              </div>

              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course <RequiredField />
                </label>
                <select 
                  name="course" 
                  id="course" 
                  value={formData.course_id} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.course_id ? 'border-red-500' : ''}`} 
                  required 
                  disabled={isSubmitting || coursesLoading}
                >
                  <option value="" disabled>{coursesLoading ? 'Loading online courses...' : 'Select an online course'}</option>
                  {courseOptions.length === 0 && !coursesLoading ? (
                    <option value="" disabled>No online courses available</option>
                  ) : (
                    courseOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
                {errors.course_id && <p className="text-red-500 text-xs mt-1">{errors.course_id}</p>}
              </div>

              {/* Payment Status Selection */}
              <div>
                <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Status <RequiredField />
                </label>
                <select 
                  name="payment_status" 
                  id="payment_status" 
                  value={formData.payment_status} 
                  onChange={handleInputChange} 
                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" 
                  required 
                  disabled={isSubmitting}
                >
                  <option value="pending">Pending</option>
                  <option value="captured">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Fee Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Course Fee:</span>
                  <span>₹{Number(courseFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Basic Discount ({selectedCourse ? (selectedCourse.discount_percentage || 10) : 10}%):</span>
                  <span className="text-green-600">-₹{Number(basicDiscount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Discounted Fee:</span>
                  <span>₹{Number(finalFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2 border-gray-200 dark:border-gray-700">
                  <span>Final Fee:</span>
                  <span>₹{finalFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={formData.terms_accepted}
                    onChange={handleInputChange}
                    className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    required
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I agree to the{' '}
                    <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                      Privacy Policy
                    </a>
                    <RequiredField />
                  </span>
                </label>
                {errors.terms_accepted && <p className="text-red-500 text-xs mt-1">{errors.terms_accepted}</p>}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || coursesLoading || !formData.terms_accepted}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Creating...' : 'Create Registration'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
