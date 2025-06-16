'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: number;
  image_url: string;
  display_order: number;
}

interface GalleryResponse {
  images: GalleryImage[];
  nextCursor: number | null;
}

const fetchGalleryImages = async ({ pageParam = 0 }: { pageParam: number }): Promise<GalleryResponse> => {
  const response = await fetch(`/api/gallery?cursor=${pageParam}&limit=5`);
  if (!response.ok) {
    throw new Error('Failed to fetch gallery images');
  }
  return response.json();
};

export default function GalleryPage() {
  const { ref, inView } = useInView();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['gallery'],
    queryFn: fetchGalleryImages,
    getNextPageParam: (lastPage: GalleryResponse) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-red-500">
            <p>Error: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const allImages = data.pages.flatMap((page: GalleryResponse) => page.images);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Our Gallery
        </h1>
        
        {allImages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>No images available in the gallery.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allImages.map((image: GalleryImage) => (
                <div
                  key={image.id}
                  className="relative aspect-square overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <Image
                    src={image.image_url}
                    alt={`Gallery image ${image.id}`}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority={image.display_order < 8}
                  />
                </div>
              ))}
            </div>

            {/* Loading indicator */}
            <div
              ref={ref}
              className="flex justify-center items-center h-20 mt-8"
            >
              {isFetchingNextPage && (
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 