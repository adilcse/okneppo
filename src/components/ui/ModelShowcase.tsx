'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from './Button';

interface ModelShowcaseProps {
  images: string[];
  title?: string;
  subtitle?: string;
  primaryCta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
  className?: string;
}

export default function ModelShowcase({
  images,
  title = "Ok Neppo Collections",
  subtitle = "Elegance Redefined",
  primaryCta = { text: "View Collection", href: "/products" },
  secondaryCta = { text: "Book Consultation", href: "/contact" },
  className = ''
}: ModelShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Automatic slide transition
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % images.length);
      }, 300); // Time for fade out
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Time for fade in after change
    }, 5000); // Change image every 5 seconds
    
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className={`relative overflow-hidden w-full h-[80vh] sm:h-[85vh] ${className}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black z-0"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-[#E94FFF]/10 rounded-full blur-3xl z-0"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-[#FFF0B0]/10 rounded-full blur-3xl z-0"></div>
      
      {/* Images */}
      <div className="absolute inset-0 z-10">
        {images.map((image, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out
              ${index === activeIndex ? 'opacity-100' : 'opacity-0'} 
              ${isAnimating && index === activeIndex ? 'opacity-50' : ''}`}
          >
            <div className="relative w-full h-full overflow-hidden group">
              <Image
                src={image}
                alt={`Fashion Model ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80 z-20"></div>
      
      {/* Content */}
      <div className="absolute bottom-12 sm:bottom-20 inset-x-0 text-center z-30 px-4">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-2 tracking-tight">{title}</h1>
        <p className="text-lg sm:text-xl text-white/90 mb-8 italic max-w-md mx-auto">{subtitle}</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link href={primaryCta.href}>
            <Button variant="primary" className="w-full sm:w-auto px-8 py-3">
              {primaryCta.text}
            </Button>
          </Link>
          <Link href={secondaryCta.href}>
            <Button variant="outline" className="w-full sm:w-auto px-8 py-3 bg-transparent border-white text-white hover:bg-white/10">
              {secondaryCta.text}
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setActiveIndex(index);
                setIsAnimating(false);
              }, 300);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex ? 'bg-white scale-125 w-4' : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 