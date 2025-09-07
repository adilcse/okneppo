'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PaymentReceipt from '@/components/receipt/PaymentReceipt';
import { CourseRegistration } from '@/models/CourseRegistration';
import { Payment } from '@/models/Payment';
import { useQuery } from '@tanstack/react-query';

async function getRegistration(id: string) {
  const res = await fetch(`/api/course-registrations/${id}?order_number=${id}&payment=true`);
  if (!res.ok) {
    throw new Error('Failed to fetch registration');
  }
  return res.json();
}

export default function ReceiptPage() {
  const [registration, setRegistration] = useState<CourseRegistration | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const params = useParams();
  const id = params?.id as string;

  const {data, isLoading} = useQuery({
    queryKey: ['registration', id],
    queryFn: () => getRegistration(id),
  });



  useEffect(() => {
    if (id && data) {
      const regData = data;
      const paymentData = regData.payment;
      const payment = paymentData?.find((p: Payment) => p.status === 'captured') || paymentData?.[0];
      setRegistration(regData);
      setPayment(payment);
    }
  }, [data, id]);

  if (isLoading || !registration || !payment) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-10">Receipt not found.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-10">
      <PaymentReceipt registration={registration!} payment={payment!} />
      <div className="text-center mt-8">
      <div className="text-center mb-8">
        <a
          href={`/api/registrations/${id}/receipt-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
        >
          Download Receipt
        </a>
      </div>
      </div>
    </div>
  );
} 