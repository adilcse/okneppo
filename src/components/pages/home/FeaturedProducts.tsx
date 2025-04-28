import Link from 'next/link';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import { FeaturedProduct } from '@/lib/types';

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center text-gray-900 dark:text-white">Featured Designs</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 text-center max-w-2xl mx-auto">
          Explore our most popular designs, handcrafted with premium materials and meticulous attention to detail by Nishad Fatma.
        </p>
        
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300">No featured products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.images?.[0] || '/placeholders/product.jpg'}
                description={product.description}
                showDescription={true}
              />
            ))}
          </div>
        )}
        
        <div className="text-center mt-10 sm:mt-12">
          <Link href="/products">
            <Button variant='outline' className='bg-transparent dark:border-white dark:text-white hover:bg-white/10'>
            View All Designs</Button>
          </Link>
        </div>
      </div>
    </section>
  );
} 