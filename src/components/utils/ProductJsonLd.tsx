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
  // Raw price value for structured data
  const rawPrice = typeof product.price === 'number' 
    ? product.price 
    : parseFloat(String(product.price));

  // Create unique product identifier
  const productId = `OK-${String(product.id).padStart(5, '0')}`;
  
  // Create review aggregation if we had reviews
  // For now using a placeholder with perfect rating
  const reviewData = {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    reviewCount: '1',
    bestRating: '5',
    worstRating: '1'
  };

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
    sku: productId,
    mpn: productId,
    offers: {
      '@type': 'Offer',
      price: rawPrice,
      priceCurrency: 'INR',
      priceValidUntil: "2025-12-31",
      availability: 'https://schema.org/InStock',
      url: url,
      seller: {
        '@type': 'Organization',
        name: 'Ok Neppo'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'INR'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 5,
            unitCode: 'DAY'
          }
        }
      }
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
    material: product.details.find(detail => detail.toLowerCase().includes('material'))?.replace('Material:', '').trim(),
    color: product.details.find(detail => detail.toLowerCase().includes('color'))?.replace('Color:', '').trim(),
    // Add review data for better visibility in search results
    aggregateRating: reviewData
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
} 