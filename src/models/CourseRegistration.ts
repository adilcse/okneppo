import { Payment } from "./Payment";

export enum RegistrationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface CourseRegistration {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  highestQualification?: string;
  aadharNumber?: string;
  dateOfBirth?: string;
  profession?: string;
  termsAccepted: boolean;
  courseId: number;
  courseTitle: string;
  amountDue: number;
  status: RegistrationStatus;
  orderNumber?: string; // 6-digit alphanumeric order number from payment
  createdAt: Date;
  payment?: Payment[];
}

export interface CourseRegistrationCreationAttributes {
  name: string;
  address: string;
  phone: string;
  email: string;
  highestQualification?: string;
  aadharNumber?: string;
  dateOfBirth?: string;
  profession?: string;
  termsAccepted: boolean;
  courseId: number;
  courseTitle: string;
  amountDue: number;
  status?: RegistrationStatus;
} 