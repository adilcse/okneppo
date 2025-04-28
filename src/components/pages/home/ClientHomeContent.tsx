'use client';

import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ModelShowcase from '@/components/ui/ModelShowcase';
import { Designer } from '@/lib/types';
import { FeaturedProduct } from '@/lib/types';
import FeaturedProducts from './FeaturedProducts';

interface ClientHomeContentProps {
  modelData: {
    showcaseImages: string[];
    featuredDesigns: FeaturedProduct[];
  };
  designer: Designer;
}

export default function ClientHomeContent({ modelData, designer }: ClientHomeContentProps) {
  return (
    <>
      {/* Fashion Model Showcase - Client Component for interactivity */}
      <ModelShowcase 
        images={modelData.showcaseImages} 
        title="Ok Neppo"
        subtitle="Timeless designs for the modern woman"
        primaryCta={{ text: "View Collection", href: "/products" }}
        secondaryCta={{ text: "Book Consultation", href: "/contact" }}
      />
      
      {/* About Designer */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <div className="h-64 sm:h-80 relative rounded-lg overflow-hidden group">
                <Image 
                  src={designer.images.homepage}
                  alt={`${designer.name} - ${designer.title}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center md:text-left">About the Designer</h2>
              <h3 className="text-lg sm:text-xl text-gray-700 mb-4 text-center md:text-left">{designer.name}</h3>
              <p className="text-gray-600 mb-6 text-center md:text-left">
                {designer.short_bio}
              </p>
              <p className="text-gray-600 mb-6 text-center md:text-left">
                {designer.achievements}
              </p>
              <div className="text-center md:text-left">
                <Link href="/about">
                  <Button>Learn More</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Products - Server Component */}
      <FeaturedProducts products={modelData.featuredDesigns} />
    </>
  );
} 