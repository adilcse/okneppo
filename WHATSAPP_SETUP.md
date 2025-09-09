# WhatsApp Integration Setup

This document explains how to set up WhatsApp Business API integration for sending automated messages when users complete course registration.

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN="your_whatsapp_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_whatsapp_phone_number_id"
WHATSAPP_API_VERSION="v21.0"
NEXT_PUBLIC_WHATSAPP_GROUP_INVITE_CODE="your_whatsapp_group_invite_code"
```

## How to Get WhatsApp Business API Credentials

### 1. Set up WhatsApp Business Account
- Create a WhatsApp Business account
- Apply for WhatsApp Business API access through Meta for Developers
- Complete the verification process

### 2. Get Access Token
- Go to [Meta for Developers](https://developers.facebook.com/)
- Create a new app or use existing app
- Add WhatsApp Business product
- Generate a permanent access token

### 3. Get Phone Number ID
- In your WhatsApp Business API setup
- Find your phone number ID (this is different from your actual phone number)
- It's usually a long numeric string

### 4. Create WhatsApp Group and Get Invite Link
- Create a WhatsApp group manually
- Go to group settings
- Generate an invite link
- Extract the invite code from the URL (the part after `https://chat.whatsapp.com/`)

## Example Environment Variables

```bash
WHATSAPP_ACCESS_TOKEN="EAABwzLixnjYBO..."
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_API_VERSION="v21.0"
NEXT_PUBLIC_WHATSAPP_GROUP_INVITE_CODE="ABC123DEF456GHI789"
```

## How It Works

1. When a user completes course registration and payment is verified
2. The system automatically sends a WhatsApp message to the user's phone number
3. The message includes:
   - Welcome message with user's name
   - Course title they registered for
   - WhatsApp group invite link
   - Contact information for support

## Message Template

The automated message sent to users:

```
🎉 Congratulations [Name]!

Your registration for "[Course Title]" has been successfully completed!

📚 Welcome to Ok Neppo! We're excited to have you join our learning community.

💬 Join our WhatsApp group for course updates, discussions, and support:
https://chat.whatsapp.com/[GROUP_INVITE_CODE]

📞 For any queries, contact us at:
• +91 6370826619
• +91 8249517832

Thank you for choosing Ok Neppo! 🚀
```

## Testing

### Method 1: Test Endpoint
Use the test endpoint to send a WhatsApp message without completing a full registration:

```bash
curl -X POST http://localhost:3000/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "name": "Test User",
    "courseTitle": "Test Course"
  }'
```

### Method 2: Full Registration Test
1. Ensure all environment variables are set correctly
2. Complete a test registration with a valid phone number
3. Check the server logs for WhatsApp message sending status
4. Verify the message is received on the test phone number

## Troubleshooting

### Common Issues

1. **"WhatsApp API credentials not configured"**
   - Check that all required environment variables are set
   - Verify the access token is valid and not expired

2. **"Failed to send WhatsApp message"**
   - Check phone number format (should be in international format without +)
   - Verify the phone number ID is correct
   - Ensure the access token has proper permissions

3. **Message not received**
   - Check if the recipient's phone number is registered on WhatsApp
   - Verify the phone number format is correct
   - Check server logs for detailed error messages

### Phone Number Format

The service automatically formats phone numbers:
- Removes all non-digit characters
- Adds country code 91 for Indian numbers if missing
- Expects 10-digit Indian numbers or 12-digit numbers with country code

## Security Notes

- Keep your WhatsApp access token secure and never commit it to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your access tokens
- Monitor API usage to avoid rate limits
