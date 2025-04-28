import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FeaturedProduct, formatPrice } from '@/lib/types';

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-12 sm:py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Featured Designs</h2>
        <p className="text-gray-600 mb-8 sm:mb-12 text-center max-w-2xl mx-auto">
          Explore our most popular designs, handcrafted with premium materials and meticulous attention to detail by Nishad Fatma.
        </p>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="h-56 sm:h-64 relative mb-4 overflow-hidden group">
                  <Image 
                    src={product.images?.[0] || '/placeholders/product.jpg'} 
                    alt={product.name} 
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-3 text-sm sm:text-base">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold">{formatPrice(product.price)}</span>
                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" className="text-sm">View Details</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-center mt-10 sm:mt-12">
          <Link href="/products">
            <Button>View All Designs</Button>
          </Link>
        </div>
      </div>
    </section>
  );
} 