import { WHATSAPP_GROUP_INVITE_CODE } from "@/constant";
import { db } from "./db";

interface WhatsAppMessage {
  to: string;
  message: string;
  type?: 'text' | 'template';
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}


/**
 * WhatsApp Business API service for sending messages
 * This service handles sending WhatsApp messages including group invite links
 */
export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  }

  /**
   * Format phone number to WhatsApp format (remove + and ensure it starts with country code)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 91 (India), keep it as is
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned;
    }
    
    // If it's 10 digits, assume it's Indian number and add 91
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    
    // Return as is if it's already in correct format
    return cleaned;
  }

  /**
   * Send a text message via WhatsApp Business API
   */
  async sendMessage({ to, message, type = 'text' }: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        console.error('WhatsApp API credentials not configured');
        return {
          success: false,
          error: 'WhatsApp API credentials not configured'
        };
      }

      const formattedPhone = this.formatPhoneNumber(to);
      const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: type,
        ...(type === 'text' ? { text: { body: message } } : {})
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('WhatsApp API error:', data);
        return {
          success: false,
          error: data.error?.message || 'Failed to send WhatsApp message'
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send registration completion message with group invite link
   */
  async sendRegistrationWelcomeMessage(
    phone: string, 
    name: string, 
    courseTitle: string,
    groupInviteLink: string
  ): Promise<WhatsAppResponse> {
    const message = `🎉 Congratulations ${name}!

Your registration for "${courseTitle}" has been successfully completed!

📚 Welcome to Ok Neppo! We're excited to have you join our learning community.

💬 Join our WhatsApp group for course updates, discussions, and support:
${groupInviteLink}

📞 For any queries, contact us at:
• +91 6370826619
• +91 8249517832

Thank you for choosing Ok Neppo! 🚀`;

    return this.sendMessage({
      to: phone,
      message: message
    });
  }
}

// Export a singleton instance
export const whatsappService = new WhatsAppService();

export async function sendWhatsAppWelcomeMessageAfterPayment(registration_id: string | number) {
  // Send WhatsApp welcome message with group invite
  try {
   // Get registration details for WhatsApp message
   const registration = await db.findOne('course_registrations', { id: registration_id });
   
   if (registration && WHATSAPP_GROUP_INVITE_CODE) {
     const groupInviteLink = `https://chat.whatsapp.com/${WHATSAPP_GROUP_INVITE_CODE}`;
     
     const whatsappResult = await whatsappService.sendRegistrationWelcomeMessage(
       registration.phone as string,
       registration.name as string,
       registration.course_title as string,
       groupInviteLink
     );

     if (whatsappResult.success) {
       console.log('WhatsApp welcome message sent successfully:', whatsappResult.messageId);
     } else {
       console.error('Failed to send WhatsApp welcome message:', whatsappResult.error);
     }
   }
 } catch (whatsappError) {
   // Don't fail the payment verification if WhatsApp fails
   console.error('Error sending WhatsApp message:', whatsappError);
 }
}

