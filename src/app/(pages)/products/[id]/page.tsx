import { Metadata } from 'next';
import { generateSEOMetadata } from "../../../../components/utils/SEOMetaTags";
import ProductClientPage from "./ProductClientPage";
import { Product, formatPrice } from "../../../../lib/types";
import axiosClient from '@/lib/axios';

// Generate metadata for the product detail page dynamically
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  try {
    // Fetch product data to use in the metadata
    const response = await axiosClient.get(`/api/products/${params.id}`);
    
    const product: Product = response.data;
    
    // Extract primary image URL
    const imageUrl = product.images && product.images.length > 0 
      ? product.images[0] 
      : `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/images/default-product.jpg`;
    
    // Format price for display
    const formattedPrice = formatPrice(product.price);
    
    // Create product-specific metadata title and description
    const title = `${product.name} | Ok Neppo`;
    const description = product.description
      ? (product.description.length > 155 ? product.description.substring(0, 152) + '...' : product.description)
      : `${product.name} - ${formattedPrice} | Shop fashion items at Ok Neppo.`;
    
    // Generate metadata using the existing utility function
    const metadata = generateSEOMetadata({
      title,
      description,
      keywords: [product.name, product.category, 'fashion', 'clothing', 'Ok Neppo'],
      ogImage: imageUrl,
      // Using 'website' since 'product' isn't a valid type in the current implementation
      ogType: 'website',
      twitterCard: 'summary_large_image',
    });
    
    // Add additional structured metadata for the product
    const enhancedMetadata: Metadata = {
      ...metadata,
      // Add custom metadata for product structured data
      other: {
        'product:price:amount': product.price.toString(),
        'product:price:currency': 'INR',
        'product:availability': 'in stock'
      }
    };
    
    return enhancedMetadata;
  } catch (error) {
    console.error('Error generating metadata for product ID:', params.id, error);
    return generateSEOMetadata({
      title: 'Product | Ok Neppo',
      description: 'Discover unique fashion items at Ok Neppo.',
    });
  }
}

// Revalidate the product page every hour
export const revalidate = 3600;

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  console.log("Server rendering product page for ID:", params.id);
  
  // Validate that the ID is correct to prevent redirects
  if (!params.id || isNaN(Number(params.id))) {
    console.error("Invalid product ID:", params.id);
  }
  return <ProductClientPage params={params} />;
} 