'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Product } from '@/lib/types';

interface ClientProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ClientProductDetail({ product, relatedProducts }: ClientProductDetailProps) {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <main>
      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Product Images */}
          <div className="w-full lg:w-1/2">
            <div className="relative h-72 sm:h-96 mb-4 bg-gray-100 rounded-lg overflow-hidden group">
              {/* Main product image */}
              <Image 
                src={product.images[activeImage]} 
                alt={product.name} 
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            
            {/* Thumbnail row - only shown if product has multiple images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button 
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`relative h-20 sm:h-24 rounded-md overflow-hidden group cursor-pointer border-2 ${activeImage === index ? 'border-black' : 'border-transparent'}`}
                    aria-label={`View image ${index + 1} of ${product.name}`}
                    aria-pressed={activeImage === index}
                  >
                    <Image 
                      src={image} 
                      alt={`${product.name} view ${index + 1}`} 
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 768px) 25vw, 15vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="w-full lg:w-1/2">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product.name}</h1>
            <div className="text-sm text-gray-500 mb-4">Category: {product.category}</div>
            <div className="text-xl sm:text-2xl font-bold mb-6">{product.price}</div>
            
            <p className="text-gray-700 mb-6 text-sm sm:text-base">{product.description}</p>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-base sm:text-lg">Details:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm sm:text-base">
                {product.details.map((detail, index) => (
                  <li key={index} className="text-gray-700">{detail}</li>
                ))}
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-base sm:text-lg">Care Instructions:</h3>
              <p className="text-gray-700 text-sm sm:text-base">{product.careInstructions}</p>
            </div>
            
            <div className="mb-8">
              <h3 className="font-semibold mb-2 text-base sm:text-lg">Delivery Time:</h3>
              <p className="text-gray-700 text-sm sm:text-base">{product.deliveryTime}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="w-full sm:w-auto px-4 sm:px-8">Order Now</Button>
              <Link href="/contact">
                <Button variant="outline" className="w-full sm:w-auto">Book Consultation</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Products */}
      <section className="bg-gray-50 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">You May Also Like</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map((relProduct) => (
              <Card key={relProduct.id} className="overflow-hidden">
                <div className="h-40 sm:h-48 relative mb-4 overflow-hidden group">
                  <Image 
                    src={relProduct.images[0]} 
                    alt={relProduct.name} 
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1">{relProduct.name}</h3>
                <p className="text-gray-600 mb-3 text-xs sm:text-sm line-clamp-2">{relProduct.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold">{relProduct.price}</span>
                  <Link href={`/products/${relProduct.id}`}>
                    <Button variant="outline" className="text-sm">View Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
} 