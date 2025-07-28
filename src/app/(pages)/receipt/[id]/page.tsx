'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PaymentReceipt from '@/components/receipt/PaymentReceipt';
import { CourseRegistration } from '@/models/CourseRegistration';
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

export default function ReceiptPage() {
  const [registration, setRegistration] = useState<CourseRegistration | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      Promise.all([getRegistration(id), getPayments(id)])
        .then(([regData, paymentData]) => {
          setRegistration(regData);
          setPayment(paymentData.find((p: Payment) => p.status === 'captured') || paymentData[0]);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!registration || !payment) {
    return <div className="text-center py-10">Receipt not found.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <PaymentReceipt registration={registration} payment={payment} />
      <div className="text-center mt-8">
      <div className="text-center mb-8">
        <a
          href={`/api/registrations/${registration.id}/receipt-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
        >
          Download Receipt
        </a>
      </div>
      </div>
      {/* Optionally, you can still show a preview using PDFViewer or a summary here */}
    </div>
  );
} 