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
  createdAt: Date;
  updatedAt: Date;
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