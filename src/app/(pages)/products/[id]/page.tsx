import { Metadata } from 'next';
import { getProduct } from "../../../../lib/api";
import { generateSEOMetadata } from "../../../../components/utils/SEOMetaTags";
import ProductClientPage from "./ProductClientPage";

// Generate metadata for the product detail page dynamically
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  try {
    const { product } = await getProduct(params.id);
    
    return generateSEOMetadata({
      title: `${product.name} | Ok Neppo`,
      description: product.description,
      ogImage: product.images[0],
      ogType: 'website',
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
  return <ProductClientPage params={params} />;
} 