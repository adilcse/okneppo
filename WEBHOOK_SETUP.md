# Razorpay Webhook Implementation

This document explains the webhook implementation for handling Razorpay payment events when the frontend fails to process them.

## Overview

The webhook endpoint `/api/payments/webhook` handles payment status updates from Razorpay, ensuring that payment statuses are always synchronized even when the frontend payment verification fails.

## Supported Events

Based on the [Razorpay webhooks documentation](https://razorpay.com/docs/webhooks/), the following events are handled:

### 1. `payment.authorized`
- **Purpose**: Handles late authorized payments
- **Use Case**: When a payment is marked as "Failed" on the frontend but gets authorized later
- **Action**: Updates payment status to "authorized" in the database

### 2. `payment.captured`
- **Purpose**: Handles successful payments
- **Use Case**: When a payment is successfully captured by Razorpay
- **Action**: Updates payment status to "captured" and registration status to "completed"

### 3. `payment.failed`
- **Purpose**: Handles failed payments
- **Use Case**: When a payment fails due to various reasons (insufficient funds, card declined, etc.)
- **Action**: Updates payment status to "failed"

### 4. `order.paid`
- **Purpose**: Alternative event for successful payments
- **Use Case**: When an order is marked as paid
- **Action**: Updates payment status to "captured" and registration status to "completed"

## Security Features

### Signature Verification
- All webhook requests are verified using HMAC-SHA256 signature
- Uses `RAZORPAY_WEBHOOK_SECRET` environment variable
- Prevents unauthorized webhook calls

### Error Handling
- Comprehensive error logging
- Graceful handling of missing payments
- Database transaction safety

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env.local` file:
```bash
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Razorpay Dashboard Configuration
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Create a new webhook with URL: `https://yourdomain.com/api/payments/webhook`
3. Subscribe to these events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
4. Copy the webhook secret and add it to your environment variables

### 3. Testing
Use the webhook testing page at `/admin/webhook-test` to test webhook functionality during development.

## API Endpoint

### POST `/api/payments/webhook`

**Headers:**
- `Content-Type: application/json`
- `X-Razorpay-Signature: <signature>`

**Request Body:**
```json
{
  "event": "payment.captured",
  "created_at": "2024-01-01T00:00:00Z",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_123456789",
        "order_id": "order_123456789",
        "amount": 10000,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "signature": "signature_123"
      }
    }
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## Database Updates

The webhook automatically updates the following database tables:

### Payments Table
- Updates `status` field based on webhook event
- Updates `razorpay_order_id` if provided
- Updates `razorpay_signature` if provided

### Course Registrations Table
- Updates `status` to "completed" when payment is captured
- Maintains data consistency between payments and registrations

## Error Scenarios

### 1. Missing Signature
- **Error**: 400 Bad Request
- **Response**: `{"error": "Missing signature"}`

### 2. Invalid Signature
- **Error**: 400 Bad Request
- **Response**: `{"error": "Invalid signature"}`

### 3. Payment Not Found
- **Log**: Payment not found for razorpay_payment_id
- **Action**: Continues processing (payment might be from different system)

### 4. Database Error
- **Error**: 500 Internal Server Error
- **Response**: `{"error": "Webhook processing failed"}`

## Monitoring and Logging

The webhook implementation includes comprehensive logging:

- Webhook event reception
- Signature verification status
- Payment status updates
- Database operation results
- Error conditions

## Testing

### Manual Testing
Use the webhook testing page at `/admin/webhook-test` to:
- Test different webhook events
- Verify signature generation
- Check response handling

### Sample Payloads
The system includes sample payloads for all supported events in `src/lib/webhookUtils.ts`.

## Best Practices

1. **Always verify webhook signatures** to prevent unauthorized access
2. **Handle idempotency** - webhooks may be sent multiple times
3. **Log all webhook events** for debugging and monitoring
4. **Test webhook endpoints** before going live
5. **Monitor webhook delivery** in Razorpay dashboard

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is accessible
   - Verify webhook is active in Razorpay dashboard
   - Check firewall/network settings

2. **Signature verification failing**
   - Verify `RAZORPAY_WEBHOOK_SECRET` is correct
   - Check if webhook secret was regenerated
   - Ensure signature header is properly formatted

3. **Payment not found errors**
   - Verify payment was created in your system
   - Check if payment ID matches between systems
   - Ensure payment is not from test mode when expecting live mode

## Related Files

- `/src/app/api/payments/webhook/route.ts` - Main webhook endpoint
- `/src/lib/webhookUtils.ts` - Webhook utilities and testing
- `/src/lib/orderUtils.ts` - Order number generation and webhook constants
- `/src/app/admin/webhook-test/page.tsx` - Webhook testing interface
