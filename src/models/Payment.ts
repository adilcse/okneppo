export enum PaymentStatus {
  CREATED = 'created',
  CAPTURED = 'captured',
  FAILED = 'failed',
}

export interface Payment {
  id: string; // UUID
  registration_id: number;
  order_number?: string; // 6-digit alphanumeric order number
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  coupon_code?: string;
  // Additional payment data from webhook
  invoice_id?: string;
  payment_method?: string;
  amount_refunded?: number;
  refund_status?: string;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  captured?: boolean;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, unknown>;
  created_at: Date;
  updated_at?: Date;
}

export interface PaymentCreationAttributes {
  registration_id: number;
  order_number?: string; // 6-digit alphanumeric order number
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  coupon_code?: string;
  // Additional payment data from webhook
  invoice_id?: string;
  payment_method?: string;
  amount_refunded?: number;
  refund_status?: string;
  description?: string;
  card_id?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  captured?: boolean;
  fee?: number;
  tax?: number;
  error_code?: string;
  error_description?: string;
  error_source?: string;
  error_step?: string;
  error_reason?: string;
  acquirer_data?: Record<string, unknown>;
} 