"use client";

import { useState } from 'react';
import { Container, Button, Card } from '@/components/common';
import { toast } from 'react-hot-toast';

export default function WebhookTestPage() {
  const [testData, setTestData] = useState({
    phoneNumber: '',
    message: 'Test message from webhook test page'
  });
  const [loading, setLoading] = useState(false);

  const sendTestMessage = async () => {
    if (!testData.phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testData.phoneNumber,
          message: testData.message,
          type: 'text'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Test message sent successfully!');
      } else {
        toast.error(data.error || 'Failed to send test message');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('Error sending test message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          WhatsApp Webhook Test
        </h1>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Send Test Message</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number (e.g., 9876543210)"
                  value={testData.phoneNumber}
                  onChange={(e) => setTestData({ ...testData, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter test message..."
                  value={testData.message}
                  onChange={(e) => setTestData({ ...testData, message: e.target.value })}
                  rows={3}
                />
              </div>
              <Button 
                onClick={sendTestMessage} 
                disabled={loading || !testData.phoneNumber.trim()}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Test Message'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Webhook Information</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Webhook URL:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/whatsapp/webhook</code></p>
              <p><strong>Verification Token:</strong> Set in environment variable <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">WHATSAPP_WEBHOOK_VERIFY_TOKEN</code></p>
              <p><strong>Webhook Secret:</strong> Set in environment variable <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">WHATSAPP_WEBHOOK_SECRET</code></p>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
