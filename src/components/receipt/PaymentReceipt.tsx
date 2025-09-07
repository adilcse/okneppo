'use client';

import { CourseRegistration } from '@/models/CourseRegistration';
import { Payment } from '@/models/Payment';

interface PaymentReceiptProps {
  registration: CourseRegistration;
  payment: Payment;
}

export default function PaymentReceipt({ registration, payment }: PaymentReceiptProps) {
  if (payment.status === 'failed') {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800">Payment Failed</h1>
        <p className="text-gray-600">Please try again later.</p>
      </div>
    );
  }
  return (
    <div id="receipt" className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment Receipt</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Order #: {payment.order_number}</p>
          <p className="text-sm text-gray-500">Date: {new Date(payment.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="border-t border-b border-gray-200 py-4 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Billed To</h2>
        <p className="text-gray-600">{registration.name}</p>
        <p className="text-gray-600">{registration.address}</p>
        <p className="text-gray-600">{registration.email}</p>
        <p className="text-gray-600">{registration.phone}</p>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Payment Details</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2 text-gray-500 font-normal">Description</th>
              <th className="py-2 text-gray-500 font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2 text-gray-700">{registration.courseTitle}</td>
              <td className="py-2 text-gray-700 text-right">₹{payment.amount}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 font-bold text-gray-800 text-right">Total Paid</td>
              <td className="pt-4 font-bold text-gray-800 text-right">₹{payment.amount}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Thank you for your payment!</p>
        <p>Okneppo</p>
      </div>
    </div>
  );
} 