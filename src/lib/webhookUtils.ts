import crypto from 'crypto';

/**
 * Generate webhook signature for testing
 * @param payload - The webhook payload as string
 * @param secret - The webhook secret
 * @returns The signature string
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Sample webhook payloads for testing
 */
export const SAMPLE_WEBHOOK_PAYLOADS = {
  payment_authorized: {
    event: 'payment.authorized',
    created_at: new Date().toISOString(),
    payload: {
      payment: {
        entity: {
          id: 'pay_test_123456789',
          order_id: 'order_test_123456789',
          amount: 10000,
          currency: 'INR',
          status: 'authorized',
          method: 'card',
          description: 'Course Registration',
          amount_refunded: 0,
          refund_status: null,
          card_id: 'card_test_123456789',
          captured: false,
          fee: 0,
          tax: 0,
          created_at: new Date().toISOString(),
        }
      }
    }
  },
  
  payment_captured: {
    event: 'payment.captured',
    created_at: new Date().toISOString(),
    payload: {
      payment: {
        entity: {
          id: 'pay_test_123456789',
          order_id: 'order_test_123456789',
          amount: 10000,
          currency: 'INR',
          status: 'captured',
          method: 'netbanking',
          description: 'Course Registration',
          signature: 'test_signature_123',
          amount_refunded: 0,
          refund_status: null,
          bank: 'BARB_R',
          captured: true,
          fee: 9440,
          tax: 1440,
          acquirer_data: { bank_transaction_id: '2250457' },
          created_at: new Date().toISOString(),
        }
      }
    }
  },
  
  payment_failed: {
    event: 'payment.failed',
    created_at: new Date().toISOString(),
    payload: {
      payment: {
        entity: {
          id: 'pay_test_123456789',
          order_id: 'order_test_123456789',
          amount: 10000,
          currency: 'INR',
          status: 'failed',
          method: 'netbanking',
          description: 'Course Registration',
          bank: 'BARB_R',
          captured: false,
          fee: 0,
          tax: 0,
          error_code: 'BAD_REQUEST_ERROR',
          error_description: "Your payment didn't go through as it was declined by the bank. Try another payment method or contact your bank.",
          error_source: 'bank',
          error_step: 'payment_authorization',
          error_reason: 'payment_failed',
          acquirer_data: { bank_transaction_id: null },
          created_at: new Date().toISOString(),
        }
      }
    }
  },
  
  order_paid: {
    event: 'order.paid',
    created_at: new Date().toISOString(),
    payload: {
      order: {
        entity: {
          id: 'order_test_123456789',
          amount: 10000,
          currency: 'INR',
          status: 'paid',
          created_at: new Date().toISOString(),
        }
      },
      payment: {
        entity: {
          id: 'pay_test_123456789',
          order_id: 'order_test_123456789',
          amount: 10000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
          description: 'Course Registration',
          captured: true,
          fee: 9440,
          tax: 1440,
          created_at: new Date().toISOString(),
        }
      }
    }
  }
};

/**
 * Test webhook endpoint with sample data
 * @param webhookUrl - The webhook endpoint URL
 * @param eventType - The type of event to test
 * @param secret - The webhook secret
 */
export async function testWebhook(
  webhookUrl: string, 
  eventType: keyof typeof SAMPLE_WEBHOOK_PAYLOADS,
  secret: string
): Promise<Response> {
  const payload = JSON.stringify(SAMPLE_WEBHOOK_PAYLOADS[eventType]);
  const signature = generateWebhookSignature(payload, secret);
  
  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Razorpay-Signature': signature,
    },
    body: payload,
  });
}
