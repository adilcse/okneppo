"use client"
import React from 'react';
import { CourseRegistration, RegistrationStatus } from '@/models/CourseRegistration';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

async function getRegistrations() {
  const res = await fetch('/api/course-registrations', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch registrations');
  }
  return res.json();
}

export default function AdminRegistrationsPage() {

  const { data: registrations, isLoading: loading } = useQuery<CourseRegistration[]>({
    queryKey: ['registrations'],
    queryFn: getRegistrations,
  });


  if (loading || !registrations) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Course Registrations</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Final Fee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {registrations.map(reg => (
              <tr key={reg.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{reg.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{reg.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{reg.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">
                  {reg.orderNumber || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{reg.courseTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{reg.amountDue}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    reg.status === RegistrationStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                    reg.status === RegistrationStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {reg.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* <select
                    value={reg.status}
                    onChange={(e) => handleStatusChange(reg.id.toString(), e.target.value as RegistrationStatus)}
                    className="p-1 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mr-2"
                  >
                    {Object.values(RegistrationStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select> */}
                  <Link href={`/admin/registrations/${reg.id}`} className="text-blue-600 hover:text-blue-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 