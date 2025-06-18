import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
  className?: string;
  showDescription?: boolean;
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  category,
  description,
  className = '',
  showDescription = false
}: ProductCardProps) {
  return (
    <Link href={`/products/${id}`} className={`group block ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md dark:shadow-gray-900/30 dark:hover:shadow-gray-900/50 transition-all border border-gray-100 dark:border-gray-700">
        <div className="h-52 sm:h-64 relative overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800">
              No Image
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-lg sm:text-xl font-medium mb-1 text-gray-900 dark:text-white truncate">{name}</h3>
          
          {category && (
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-2">{category}</p>
          )}
          
          {showDescription && description && (
            <div className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2 prose prose-sm dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          )}
          
          <p className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white">{formatPrice(price)}</p>
        </div>
      </div>
    </Link>
  );
} 