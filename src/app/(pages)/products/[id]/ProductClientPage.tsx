"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/layout/Footer";
import ClientProductImageGallery from "./ClientProductImageGallery";
import ProductCard from "@/components/ui/ProductCard";
import { formatPrice } from "../../../../lib/types";
import ProductJsonLd from '@/components/utils/ProductJsonLd';
import BreadcrumbJsonLd from '@/components/utils/BreadcrumbJsonLd';
import { useProduct, useRelatedProducts } from "@/hooks/useProduct";

// Helper function to format text with line breaks
function formatText(text: string): React.ReactNode {
  if (!text) return '';

  // Split text by newline character
  const parts = text.split(`\n`);
  // If there are no special newline characters, return plain text
  if (parts.length === 1) return text;
  
  // Create an array of elements with line breaks
  return parts.map((part, index) => (
    <React.Fragment key={index}>
      {part}
      {index < parts.length - 1 && <br />}
    </React.Fragment>
  ));
}

export default function ProductClientPage({ params }: { params: { id: string } }) {
  const [showStickyButton, setShowStickyButton] = useState(false);
  const buttonRef = useRef<HTMLAnchorElement>(null);
  
  // Fetch product data using React Query
  const { 
    data: product,
    isLoading,
    error: productError
  } = useProduct(params.id);
  
  // Fetch related products if product data is available
  const {
    data: relatedProducts = [],
    isLoading: relatedLoading
  } = useRelatedProducts(
    product?.category,
    params.id,
    3
  );

  // Add scroll event listener to check if button is in viewport
  useEffect(() => {
    const handleScroll = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const isVisible = (
          rect.top >= 0 &&
          rect.bottom <= window.innerHeight
        );
        setShowStickyButton(!isVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [product]);

  // Function to create WhatsApp link with product details
  const getWhatsAppLink = (name: string, price: number) => {
    return `https://wa.me/918249517832?text=Hello%2C%20I'm%20interested%20in%20the%20${encodeURIComponent(name)}%20(Price%3A%20${encodeURIComponent(formatPrice(price))})%20from%20Ok%20Neppo.%20Product%20URL%3A%20${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}.%20Could%20you%20provide%20more%20information%3F`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Header />
        <main className="w-full flex-grow container mx-auto px-4 py-8 sm:py-12 flex items-center justify-center bg-white dark:bg-gray-900">
          <p className="text-xl text-gray-900 dark:text-white">Loading product...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (productError || !product) {
    const errorMessage = productError instanceof Error ? productError.message : "Failed to load product. Please try again later.";
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 sm:py-12 flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Product Not Found</h1>
            <p className="mb-6 text-gray-700 dark:text-gray-300">{errorMessage}</p>
            <Link href="/products" className="bg-black dark:bg-primary text-white px-6 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors">
              Return to Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      {product && (
        <>
          <ProductJsonLd 
            product={product} 
            url={typeof window !== 'undefined' ? window.location.href : `https://okneppo.in/products/${product.id}`} 
          />
          
          <BreadcrumbJsonLd 
            items={[
              { name: 'Home', url: '/' },
              { name: 'Products', url: '/products' },
              { name: product.name }
            ]}
          />
          
          <div className="min-h-screen flex flex-col">
            <Header />
            
            <main className="flex-grow bg-white dark:bg-gray-900">
              {/* Breadcrumbs for better navigation and SEO */}
              <nav className="container mx-auto px-4 pt-6 mb-2 text-sm" aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center">
                  <li className="flex items-center">
                    <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Home</Link>
                    <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
                  </li>
                  <li className="flex items-center">
                    <Link href="/products" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Products</Link>
                    <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-gray-900 dark:text-white">{product.name}</span>
                  </li>
                </ol>
              </nav>
              
              {/* Product Details Section */}
              <div className="container mx-auto px-4 py-6">
                <div className="mb-16">
                  <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
                    {/* Product Images - Client Component */}
                    <ClientProductImageGallery 
                      images={product.images} 
                      productName={product.name} 
                    />
                    
                    {/* Product Information */}
                    <div className="w-full lg:w-1/2">
                      <h1 className="text-2xl sm:text-3xl font-semibold mb-3 text-gray-900 dark:text-white">{product.name}</h1>
                      <p className="text-xl sm:text-2xl font-medium mb-6 text-gray-900 dark:text-white">{formatPrice(product.price)}</p>
                      
                      <div className="mb-8">
                        <p className="text-gray-800 dark:text-gray-200 mb-8">
                          {formatText(product.description)}
                        </p>
                        
                        <a 
                          ref={buttonRef}
                          href={getWhatsAppLink(product.name, product.price)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto bg-black dark:bg-primary text-white px-8 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors inline-block"
                        >
                          Contact About This Item
                        </a>
                      </div>
                      
                      {/* Product Details */}
                      <div className="mb-6">
                        <h2 className="text-lg sm:text-xl font-medium mb-3 text-gray-900 dark:text-white">Product Details</h2>
                        <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-gray-800 dark:text-gray-200">
                          {product.details.map((detail, index) => (
                            <li key={index}>{formatText(detail)}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Care Instructions */}
                      <div className="mb-6">
                        <h2 className="text-lg sm:text-xl font-medium mb-3 text-gray-900 dark:text-white">Care Instructions</h2>
                        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200">
                          {formatText(product.careInstructions)}
                        </p>
                      </div>
                      
                      {/* Delivery Information */}
                      <div>
                        <h2 className="text-lg sm:text-xl font-medium mb-3 text-gray-900 dark:text-white">Delivery</h2>
                        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200">
                          Estimated delivery time: {formatText(product.deliveryTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Related Products Section */}
              {relatedProducts.length > 0 && (
                <div className="container mx-auto px-4 py-6 mb-8">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">You May Also Like</h2>
                  {relatedLoading ? (
                    <p className="text-gray-500">Loading related products...</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {relatedProducts.map((relatedProduct) => (
                        <ProductCard
                          key={relatedProduct.id}
                          id={relatedProduct.id}
                          name={relatedProduct.name}
                          price={relatedProduct.price}
                          image={relatedProduct.images[0]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
            
            {/* Sticky Contact Button that appears when original button is out of view */}
            {showStickyButton && (
              <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white dark:bg-gray-900 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] border-t border-gray-200 dark:border-gray-700">
                <div className="container mx-auto flex justify-center">
                  <a 
                    href={getWhatsAppLink(product.name, product.price)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:max-w-md bg-black dark:bg-primary text-white px-6 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors text-center font-medium"
                  >
                    Contact About This Item
                  </a>
                </div>
              </div>
            )}
            
            <Footer />
          </div>
        </>
      )}
    </>
  );
} 