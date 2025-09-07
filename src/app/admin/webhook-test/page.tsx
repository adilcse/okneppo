'use client';

import { useState } from 'react';
import { testWebhook, SAMPLE_WEBHOOK_PAYLOADS } from '@/lib/webhookUtils';

export default function WebhookTestPage() {
  const [secret, setSecret] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTestWebhook = async (eventType: keyof typeof SAMPLE_WEBHOOK_PAYLOADS) => {
    if (!secret.trim()) {
      setResult('Please enter webhook secret');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const webhookUrl = `${window.location.origin}/api/payments/webhook`;
      const response = await testWebhook(webhookUrl, eventType, secret);
      
      const responseText = await response.text();
      
      setResult(`
Event: ${eventType}
Status: ${response.status} ${response.statusText}
Response: ${responseText}
      `);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Webhook Testing</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Webhook Secret
          </label>
          <input
            type="password"
            id="secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter your Razorpay webhook secret"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => handleTestWebhook('payment_authorized')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            Test Authorized
          </button>
          
          <button
            onClick={() => handleTestWebhook('payment_captured')}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            Test Captured
          </button>
          
          <button
            onClick={() => handleTestWebhook('payment_failed')}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            Test Failed
          </button>
          
          <button
            onClick={() => handleTestWebhook('order_paid')}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
          >
            Test Order Paid
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Test Result:</h3>
          <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
        </div>
      )}

      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Setup Instructions:
        </h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>Go to your Razorpay Dashboard → Settings → Webhooks</li>
          <li>Create a new webhook with URL: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">{window.location.origin}/api/payments/webhook</code></li>
          <li>Subscribe to these events: payment.authorized, payment.captured, payment.failed, order.paid</li>
          <li>Copy the webhook secret and enter it above</li>
          <li>Test the webhook using the buttons above</li>
        </ol>
      </div>
    </div>
  );
}
