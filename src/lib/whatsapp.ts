/* eslint-disable @typescript-eslint/no-unused-vars */
import { WHATSAPP_GROUP_INVITE_CODE } from "@/constant";
import { db } from "./db";

interface WhatsAppMessage {
  to: string;
  message: string;
  template?: string;
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
  private businessAccountId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
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

      const messageId = data.messages?.[0]?.id;

      // Store the sent message in database
      if (messageId) {
        try {
          const messageData = {
            message_id: messageId,
            from_number: this.phoneNumberId,
            to_number: formattedPhone,
            business_account_id: this.businessAccountId,
            message_type: type,
            content: message,
            direction: 'outbound' as const,
            status: 'sent',
            timestamp: new Date(),
            metadata: {
              sent_via: 'whatsapp_service',
              original_response: data
            }
          };

          await db.upsert('whatsapp_messages', messageData, ['message_id'], ['status', 'timestamp', 'updated_at']);
          console.log('Sent WhatsApp message stored in database:', messageId);
        } catch (dbError) {
          console.error('Error storing sent message in database:', dbError);
          // Don't fail the send operation if database storage fails
        }
      }

      return {
        success: true,
        messageId: messageId
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
   * Send a text message via WhatsApp Business API
   */
  async sendTemplateMessage({ to, message, type = 'template', template = 'hello_world' }: WhatsAppMessage): Promise<WhatsAppResponse> {
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
        template: { name: template, language: { code: 'en' } }
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

      const messageId = data.messages?.[0]?.id;

      // Store the sent message in database
      if (messageId) {
        try {
          const messageData = {
            message_id: messageId,
            from_number: this.phoneNumberId,
            to_number: formattedPhone,
            business_account_id: this.businessAccountId,
            message_type: type,
            content: message,
            direction: 'outbound' as const,
            status: 'sent',
            timestamp: new Date(),
            metadata: {
              sent_via: 'whatsapp_service',
              original_response: data
            }
          };

          await db.upsert('whatsapp_messages', messageData, ['message_id'], ['status', 'timestamp', 'updated_at']);
          console.log('Sent WhatsApp message stored in database:', messageId);
        } catch (dbError) {
          console.error('Error storing sent message in database:', dbError);
          // Don't fail the send operation if database storage fails
        }
      }

      return {
        success: true,
        messageId: messageId
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

const message2 = `Congratulations !!!,
Apka registration Ok Neppo Online Classes me ho gaya hai.

📞 Koi bhi doubt ya questions ke liye, contact kare:
• +91 6370826619
• +91 8249517832

Whatsapp group me join karne ke liye hi message kare aur niche diye link ko click kare.

https://www.okneppo.in/api/registration/joingroup

Welcome to Ok Neppo family...`;

    return this.sendTemplateMessage({
      to: phone,
      message: message2,
      type: 'template',
      template: 'ok_neppo_link'
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

