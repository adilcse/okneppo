import { Metadata } from 'next';
import { generateSEOMetadata } from "../../../../components/utils/SEOMetaTags";
import ProductClientPage from "./ProductClientPage";

// Generate metadata for the product detail page dynamically
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  try {
    // Use a simple metadata approach that doesn't rely on getProduct
    return generateSEOMetadata({
      title: `Product Details | Ok Neppo`,
      description: "View detailed information about this product from Ok Neppo.",
    });
  } catch (error) {
    console.error('Error generating metadata for product ID:', params.id, error);
    return generateSEOMetadata({
      title: 'Product Not Found | Ok Neppo',
      description: 'The requested product could not be found.',
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