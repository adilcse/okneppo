'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ClientProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ClientProductImageGallery({ images, productName }: ClientProductImageGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="w-full lg:w-1/2">
      <div className="relative h-72 sm:h-96 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden group">
        <Image 
          src={images[activeImage]} 
          alt={productName} 
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
      
      {/* Thumbnail row - only shown if product has multiple images */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button 
              key={index}
              onClick={() => setActiveImage(index)}
              className={`relative h-20 sm:h-24 rounded-md overflow-hidden group cursor-pointer border-2 ${activeImage === index ? 'border-black dark:border-primary' : 'border-transparent'}`}
              aria-label={`View image ${index + 1} of ${productName}`}
              aria-pressed={activeImage === index}
            >
              <Image 
                src={image} 
                alt={`${productName} view ${index + 1}`} 
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 25vw, 15vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 