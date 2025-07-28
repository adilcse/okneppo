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
  coupon?: string;
}

interface FormErrors {
  course_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
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
  const response = await axiosClient.get('/api/courses');
  return response.data.courses as Course[];
};

export default function RegisterCoursePage() {
  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    course_id: 0,
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

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
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'course') {
        const selectedCourse = courses.find(c => c.id === parseInt(value, 10));
        setFormData(prev => ({
            ...prev,
            course_id: selectedCourse?.id ?? 0,
        }));
    } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, [courses]);

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
      // Step 1: Create a pending registration
      const registrationData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        courseId: formData.course_id,
        courseTitle: selectedCourse?.title,
        amountDue: finalFee,
      };
             const response = await axiosClient.post('/api/registrations', registrationData);

       if (response.status !== 200 && response.status !== 201) {
         throw new Error('Failed to create registration');
       }
      const registration = response.data;

      // Step 2: Create a payment order
      const orderRes = await fetch('/api/payments/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_id: registration.id,
          amount: finalFee,
          coupon_code: formData.coupon,
        }),
      });

      if (!orderRes.ok) {
        throw new Error('Failed to create order');
      }
      const order = await orderRes.json();

      // Step 3: Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Okneppo',
        description: 'Course Registration',
        order_id: order.id,
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
            
            const verificationData = await verificationRes.json();
            
            setPaymentStatus('success');
            router.push(`/receipt/${verificationData.registration_id}`);
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
    } catch (error) {
      console.error('Payment failed:', error);
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
                  <option value="" disabled>{coursesLoading ? 'Loading courses...' : 'Select a course'}</option>
                  {courseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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

              {/* Payment Button */}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 duration-300 disabled:bg-gray-400" disabled={paymentStatus === 'processing' || coursesLoading}>
                {paymentStatus === 'processing' ? 'Processing...' : 'Pay Now'}
              </button>
              {paymentStatus === 'error' && <p className="text-red-500 text-sm mt-2 text-center">Payment failed. Please try again.</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 