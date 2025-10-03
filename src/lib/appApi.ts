import { AdminPaginationData } from '@/types/api';
import axios from 'axios';
import Cookies from 'js-cookie';

// Determine the app API base URL
const getAppApiBaseUrl = () => {
  // If running on the server during build
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || '';
  }
  
  // If running in the browser, use the configured app URL
  return process.env.NEXT_PUBLIC_APP_URL || '';
};

// Create an axios instance for app API calls
const appAxiosClient = axios.create({
  baseURL: getAppApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Include credentials (cookies) with every request
  withCredentials: true,
  // Timeout requests after 30 seconds
  timeout: 30000,
});

// Add a request interceptor for handling tokens and other modifications
appAxiosClient.interceptors.request.use(
  (config) => {
    // For server-side requests that need the full URL
    if (typeof window === 'undefined' && config.url && !config.url.startsWith('http')) {
      config.url = `${getAppApiBaseUrl()}${config.url}`;
    }
    
    // Add admin token to request if it exists (for app API endpoints)
    const adminToken = Cookies.get('admin-token');
    if (adminToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // Add a timestamp to prevent caching
    const separator = config.url?.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}t=${new Date().getTime()}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
appAxiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Create a more readable error
    if (error.response) {
      // Server responded with a status code outside of 2xx
      error.message = `App API request failed with status ${error.response.status}: ${error.response.statusText}`;
      
      // Handle auth errors
      if (error.response.status === 401) {
        // Clear admin token if it's invalid
        // Cookies.remove('admin-token', { path: '/' });
        
        // // If we're in the browser, redirect to login page
        // if (typeof window !== 'undefined') {
        //   // Use a timeout to avoid immediate redirect during render
        //   setTimeout(() => {
        //     window.location.href = '/admin/login';
        //   }, 100);
        // }
      }
    } else if (error.request) {
      // Request was made but no response received
      error.message = 'No response received from app API. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// App API client for external API calls
class AppApiClient {

  // Generic request method
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
    params?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await appAxiosClient({
        method,
        url: `/api${endpoint}`,
        data,
        params,
      });
      return response.data;
    } catch (error: unknown) {
      console.error(`App API Error (${method} ${endpoint}):`, error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data?: { message?: string }; status: number } };
        // Server responded with error status
        throw new Error(axiosError.response.data?.message || `Server error: ${axiosError.response.status}`);
      } else if (error && typeof error === 'object' && 'request' in error) {
        // Request was made but no response received
        throw new Error('Network error: Unable to connect to app API');
      } else {
        // Something else happened
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new Error(errorMessage);
      }
    }
  }

  // Course management methods
  async getCourses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    all?: string;
}) {
    return this.request<AppApiResponse<AppCourse[]>>('GET', '/courses', undefined, params);
  }

  async getCourse(id: string | number) {
    return this.request<AppApiResponse<AppCourse>>('GET', `/courses/${id}`);
  }

  async createCourse(courseData: {
    title: string;
    description: string;
    price: number;
    thumbnail?: string;
    duration?: number;
    level?: 'beginner' | 'intermediate' | 'advanced';
    category?: string;
    isPublished?: boolean;
    totalLessons?: number;
  }) {
    return this.request<AppApiResponse<AppCourse>>('POST', '/courses', courseData);
  }

  async updateCourse(id: string | number, courseData: Partial<{
    title: string;
    description: string;
    price: number;
    thumbnail: string;
    duration: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    isPublished: boolean;
    totalLessons: number;
  }>) {
    return this.request<AppApiResponse<AppCourse>>('PUT', `/courses/${id}`, courseData);
  }

  async deleteCourse(id: string | number) {
    return this.request<AppApiResponse<unknown>>('DELETE', `/courses/${id}`);
  }

  // User management methods (for future use)
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return this.request<AppApiResponse<AppUser[]>>('GET', '/users', undefined, params);
  }

  async getUser(id: string | number) {
    return this.request<AppApiResponse<AppUser>>('GET', `/users/${id}`);
  }

  // Analytics methods (for future use)
  async getAnalytics() {
    return this.request<AppApiResponse<unknown>>('GET', '/analytics');
  }

  async getCourseAnalytics(courseId: string | number) {
    return this.request<AppApiResponse<unknown>>('GET', `/analytics/courses/${courseId}`);
  }
}

// Create and export a singleton instance
const appApi = new AppApiClient();
export default appApi;

// Export types for better TypeScript support
export interface AppCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  duration?: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  isPublished: boolean;
  publishedAt?: string;
  totalLessons: number;
  rating: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AppApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: AdminPaginationData;
}
