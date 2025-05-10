import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

/**
 * Login to admin panel
 */
async function loginAdmin(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await axiosClient.post('/api/admin/login', credentials);
    
    if (response.data.token) {
      // Store token in cookie
      Cookies.set('admin-token', response.data.token, { 
        expires: 7, // 7 days
        path: '/' 
      });
    }
    
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || 'Login failed');
  }
}

/**
 * Log out from admin panel
 */
function logoutAdmin(): void {
  Cookies.remove('admin-token', { path: '/' });
}

/**
 * Check if user is authenticated
 */
function isAuthenticated(): boolean {
  return !!Cookies.get('admin-token');
}

/**
 * Custom hook for admin authentication
 */
export function useAdminAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const loginMutation = useMutation({
    mutationFn: loginAdmin,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries(); // Invalidate all queries after login
        router.push('/admin/dashboard');
      }
    }
  });
  
  const logout = () => {
    logoutAdmin();
    queryClient.clear(); // Clear the query cache on logout
    router.push('/admin/login');
  };
  
  return {
    login: loginMutation.mutate,
    logout,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
    isAuthenticated
  };
} 