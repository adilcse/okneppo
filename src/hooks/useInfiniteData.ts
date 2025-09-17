import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfiniteDataOptions<T> {
  queryKey: (string | number | boolean | object)[];
  queryFn: (pageParam: number) => Promise<{
    data: T[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;
  initialPageParam?: number;
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

export function useInfiniteData<T>({
  queryKey,
  queryFn,
  initialPageParam = 1,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus = false
}: UseInfiniteDataOptions<T>) {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => queryFn(pageParam as number),
    initialPageParam,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage 
        ? lastPage.pagination.page + 1 
        : undefined;
    },
    enabled,
    staleTime,
    refetchOnWindowFocus
  });

  // Flatten all pages data
  const allData = data?.pages.flatMap(page => page.data) ?? [];
  
  // Get pagination info from the last page
  const pagination = data?.pages[data.pages.length - 1]?.pagination;

  return {
    data: allData,
    pagination,
    error,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  };
}
