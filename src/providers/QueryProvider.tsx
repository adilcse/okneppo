'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider configures and provides React Query functionality to the application
 * with optimized caching settings.
 */
export default function QueryProvider({ children }: QueryProviderProps) {
  // Create a client for each session to prevent shared state across users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 10 minutes (600000 ms)
        staleTime: 10 * 60 * 1000,
        
        // Keep unused data in cache for 15 minutes
        gcTime: 15 * 60 * 1000,
        
        // Don't refetch on window focus by default
        refetchOnWindowFocus: false,
        
        // Retry failed queries 1 time
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 