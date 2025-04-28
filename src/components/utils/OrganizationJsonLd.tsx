/**
 * Generates JSON-LD structured data for the organization according to schema.org standards
 * This improves SEO by helping search engines understand your business
 */
export default function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Ok Neppo',
    alternateName: 'Ok Neppo by Nishad Fatma',
    url: 'https://okneppo.in',
    logo: 'https://okneppo.in/images/OkneppoLogo.jpeg',
    sameAs: [
      // Add social media profiles when available
      // 'https://www.facebook.com/okneppo',
      // 'https://www.instagram.com/okneppo',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-8249517832',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi']
    },
    founder: {
      '@type': 'Person',
      name: 'Nishad Fatma',
      jobTitle: 'Designer & Founder'
    },
    description: 'Discover handcrafted luxury fashion by designer Nishad Fatma. Elegant, timeless pieces for the modern woman, featuring sustainable materials and exceptional craftsmanship.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'India'
    },
    priceRange: '₹₹₹'
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
} 