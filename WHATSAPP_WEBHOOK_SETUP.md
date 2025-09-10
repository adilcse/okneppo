# WhatsApp Webhook Setup Guide

This guide explains how to set up WhatsApp webhooks for the Ok Neppo admin panel to receive and manage WhatsApp messages.

## Prerequisites

1. WhatsApp Business API access
2. Meta App with WhatsApp Business Platform configured
3. Environment variables configured

## Environment Variables

Add these environment variables to your `.env` file:

```env
# WhatsApp API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_API_VERSION=v21.0

# Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
WHATSAPP_WEBHOOK_SECRET=your_webhook_secret_here

# Group Invite Code (for welcome messages)
WHATSAPP_GROUP_INVITE_CODE=your_group_invite_code_here
```

## Webhook Setup Steps

### 1. Configure Webhook in Meta App Dashboard

1. Go to [Meta App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Go to WhatsApp > Configuration
4. In the Webhook section:
   - **Callback URL**: `https://yourdomain.com/api/whatsapp/webhook`
   - **Verify Token**: Use the same value as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - **Webhook Fields**: Subscribe to `messages` field

### 2. Webhook Verification

The webhook endpoint automatically handles verification when Meta sends a GET request with:
- `hub.mode=subscribe`
- `hub.verify_token=your_verify_token`
- `hub.challenge=challenge_string`

### 3. Webhook Security (Optional but Recommended)

For production, set up webhook signature verification:
1. Set `WHATSAPP_WEBHOOK_SECRET` in your environment
2. The webhook will verify incoming requests using HMAC-SHA256

## Database Schema

The system automatically creates a `whatsapp_messages` table with the following structure:

```sql
CREATE TABLE whatsapp_messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE,
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  business_account_id VARCHAR(50) NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(50) DEFAULT 'sent',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Webhook Endpoint
- **GET** `/api/whatsapp/webhook` - Webhook verification
- **POST** `/api/whatsapp/webhook` - Receive messages and status updates

### Messages API
- **GET** `/api/whatsapp/messages` - Get all messages with pagination
- **POST** `/api/whatsapp/messages` - Send a new message

### Conversations API
- **GET** `/api/whatsapp/conversations` - Get all conversations
- **GET** `/api/whatsapp/conversations/[phoneNumber]` - Get messages for specific phone number

## Admin Panel Features

### WhatsApp Admin Page (`/admin/whatsapp`)

1. **Conversations Tab**:
   - View all conversations grouped by phone number
   - See message count and last message preview
   - Click on conversation to view full message history

2. **Send Message Tab**:
   - Send new messages to any phone number
   - Real-time message status updates

### Webhook Test Page (`/admin/webhook-test`)

- Send test messages to verify webhook functionality
- View webhook configuration information

## Message Types Supported

- **Text messages**: Full support
- **Images**: Caption extraction
- **Documents**: Filename extraction
- **Audio/Voice**: Basic support
- **Video**: Caption extraction

## Testing

1. Use the webhook test page to send test messages
2. Check the admin panel to see sent messages
3. Send a message to your WhatsApp Business number to test inbound messages
4. Verify messages appear in the conversations list

## Troubleshooting

### Common Issues

1. **Webhook verification fails**:
   - Check that `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches the token in Meta App Dashboard
   - Ensure the webhook URL is accessible from the internet

2. **Messages not appearing**:
   - Check database connection
   - Verify webhook is properly configured in Meta App Dashboard
   - Check server logs for errors

3. **Cannot send messages**:
   - Verify `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`
   - Check if the phone number is registered with WhatsApp Business API

### Logs

Check server logs for detailed error messages:
- Webhook processing errors
- Database connection issues
- WhatsApp API errors

## Security Considerations

1. **Webhook Secret**: Always use webhook signature verification in production
2. **Access Tokens**: Keep WhatsApp access tokens secure
3. **Rate Limiting**: Implement rate limiting for message sending
4. **Phone Number Validation**: Validate phone numbers before sending messages

## Production Deployment

1. Ensure HTTPS is enabled for webhook URL
2. Set up proper error monitoring
3. Configure webhook retry policies
4. Monitor message delivery rates
5. Set up alerts for failed webhook deliveries
