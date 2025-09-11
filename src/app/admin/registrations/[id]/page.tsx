'use client';

import { CourseRegistration, RegistrationStatus } from '@/models/CourseRegistration';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

async function getRegistration(id: string) {
  const res = await fetch(`/api/course-registrations/${id}?payment=true`);
  if (!res.ok) {
    throw new Error('Failed to fetch registration');
  }
  return res.json();
}

async function updateRegistrationStatus(id: string, status: RegistrationStatus) {
  const res = await fetch(`/api/course-registrations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update registration status');
  }
  
  return res.json();
}

async function addManualPayment(registrationId: number, amount: number, note: string) {
  const res = await fetch('/api/payments/manual', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      registration_id: registrationId, 
      amount, 
      note 
    }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to add manual payment');
  }
  
  return res.json();
}


export default function RegistrationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  
  // Manual payment form state
  const [showManualPaymentForm, setShowManualPaymentForm] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const { data: registration, isLoading: loading } = useQuery<CourseRegistration>({
    queryKey: ['registration', id],
    queryFn: () => getRegistration(id),
  });


  const handleStatusChange = async (newStatus: RegistrationStatus) => {
    if (!id) return;
    
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      // Update the status first
      await updateRegistrationStatus(id, newStatus);
      
      // If status changed to completed, send WhatsApp message
      if (newStatus === RegistrationStatus.COMPLETED) {
        try {
          const whatsappResponse = await fetch('/api/whatsapp/send-welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ registrationId: parseInt(id) }),
          });
          
          if (whatsappResponse.ok) {
            console.log('WhatsApp welcome message sent successfully');
          } else {
            console.error('Failed to send WhatsApp message:', await whatsappResponse.text());
          }
        } catch (whatsappError) {
          console.error('Error sending WhatsApp message:', whatsappError);
          // Don't fail the status update if WhatsApp fails
        }
      }
      
      // Invalidate and refetch the registration data
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registration', id] });

      setIsUpdating(false);
      setUpdateError(null);
      toast.success(`Status updated to ${newStatus} successfully`);
      setUpdateSuccess(`Status updated to ${newStatus} successfully`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update status');
      setIsUpdating(false);
    }
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !manualAmount) return;
    
    setIsAddingPayment(true);
    setPaymentError(null);
    
    try {
      const amount = parseFloat(manualAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      await addManualPayment(parseInt(id), amount, manualNote);
      
      // Reset form
      setManualAmount('');
      setManualNote('');
      setShowManualPaymentForm(false);
      
      // Invalidate and refetch the registration data
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['registration', id] });
      
      setIsAddingPayment(false);
      setPaymentError(null);
      toast.success('Manual payment added successfully');
      setPaymentSuccess('Manual payment added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setPaymentSuccess(null), 3000);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to add manual payment');
      setIsAddingPayment(false);
    }
  };

  const payments = registration?.payment || [];


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
      
      {/* Success Display */}
      {updateSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{updateSuccess}</span>
        </div>
      )}

      {/* Error Display */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">Error updating status: {updateError}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h2>
              <div className="space-y-2">
                <p><strong>Name:</strong> {registration.name}</p>
                <p><strong>Email:</strong> {registration.email}</p>
                <p><strong>Phone:</strong> {registration.phone}</p>
                <p><strong>Address:</strong> {registration.address}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Educational & Professional Details</h2>
              <div className="space-y-2">
                <p><strong>Highest Qualification:</strong> {registration.highestQualification || 'Not provided'}</p>
                <p><strong>Profession:</strong> {registration.profession || 'Not provided'}</p>
                <p><strong>Date of Birth:</strong> {registration.dateOfBirth ? new Date(registration.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                <p><strong>Aadhar Number:</strong> {registration.aadharNumber || 'Not provided'}</p>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Course & Status</h2>
              <div className="space-y-2">
                <p><strong>Course:</strong> {registration.courseTitle}</p>
                <p><strong>Order Number:</strong> 
                <a href={`/receipt/${registration.orderNumber}`} target="_blank" rel="noopener noreferrer">
                  <span className="ml-2 font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                    {registration.orderNumber || 'N/A'}
                  </span>
                  </a>
                </p>
                <p><strong>Amount Due:</strong> ₹{registration.amountDue}</p>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <div className="flex items-center gap-2">
                    <select
                      value={registration.status}
                      onChange={(e) => handleStatusChange(e.target.value as RegistrationStatus)}
                      disabled={isUpdating}
                      className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                        registration.status === 'completed' ? 'bg-green-100 text-green-800' :
                        registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        registration.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <option value={RegistrationStatus.PENDING}>Pending</option>
                      <option value={RegistrationStatus.COMPLETED}>Completed</option>
                      <option value={RegistrationStatus.FAILED}>Failed</option>
                      <option value={RegistrationStatus.CANCELLED}>Cancelled</option>
                    </select>
                    {isUpdating && (
                      <span className="text-xs text-gray-500">Updating...</span>
                    )}
                  </div>
                </div>
                <p><strong>Terms Accepted:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                    registration.termsAccepted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {registration.termsAccepted ? 'Yes' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Registered on: {new Date(registration.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
      

      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-xl font-bold">Payment History</h2>
        <button
          onClick={() => setShowManualPaymentForm(!showManualPaymentForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {showManualPaymentForm ? 'Cancel' : 'Add Manual Payment'}
        </button>
      </div>

      {/* Manual Payment Form */}
      {showManualPaymentForm && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Manual Payment</h3>
          
          {/* Payment Success Display */}
          {paymentSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">{paymentSuccess}</span>
            </div>
          )}

          {/* Payment Error Display */}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">Error: {paymentError}</span>
            </div>
          )}

          <form onSubmit={handleManualPayment} className="space-y-4">
            <div>
              <label htmlFor="manualAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                id="manualAmount"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Enter amount"
                step="0.01"
                min="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isAddingPayment}
              />
            </div>
            
            <div>
              <label htmlFor="manualNote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note (Optional)
              </label>
              <textarea
                id="manualNote"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                placeholder="Add a note about this payment"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isAddingPayment}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isAddingPayment || !manualAmount}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {isAddingPayment ? 'Adding...' : 'Add Payment'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualPaymentForm(false);
                  setManualAmount('');
                  setManualNote('');
                  setPaymentError(null);
                  setPaymentSuccess(null);
                }}
                disabled={isAddingPayment}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Payment ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map(payment => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white font-mono">
                  {payment.razorpay_payment_id || payment.order_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₹{payment.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.payment_method === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {payment.payment_method === 'manual' ? 'Manual' : 'Online'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'captured' ? 'bg-green-100 text-green-800' :
                    payment.status === 'created' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{payment.description || payment.error_description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(payment.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 