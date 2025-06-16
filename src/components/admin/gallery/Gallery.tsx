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

interface Image {
  id: number;
  image_url: string;
  display_order: number;
}

interface ImageProps {
  image: Image;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  deleteImage: (index: number) => void;
}

const Gallery: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => {
        setImages(data);
      })
      .catch(error => {
        console.error('Error fetching gallery images:', error);
      });

    // Cleanup timeout on component unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
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
              body: JSON.stringify({ imageUrl: filePath }),
            });

            if (!response.ok) {
              throw new Error('Failed to save image to gallery');
            }

            const data = await response.json();
            setImages(prevImages => [...prevImages, data.image]);
          } catch (error) {
            console.error('Error saving image to gallery:', error);
          }
        }
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
  } as DropzoneOptions);

  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const draggedImage = images[dragIndex];
    const newImages = update(images, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, draggedImage],
      ],
    });
    setImages(newImages);
    debouncedUpdateOrder(newImages);
  };

  const deleteImage = async (index: number) => {
    const image = images[index];
    
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

      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      updateImageOrder(newImages);
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
          {images.map((image, index) => (
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
      <Image src={image.image_url} alt="gallery" className="w-full h-auto" />
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