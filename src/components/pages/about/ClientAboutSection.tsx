'use client';

import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Designer } from '@/lib/types';

interface ClientAboutSectionProps {
  designer: Designer;
}

export default function ClientAboutSection({ designer }: ClientAboutSectionProps) {
  return (
    <>
      {/* Designer Story */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center mb-12 sm:mb-16">
            <div className="order-2 lg:order-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center lg:text-left">The Designer</h2>
              <h3 className="text-lg sm:text-xl text-gray-700 mb-3 sm:mb-4 text-center lg:text-left">{designer.name}</h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base text-center lg:text-left">
                {designer.story.intro}
              </p>
              <p className="text-gray-600 mb-4 text-sm sm:text-base text-center lg:text-left">
                {designer.story.approach}
              </p>
              <p className="text-gray-600 text-sm sm:text-base text-center lg:text-left">
                {designer.story.vision}
              </p>
            </div>
            <div className="order-1 lg:order-2 relative h-64 sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden mb-6 lg:mb-0 group">
              <Image 
                src={designer.images.portrait}
                alt={`${designer.name} Portrait`}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
          
          {/* Design Philosophy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center mb-12 sm:mb-16">
            <div className="order-2 lg:order-1 relative h-64 sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden mb-6 lg:mb-0 group">
              <Image 
                src={designer.images.at_work}
                alt={`${designer.name} at Work`}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center lg:text-left">Design Philosophy</h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base text-center lg:text-left">
                {designer.philosophy.main}
              </p>
              <p className="text-gray-600 mb-4 text-sm sm:text-base text-center lg:text-left">
                {designer.philosophy.practices}
              </p>
              <p className="text-gray-600 text-sm sm:text-base text-center lg:text-left">
                {designer.philosophy.process}
              </p>
            </div>
          </div>
          
          {/* Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center lg:text-left">Achievements & Recognition</h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base text-center lg:text-left">
                {designer.recognition.industry}
              </p>
              <p className="text-gray-600 mb-4 text-sm sm:text-base text-center lg:text-left">
                {designer.recognition.influence}
              </p>
              <p className="text-gray-600 mb-6 text-sm sm:text-base text-center lg:text-left">
                {designer.recognition.legacy}
              </p>
              <div className="text-center lg:text-left">
                <Link href="/contact">
                  <Button>Get in Touch</Button>
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative h-64 sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden mb-6 lg:mb-0 group">
              <Image 
                src={designer.images.fashion_show}
                alt={`${designer.name} Fashion Show`}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Studio Glimpse */}
      <section className="py-8 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center">Our Studio</h2>
          <div className="relative h-64 sm:h-[400px] rounded-lg overflow-hidden group">
            <Image 
              src={designer.images.studio}
              alt="Ok Neppo Design Studio"
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="100vw"
            />
          </div>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mt-6 sm:mt-8 text-sm sm:text-base">
            {designer.studio.description}
          </p>
        </div>
      </section>
    </>
  );
} 