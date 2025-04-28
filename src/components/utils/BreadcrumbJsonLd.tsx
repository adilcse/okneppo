interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * Generates JSON-LD structured data for breadcrumbs according to schema.org standards
 * This improves SEO by helping search engines understand the site structure
 */
export default function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const baseUrl = 'https://okneppo.in';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url ? (item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`) : undefined
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
} 