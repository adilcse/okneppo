'use client';

import { useState, useEffect } from 'react';
import { CourseRegistration } from '@/models/CourseRegistration';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Payment } from '@/models/Payment';

async function getRegistration(id: string) {
  const res = await fetch(`/api/course-registrations/${id}`);
  if (!res.ok) {
    throw new Error('Failed to fetch registration');
  }
  return res.json();
}

async function getPayments(registrationId: string) {
    const res = await fetch(`/api/registrations/${registrationId}/payments`);
    if (!res.ok) {
      throw new Error('Failed to fetch payments');
    }
    return res.json();
}

export default function RegistrationDetailPage() {
  const [registration, setRegistration] = useState<CourseRegistration | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      Promise.all([getRegistration(id), getPayments(id)])
        .then(([regData, paymentData]) => {
          setRegistration(regData);
          setPayments(paymentData);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!registration) {
    return <div>Registration not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin/registrations" className="text-blue-600 hover:text-blue-900 mb-4 inline-block">
        &larr; Back to Registrations
      </Link>
      <h1 className="text-2xl font-bold mb-6">Registration Details</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Personal Information</h2>
              <p><strong>Name:</strong> {registration.name}</p>
              <p><strong>Email:</strong> {registration.email}</p>
              <p><strong>Phone:</strong> {registration.phone}</p>
              <p><strong>Address:</strong> {registration.address}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Course Information</h2>
              <p><strong>Course:</strong> {registration.courseTitle}</p>
              <p><strong>Amount Due:</strong> ₹{registration.amountDue}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Status</h2>
              <p><strong>Status:</strong> {registration.status}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Registered on: {new Date(registration.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Payment History</h2>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map(payment => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{payment.razorpay_payment_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{payment.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'captured' ? 'bg-green-100 text-green-800' :
                    payment.status === 'created' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(payment.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 