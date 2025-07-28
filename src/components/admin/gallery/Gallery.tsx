"use client";
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { DndProvider, useDrag, useDrop, DragSourceMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import update from 'immutability-helper';
import { FaTrash } from 'react-icons/fa';
import { uploadImage } from '@/lib/imageUpload';
import { removeImageFromUrl } from '@/lib/clientUtils';
import Image from 'next/image';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';

interface Image {
  id: number;
  image_url: string;
  display_order: number;
}

interface GalleryResponse {
  images: Image[];
  nextCursor: number | null;
}

interface ImageProps {
  image: Image;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  deleteImage: (index: number) => void;
}

const fetchGalleryImages = async ({ pageParam = 0 }: { pageParam: number }): Promise<GalleryResponse> => {
  const response = await fetch(`/api/gallery?cursor=${pageParam}&limit=5`);
  if (!response.ok) {
    throw new Error('Failed to fetch gallery images');
  }
  return response.json();
};

const Gallery: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
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
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const updateImageOrder = async (newImages: Image[]) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ images: newImages }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update image order');
      }
      // Invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    } catch (error) {
      console.error('Error updating image order:', error);
    }
  };

  const debouncedUpdateOrder = useCallback((newImages: Image[]) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateImageOrder(newImages);
    }, 1500); // Wait for 1500ms of no movement before updating
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadImage(file, {
        onProgressUpdate: (progress) => setUploadProgress(progress),
        onError: (error) => {
          console.error('Upload error:', error);
        },
        onSuccess: async (filePath) => {
          try {
            const response = await fetch('/api/gallery', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                imageUrl: filePath,
                display_order: 0 
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to save image to gallery');
            }

            // Invalidate the query to refetch the data
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
          } catch (error) {
            console.error('Error saving image to gallery:', error);
          }
        }
      });
    }
  }, [queryClient, data]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
  } as DropzoneOptions);

  const moveImage = (dragIndex: number, hoverIndex: number) => {
    if (!data) return;
    
    const allImages = data.pages.flatMap(page => page.images);
    const draggedImage = allImages[dragIndex];
    const newImages = update(allImages, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, draggedImage],
      ],
    });
    debouncedUpdateOrder(newImages);
  };

  const deleteImage = async (index: number) => {
    if (!data) return;
    
    const allImages = data.pages.flatMap(page => page.images);
    const image = allImages[index];
    
    try {
      const deleteUrl = await removeImageFromUrl(image.image_url);
      if (!deleteUrl) {
        throw new Error('Failed to delete image');
      }
      const response = await fetch(`/api/gallery?id=${image.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Invalidate the query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const isTouchDevice = () => {
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    return false;
  };

  const DndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;

  if (status === 'pending') {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }

  const allImages = data.pages.flatMap(page => page.images);

  return (
    <DndProvider backend={DndBackend}>
      <div className="container mx-auto p-4">
        <div {...getRootProps()} className="border-dashed border-2 border-gray-300 p-10 text-center cursor-pointer">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag &apos;n&apos; drop some files here, or click to select files</p>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {allImages.map((image, index) => (
            <DraggableImage key={image.id} index={index} image={image} moveImage={moveImage} deleteImage={deleteImage} />
          ))}
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  Uploading...
                </p>
                <div className="w-full px-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
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
      </div>
    </DndProvider>
  );
};

const DraggableImage: React.FC<ImageProps> = ({ image, index, moveImage, deleteImage }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'image',
    hover(item: { index: number }) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'image',
    item: { id: image.id, index },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative"
    >
      <Image src={image.image_url} alt="gallery" className="w-full h-auto" width={100} height={100} />
      <button
        onClick={() => deleteImage(index)}
        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
      >
        <FaTrash />
      </button>
    </div>
  );
};

export default Gallery; 