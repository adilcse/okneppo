"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/layout/Footer";
import ClientProductImageGallery from "./ClientProductImageGallery";
import { Product } from "../../../../lib/types";

// Mock product data function for client-side
async function getProductClientSide(id: string): Promise<{ 
  product: Product; 
  relatedProducts: Product[] 
}> {
  try {
    // Fetch from API route instead of directly using the server-only getProduct
    const response = await fetch(`/api/products/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export default function ProductClientPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        console.log('Loading product with ID:', params.id);
        
        const data = await getProductClientSide(params.id);
        
        if (!data || !data.product) {
          throw new Error('Product data is incomplete or missing');
        }
        
        console.log('Product data loaded:', data.product.name);
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts || []);
        setError(null);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error("Error loading product:", errorMessage);
        setError("Failed to load product. Please try again later.");
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 sm:py-12 flex items-center justify-center">
          <p className="text-xl">Loading product...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 sm:py-12 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Product Not Found</h1>
            <p className="mb-6">{error || "The requested product could not be found."}</p>
            <Link href="/products" className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
              Return to Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
        {/* Product Details Section */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
            {/* Product Images - Client Component */}
            <ClientProductImageGallery 
              images={product.images} 
              productName={product.name} 
            />
            
            {/* Product Information */}
            <div className="w-full lg:w-1/2">
              <h1 className="text-2xl sm:text-3xl font-semibold mb-3">{product.name}</h1>
              <p className="text-xl sm:text-2xl font-medium mb-6">{product.price}</p>
              
              <div className="mb-8">
                <p className="text-gray-800 mb-8">{product.description}</p>
                
                <a 
                  href={`https://wa.me/918249517832?text=Hello%2C%20I'm%20interested%20in%20the%20${encodeURIComponent(product.name)}%20(Price%3A%20${encodeURIComponent(product.price)})%20from%20Ok%20Neppo.%20Product%20URL%3A%20${encodeURIComponent(window.location.href)}.%20Could%20you%20provide%20more%20information%3F`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors inline-block"
                >
                  Contact About This Item
                </a>
              </div>
              
              {/* Product Details */}
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-medium mb-3">Product Details</h2>
                <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-gray-800">
                  {product.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>
              
              {/* Care Instructions */}
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-medium mb-3">Care Instructions</h2>
                <p className="text-sm sm:text-base text-gray-800">{product.careInstructions}</p>
              </div>
              
              {/* Delivery Information */}
              <div>
                <h2 className="text-lg sm:text-xl font-medium mb-3">Delivery</h2>
                <p className="text-sm sm:text-base text-gray-800">
                  Estimated delivery time: {product.deliveryTime}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {relatedProducts.map((relatedProduct) => (
                <Link href={`/products/${relatedProduct.id}`} key={relatedProduct.id}>
                  <div className="group cursor-pointer">
                    <div className="relative h-52 sm:h-64 bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium">{relatedProduct.name}</h3>
                    <p className="text-gray-800 font-medium">{relatedProduct.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
} 