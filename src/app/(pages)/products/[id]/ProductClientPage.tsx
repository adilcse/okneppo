"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Container, Card } from "@/components/common";
import ClientProductImageGallery from "./ClientProductImageGallery";
import ProductCard from "@/components/ui/ProductCard";
import { formatPrice } from "../../../../lib/types";
import ProductJsonLd from '@/components/utils/ProductJsonLd';
import BreadcrumbJsonLd from '@/components/utils/BreadcrumbJsonLd';
import { useProduct, useRelatedProducts } from "@/hooks/useProduct";
import { WHATSAPP_NUMBER } from "@/constant";

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
    data: relatedProducts = []
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
    return `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I'm%20interested%20in%20the%20${encodeURIComponent(name)}%20(Price%3A%20${encodeURIComponent(formatPrice(price))})%20from%20Ok%20Neppo.%20Product%20URL%3A%20${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}.%20Could%20you%20provide%20more%20information%3F`;
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <Container className="flex-grow flex items-center justify-center py-8 sm:py-12">
          <p className="text-xl text-gray-900 dark:text-white">Loading product...</p>
        </Container>
        </main>
    );
  }

  if (productError || !product) {
    const errorMessage = productError instanceof Error ? productError.message : "Failed to load product. Please try again later.";
    return (
      <main className="min-h-screen flex flex-col">
        <Container className="flex-grow flex items-center justify-center py-8 sm:py-12 sm:mx-0">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900 dark:text-white">Product Not Found</h1>
            <p className="mb-6 text-gray-700 dark:text-gray-300">{errorMessage}</p>
            <Link href="/products" className="inline-block bg-black dark:bg-primary text-white px-6 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors">
              Return to Products
            </Link>
          </div>
        </Container>
        </main>
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
          
          <main className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
              {/* Breadcrumbs for better navigation and SEO */}
            <Container className="pt-6 mb-2" size="full">
              <nav className="text-sm" aria-label="Breadcrumb">
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
            </Container>
              
              {/* Product Details Section */}
            <Container className="py-6 sm:mx-0" size="full">
                <div className="mb-16">
                  <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
                    {/* Product Images - Client Component */}
                    <ClientProductImageGallery 
                      images={product.images} 
                      productName={product.name} 
                    />
                    
                    {/* Product Information */}
                  <Card variant="elevated" className="w-full lg:w-1/2 p-6">
                      <h1 className="text-2xl sm:text-3xl font-semibold mb-3 text-gray-900 dark:text-white">{product.name}</h1>
                      <p className="text-xl sm:text-2xl font-medium mb-6 text-gray-900 dark:text-white">{formatPrice(product.price)}</p>
                      
                      <div className="mb-8">
                        <div className="text-gray-800 dark:text-gray-200 mb-8 prose prose-sm dark:prose-invert">
                          <div dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                        </div>
                        
                        <a 
                          ref={buttonRef}
                          href={getWhatsAppLink(product.name, product.price)}
                          target="_blank"
                          rel="noopener noreferrer"
                        className="inline-block w-full sm:w-auto bg-black dark:bg-primary text-white px-8 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors"
                        >
                          Contact About This Item
                        </a>
                      </div>
                      
                      {/* Product Details */}
                      <div className="mb-6">
                        <h2 className="text-lg sm:text-xl font-medium mb-3 text-gray-900 dark:text-white">Product Details</h2>
                        <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-gray-800 dark:text-gray-200">
                          {product.details.map((detail, index) => (
                            <li key={index}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Care Instructions */}
                      <div className="mb-6">
                        <h2 className="text-lg sm:text-xl font-medium mb-3 text-gray-900 dark:text-white">Care Instructions</h2>
                        <div className="text-sm sm:text-base text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert">
                          <div dangerouslySetInnerHTML={{ __html: product.careInstructions || '' }} />
                        </div>
                      </div>
                      
                      {/* Delivery Information */}
                      <div>
                        <h2 className="text-lg sm:text-xl font-medium mb-3 text-gray-900 dark:text-white">Delivery</h2>
                        <div className="text-sm sm:text-base text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert">
                          <div dangerouslySetInnerHTML={{ __html: product.deliveryTime || '' }} />
                        </div>
                      </div>
                  </Card>
                </div>
              </div>
              
              {/* Related Products Section */}
              {relatedProducts.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-gray-900 dark:text-white">You May Also Like</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                </div>
              )}
            </Container>
            
            {/* Sticky WhatsApp Button */}
            {showStickyButton && (
              <div className="fixed bottom-4 right-4 z-50">
                  <a 
                    href={getWhatsAppLink(product.name, product.price)}
                    target="_blank"
                    rel="noopener noreferrer"
                  className="inline-block bg-black dark:bg-primary text-white px-8 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors shadow-lg"
                  >
                    Contact About This Item
                  </a>
              </div>
            )}
          </main>
        </>
      )}
    </>
  );
} 