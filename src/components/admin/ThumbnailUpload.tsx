"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiX, FiImage } from 'react-icons/fi';
import { uploadImage } from '@/lib/imageUpload';
import Image from 'next/image';
import { removeImageFromUrl } from '@/lib/clientUtils';

interface ThumbnailUploadProps {
  value: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function ThumbnailUpload({ 
  value, 
  onChange, 
  onError,
  className = '' 
}: ThumbnailUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadImage(file, {
        onProgressUpdate: (progress) => {
          const fileId = Object.keys(progress)[0];
          if (fileId) {
            setUploadProgress(progress[fileId]);
          }
        },
        onError: (error) => {
          console.error('Upload error:', error);
          onError?.(error);
          setIsUploading(false);
          setUploadProgress(0);
        },
        onSuccess: (filePath) => {
          onChange(filePath);
          setIsUploading(false);
          setUploadProgress(0);
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      onError?.('Failed to upload image. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onChange, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB max size
  });

  const handleRemoveImage = () => {
    if (window.confirm('Are you sure you want to remove this thumbnail?')) {
        removeImageFromUrl(value);
      onChange('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Uploading...</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        ) : value ? (
          <div className="space-y-4">
            <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <Image
                src={value}
                alt="Course thumbnail"
                fill
                className="object-cover"
                onError={() => {
                  onError?.('Failed to load image');
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-lg opacity-90 hover:opacity-100"
                title="Remove thumbnail"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Click to change thumbnail</p>
              <p className="text-xs text-gray-500">or drag and drop a new image</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FiImage className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {isDragActive ? 'Drop the image here' : 'Upload course thumbnail'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Drag and drop an image here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports: JPG, PNG, GIF, WebP (max 5MB)
              </p>
            </div>
            <div className="flex justify-center">
              <FiUpload className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
