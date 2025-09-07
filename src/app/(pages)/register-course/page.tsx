"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import axiosClient from '@/lib/axios';
import { Course } from '@/types/course';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

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
  coupon?: string;
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

declare global {
  interface Window {
    Razorpay: {
      new(options: unknown): {
        open(): void;
      };
    };
  }
}

const fetchCourses = async () => {
  const response = await axiosClient.get('/api/courses?is_online_course=true&limit=100');
  const allCourses = response.data.courses as Course[];
  // Filter to show only online courses
  return allCourses.filter(course => course.is_online_course);
};

export default function RegisterCoursePage() {
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
    highest_qualification: '',
    aadhar_number: '',
    date_of_birth: '',
    profession: '',
    terms_accepted: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [currentOrder, setCurrentOrder] = useState<{
    registration_id: number;
    order_id: string;
    payment_id: string; // UUID
    order_number: string; // 6-digit alphanumeric
  } | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validate = () => {
    const tempErrors: FormErrors = {};

    if (!formData.course_id) {
      tempErrors.course_id = 'Please select a course';
    }
    if (!formData.name.trim()) {
      tempErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email is invalid';
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
    if (!formData.aadhar_number.trim()) {
      tempErrors.aadhar_number = 'Aadhar number is required';
    } else if (!/^\d{12}$/.test(formData.aadhar_number.replace(/\s/g, ''))) {
      tempErrors.aadhar_number = 'Aadhar number must be 12 digits';
    }
    if (!formData.date_of_birth.trim()) {
      tempErrors.date_of_birth = 'Date of birth is required';
    }
    if (!formData.profession.trim()) {
      tempErrors.profession = 'Profession is required';
    }
    if (!formData.terms_accepted) {
      tempErrors.terms_accepted = 'You must accept the terms and conditions';
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
    
    if (name === 'course') {
        const selectedCourse = courses.find(c => c.id === parseInt(value, 10));
        setFormData(prev => ({
            ...prev,
            course_id: selectedCourse?.id ?? 0,
        }));
    } else if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, [courses, errors.general]);

  const { selectedCourse } = useMemo(() => {
    const selectedCourse = courses.find((c) => c.id === formData.course_id);
    
    if (!selectedCourse) {
      return { selectedCourse: null };
    }

    return { selectedCourse };
  }, [formData.course_id, courses]);

  const courseFee = useMemo(() => {
    const baseFee = selectedCourse?.max_price || 0;
    // Add coupon logic here if needed
    return baseFee;
  }, [selectedCourse?.max_price]);

  const basicDiscount = useMemo(() => {
    const courseFeeNum = typeof selectedCourse?.max_price === 'string' ? parseFloat(selectedCourse.max_price) : (selectedCourse?.max_price || 0);
    const discountedPrice = typeof selectedCourse?.discounted_price === 'string' ? parseFloat(selectedCourse.discounted_price) : (selectedCourse?.discounted_price || 0);
    return courseFeeNum - discountedPrice;
  }, [selectedCourse?.max_price, selectedCourse?.discounted_price]);

  const finalFee = useMemo(() => {
    const baseFee = typeof selectedCourse?.discounted_price === 'string' ? parseFloat(selectedCourse.discounted_price) : (selectedCourse?.discounted_price || 0);
    // Add coupon logic here if needed
    return baseFee;
  }, [selectedCourse?.discounted_price]);

  const courseOptions = useMemo(() => {
    return courses?.map((course: Course) => ({
      value: course.id,
      label: course.title
    })) || [];
  }, [courses]);

  const handlePayment = async () => {
    if (!validate()) {
      return;
    }
    setPaymentStatus('processing');

    try {
      let registrationData, orderData, paymentId, orderNumber;

      // Check if we have an existing order to retry
      if (currentOrder) {
        console.log('Retrying payment with existing order:', currentOrder.order_id);
        
        // Use existing order for retry
        const retryResponse = await axiosClient.post('/api/registrations/retry-payment', {
          registration_id: currentOrder.registration_id,
        });

        if (retryResponse.status !== 200) {
          throw new Error('Failed to retrieve existing order');
        }

        registrationData = retryResponse.data.registration;
        orderData = retryResponse.data.order;
        paymentId = retryResponse.data.payment.id;
        orderNumber = retryResponse.data.payment.order_number;
      } else {
        console.log('Creating new registration and order');
        
        // Create new registration and order in one call
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
          coupon_code: formData.coupon,
        };
        
        const response = await axiosClient.post('/api/registrations/create-with-order', registrationPayload);
        console.log('Registration and order created:', response?.status);
        
        if (response.status !== 200 && response.status !== 201) {
          throw new Error('Failed to create registration and order');
        }

        registrationData = response.data.registration;
        orderData = response.data.order;
        paymentId = response.data.payment.id;
        orderNumber = response.data.payment.order_number;

        // Store the order details for potential retry
        setCurrentOrder({
          registration_id: registrationData.id,
          order_id: orderData.id,
          payment_id: paymentId,
          order_number: orderNumber,
        });
      }

      // Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Okneppo',
        description: 'Course Registration',
        order_id: orderData.id,
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          try {
            const verificationRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verificationRes.ok) {
              throw new Error('Payment verification failed');
            }
            await verificationRes.json();
            setPaymentStatus('success');
            setCurrentOrder(null); // Clear order on success
            if (window){
              window.open(`/receipt/${orderNumber}`, '_blank');
            } else {
              router.push(`/receipt/${orderNumber}`);
            }
          } catch (error) {
            console.error('Verification failed:', error);
            setPaymentStatus('error');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function() {
            setPaymentStatus('idle');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      console.error('Payment process failed:', error);
      
      // Handle validation errors from the API
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        console.log(axiosError.response?.status);
        console.log(axiosError.response?.data?.error);
        if (axiosError.response?.status === 400 && axiosError.response?.data?.error) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setErrors({ 
            ...errors, 
            general: axiosError.response.data.error 
          });
          setPaymentStatus('idle');
          return;
        }
      }
      
      setPaymentStatus('error');
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
          <p className="text-gray-700 dark:text-gray-300">Thank you for your registration. We will be in touch with you shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center">Register for an Online Course</h1>
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePayment();
            }}
            noValidate
          >
            <div className="grid grid-cols-1 gap-6">
              {/* General Error Display */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                  <span className="block sm:inline">{errors.general}</span>
                </div>
              )}
              
              {/* Form Fields */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.name ? 'border-red-500' : ''}`} required disabled={paymentStatus === 'processing'} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea name="address" id="address" value={formData.address} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" rows={3} required disabled={paymentStatus === 'processing'} />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.phone ? 'border-red-500' : ''}`} required disabled={paymentStatus === 'processing'} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email ID</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.email ? 'border-red-500' : ''}`} required disabled={paymentStatus === 'processing'} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="highest_qualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Highest Qualification</label>
                <select 
                  name="highest_qualification" 
                  id="highest_qualification" 
                  value={formData.highest_qualification} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.highest_qualification ? 'border-red-500' : ''}`} 
                  required 
                  disabled={paymentStatus === 'processing'}
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
                <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhar Number</label>
                <input 
                  type="text" 
                  name="aadhar_number" 
                  id="aadhar_number" 
                  value={formData.aadhar_number} 
                  onChange={handleInputChange} 
                  placeholder="Enter 12-digit Aadhar number"
                  maxLength={12}
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.aadhar_number ? 'border-red-500' : ''}`} 
                  required 
                  disabled={paymentStatus === 'processing'} 
                />
                {errors.aadhar_number && <p className="text-red-500 text-xs mt-1">{errors.aadhar_number}</p>}
              </div>

              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  name="date_of_birth" 
                  id="date_of_birth" 
                  value={formData.date_of_birth} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.date_of_birth ? 'border-red-500' : ''}`} 
                  required 
                  disabled={paymentStatus === 'processing'} 
                />
                {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
              </div>

              <div>
                <label htmlFor="profession" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profession</label>
                <input 
                  type="text" 
                  name="profession" 
                  id="profession" 
                  value={formData.profession} 
                  onChange={handleInputChange} 
                  placeholder="e.g., Student, Engineer, Teacher, etc."
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.profession ? 'border-red-500' : ''}`} 
                  required 
                  disabled={paymentStatus === 'processing'} 
                />
                {errors.profession && <p className="text-red-500 text-xs mt-1">{errors.profession}</p>}
              </div>

              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course</label>
                <select 
                  name="course" 
                  id="course" 
                  value={formData.course_id} 
                  onChange={handleInputChange} 
                  className={`w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 ${errors.course_id ? 'border-red-500' : ''}`} 
                  required 
                  disabled={paymentStatus === 'processing' || coursesLoading}
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

              {/* Fee Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Course Fee:</span>
                  <span>₹{Number(courseFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Basic Discount ({selectedCourse ? selectedCourse.discount_percentage : 10}%):</span>
                  <span className="text-green-600">-₹{Number(basicDiscount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Discounted Fee:</span>
                  <span>₹{Number(finalFee).toFixed(2)}</span>
                </div>
                {/* <div className="flex items-center justify-between pt-2">
                  <div className="flex-grow">
                     <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Code</label>
                    <input type="text" name="coupon" id="coupon" value={formData.coupon} onChange={handleInputChange} placeholder="Enter coupon" className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" disabled={paymentStatus === 'processing'} />
                  </div>
                </div> */}
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
                    disabled={paymentStatus === 'processing'}
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
                  </span>
                </label>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <ul className="list-disc pl-5">
                    <li>
                      <span className="font-semibold">Note:</span> Once a payment is made, it <span className="font-bold text-red-600">cannot be refunded or canceled</span> under any circumstances.
                    </li>
                  </ul>
                </div>
                {errors.terms_accepted && <p className="text-red-500 text-xs mt-1">{errors.terms_accepted}</p>}
              </div>

              {/* Order Number Display */}
              {currentOrder && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Order Number</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 font-mono">
                        {currentOrder.order_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-600 dark:text-blue-400">Payment Status</p>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Pending</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Button */}
              <button type="submit"
              disabled={paymentStatus === 'processing' || coursesLoading || formData.terms_accepted === false}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 duration-300 disabled:bg-gray-400"
               >
                {paymentStatus === 'processing' ? 'Processing...' : 
                 currentOrder ? 'Retry Payment' : 'Pay Now'}
              </button>
              {paymentStatus === 'error' && <p className="text-red-500 text-sm mt-2 text-center">Payment failed. Please try again.</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 