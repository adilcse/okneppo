import { Product } from '@/models/Product';
import { Subject, Course } from '@/types/course';

// Products API Response Types
export interface GetProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GetProductResponse {
  id: number;
  name: string;
  price: string;
  images: string[];
  category: string;
  description: string;
  details: string[];
  careInstructions: string;
  deliveryTime: string;
  featured: boolean;
}

export interface CreateProductResponse {
  success: boolean;
  product: Product;
}

export interface UpdateProductResponse {
  success: boolean;
  product: Product;
}

export interface DeleteProductResponse {
  success: boolean;
  message: string;
  imagesDeletionSummary?: {
    totalImages: number;
    deletedImages: number;
    failedImages: number;
  };
}

// Products API Request Types
export interface GetProductsRequest {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductRequest {
  name: string;
  price: string;
  images: string[];
  category: string;
  description?: string;
  details?: string[];
  careInstructions?: string;
  deliveryTime?: string;
  featured?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  price?: string;
  images?: string[];
  category?: string;
  description?: string;
  details?: string[];
  careInstructions?: string;
  deliveryTime?: string;
  featured?: boolean;
}

// API Error Response Type
export interface ApiErrorResponse {
  error: string;
  status?: number;
}

export interface GetSubjectsRequest {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetSubjectsResponse {
  subjects: Subject[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface GetCoursesRequest {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetCoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}