import { Product } from '@/lib/types';

interface ProductJsonLdProps {
  product: Product;
  url: string;
}

/**
 * Generates JSON-LD structured data for a product according to schema.org standards
 * This improves SEO by helping search engines understand product details
 */
export default function ProductJsonLd({ product, url }: ProductJsonLdProps) {
  // Format price with currency symbol for display
  const formattedPrice = typeof product.price === 'number' 
    ? `₹${product.price.toLocaleString('en-IN')}`
    : `₹${product.price}`;

  // Create the structured data object following schema.org Product schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => {
      // Ensure absolute URLs for images
      return img.startsWith('http') ? img : `https://okneppo.in${img}`;
    }),
    offers: {
      '@type': 'Offer',
      price: formattedPrice,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: url
    },
    brand: {
      '@type': 'Brand',
      name: 'Ok Neppo'
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Nishad Fatma'
    },
    category: product.category,
    // If you have product identifiers like SKU, add them here
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
} 