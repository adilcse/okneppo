/**
 * Generates a 6-digit alphanumeric order number
 * Uses uppercase letters and numbers (A-Z, 0-9)
 * @returns {string} 6-character alphanumeric string
 */
export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates a unique order number by checking against existing ones
 * @param {Function} checkExists - Function to check if order number exists
 * @returns {Promise<string>} Unique 6-character alphanumeric string
 */
export async function generateUniqueOrderNumber(checkExists: (orderNumber: string) => Promise<boolean>): Promise<string> {
  let orderNumber: string;
  let exists = true;
  
  // Keep generating until we find a unique one
  while (exists) {
    orderNumber = generateOrderNumber();
    exists = await checkExists(orderNumber);
  }
  
  return orderNumber!;
}

/**
 * Webhook event types for Razorpay
 */
export const WEBHOOK_EVENTS = {
  PAYMENT_AUTHORIZED: 'payment.authorized',
  PAYMENT_CAPTURED: 'payment.captured',
  PAYMENT_FAILED: 'payment.failed',
  ORDER_PAID: 'order.paid',
} as const;

/**
 * Payment status mapping for webhook events
 */
export const PAYMENT_STATUS_MAP = {
  [WEBHOOK_EVENTS.PAYMENT_AUTHORIZED]: 'authorized',
  [WEBHOOK_EVENTS.PAYMENT_CAPTURED]: 'captured',
  [WEBHOOK_EVENTS.PAYMENT_FAILED]: 'failed',
  [WEBHOOK_EVENTS.ORDER_PAID]: 'captured',
} as const;
