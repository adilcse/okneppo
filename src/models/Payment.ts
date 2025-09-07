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
  created_at: Date;
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
} 