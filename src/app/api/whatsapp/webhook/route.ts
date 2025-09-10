import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { emitNewMessage, emitMessageStatusUpdate } from '@/lib/socketClient';

/**
 * WhatsApp Webhook endpoint for receiving messages and status updates
 * GET /api/whatsapp/webhook - Webhook verification
 * POST /api/whatsapp/webhook - Receive messages and status updates
 */

// Webhook verification token from environment
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Check if this is a webhook verification request
    if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified successfully');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.log('WhatsApp webhook verification failed');
      return new NextResponse('Forbidden', { status: 403 });
    }
  } catch (error) {
    console.error('Error in WhatsApp webhook verification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the raw body first for signature verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

    // Verify webhook signature if configured
    const signature = req.headers.get('x-hub-signature-256');
    console.log('WhatsApp webhook signature:', signature);
    
    // Skip signature verification if DISABLE_WEBHOOK_VERIFICATION is set to 'true'
    if (process.env.DISABLE_WEBHOOK_VERIFICATION === 'true') {
      console.log('WhatsApp webhook signature verification disabled for testing');
    } else if (signature && process.env.WHATSAPP_WEBHOOK_SECRET) {
      console.log('WhatsApp webhook secret configured:', !!process.env.WHATSAPP_WEBHOOK_SECRET);
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      
      const receivedSignature = signature.replace('sha256=', '');
      
      console.log('Expected signature:', expectedSignature);
      console.log('Received signature:', receivedSignature);
      console.log('Signatures match:', expectedSignature === receivedSignature);
      
      if (expectedSignature !== receivedSignature) {
        console.error('WhatsApp webhook signature verification failed');
        console.error('Expected:', expectedSignature);
        console.error('Received:', receivedSignature);
        return new NextResponse('Unauthorized', { status: 401 });
      }
      
      console.log('WhatsApp webhook signature verified successfully');
    } else if (signature && !process.env.WHATSAPP_WEBHOOK_SECRET) {
      console.warn('WhatsApp webhook signature received but no secret configured');
    } else {
      console.log('No WhatsApp webhook signature verification (not configured)');
    }

    // Process the webhook data
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await processMessageChange(change.value, entry.id);
            }
          }
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function processMessageChange(value: Record<string, unknown>, businessAccountId: string) {
  try {
    console.log('Processing message by:', businessAccountId);
    const { messaging_product, metadata, messages, statuses } = value;

    if (messaging_product !== 'whatsapp') {
      console.log('Ignoring non-WhatsApp message');
      return;
    }

    // Process incoming messages
    if (Array.isArray(messages)) {
      for (const message of messages) {
        await processIncomingMessage(message as Record<string, unknown>, metadata as Record<string, unknown>);
      }
    }

    // Process message status updates
    if (statuses) {
      for (const status of statuses as Record<string, unknown>[]) {
        await processMessageStatus(status as Record<string, unknown>, metadata as Record<string, unknown>);
      }
    }
  } catch (error) {
    console.error('Error processing message change:', error);
  }
}

async function processIncomingMessage(message: Record<string, unknown>, metadata: Record<string, unknown>) {
  try {
    const { id, from, timestamp, type, text, image, document, video } = message;
    
    let content = '';
    const messageType = type;

    // Extract content based on message type
    switch (type) {
      case 'text':
        content = (text as { body: string }).body || '';
        break;
      case 'image':
        content = `[Image] ${(image as { caption: string })?.caption || ''}`;
        break;
      case 'document':
        content = `[Document] ${(document as { filename: string })?.filename || 'Unknown file'}`;
        break;
      case 'audio':
        content = '[Audio message]';
        break;
      case 'video':
        content = `[Video] ${(video as { caption: string })?.caption || ''}`;
        break;
      case 'voice':
        content = '[Voice message]';
        break;
      default:
        content = `[${type}] Unsupported message type`;
    }

    // Store the incoming message in database
    const messageData = {
      message_id: id,
      from_number: from,
      to_number: metadata.phone_number_id,
      business_account_id: metadata.display_phone_number,
      message_type: messageType,
      content: content,
      direction: 'inbound' as const,
      status: 'received',
      timestamp: new Date(parseInt(timestamp as string) * 1000),
      metadata: {
        phone_number_id: metadata.phone_number_id,
        original_message: message
      }
    };

    const savedMessage = await db.upsert('whatsapp_messages', messageData, ['message_id'], ['status', 'timestamp', 'updated_at']);
    console.log('Incoming WhatsApp message stored:', id);

    // Emit socket event for new message
    try {
      emitNewMessage(savedMessage, {
        phone_number: from,
        last_message_time: new Date(parseInt(timestamp as string) * 1000).toISOString(),
        last_message_content: content,
        last_message_direction: 'inbound'
      });
      console.log('Socket event emitted for new message:', id);
    } catch (socketError) {
      console.error('Error emitting socket event:', socketError);
    }

  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

async function processMessageStatus(status: Record<string, unknown>, metadata: Record<string, unknown>) {
  try {
    const { id, status: messageStatus, timestamp, recipient_id } = status;
    console.log('Processing message status update:', { id, messageStatus, recipient_id });
    
    // Check if message exists first
    const existingMessage = await db.findOne('whatsapp_messages', { message_id: id });
    
    if (existingMessage) {
      // Update existing message status
      const [updatedCount] = await db.update(
        'whatsapp_messages',
        { message_id: id },
        {
          status: messageStatus,
          timestamp: new Date(parseInt(timestamp as string) * 1000),
          updated_at: new Date()
        }
      );

      if (updatedCount > 0) {
        console.log(`Message status updated: ${id} -> ${messageStatus}`);
        
        // Emit socket event for status update
        try {
          // For outbound messages, recipient_id is the customer's phone number
          // For inbound messages, we need to use the from_number from the existing message
          const phoneNumber = existingMessage.direction === 'outbound' 
            ? existingMessage.to_number 
            : existingMessage.from_number;
            
          emitMessageStatusUpdate(
            id as string,
            messageStatus as string,
            phoneNumber as string,
            new Date(parseInt(timestamp as string) * 1000).toISOString(),
            existingMessage.direction as string,
            existingMessage.content as string,
            existingMessage.message_type as string
          );
          console.log('Socket event emitted for status update:', id, messageStatus, 'for conversation:', phoneNumber);
        } catch (socketError) {
          console.error('Error emitting socket event for status update:', socketError);
        }
      }
    } else {
      // If message doesn't exist, it might be a status update for a message we haven't received yet
      // This can happen if the webhook receives status updates before the message itself
      console.log(`Message not found for status update: ${id}. This might be a status update for a pending message.`);
      
      // Store the status update as a placeholder that will be updated when the actual message arrives
      const statusData = {
        message_id: id,
        from_number: metadata.phone_number_id as string,
        to_number: recipient_id as string,
        business_account_id: metadata.display_phone_number as string,
        message_type: 'text',
        content: '[Status update - message content not yet received]',
        direction: 'outbound' as const,
        status: messageStatus,
        timestamp: new Date(parseInt(timestamp as string) * 1000),
        metadata: {
          status_update_only: true,
          original_status: status
        }
      };

      try {
        await db.upsert('whatsapp_messages', statusData, ['message_id'], ['status', 'timestamp', 'updated_at']);
        console.log(`Status update stored as placeholder: ${id} -> ${messageStatus}`);
      } catch (upsertError) {
        console.error('Error storing status update placeholder:', upsertError);
      }
    }

  } catch (error) {
    console.error('Error processing message status:', error);
  }
}
