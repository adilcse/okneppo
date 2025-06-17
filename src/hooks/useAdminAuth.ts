import { useQuery } from '@tanstack/react-query';

interface AdminAuthResponse {
  authenticated: boolean;
  message?: string;
  error?: string;
}

export function useAdminAuth() {
  const { data, isLoading, error } = useQuery<AdminAuthResponse>({
    queryKey: ['adminAuth'],
    queryFn: async () => {
      const response = await fetch('/api/admin/isauthenticated');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    error: error instanceof Error ? error.message : 'Authentication error',
  };
} 