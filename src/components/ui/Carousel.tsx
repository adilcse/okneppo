'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// Need to install lucide-react package: npm install lucide-react
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  images: string[];
  autoplay?: boolean;
  interval?: number;
  className?: string;
  showControls?: boolean;
  showIndicators?: boolean;
  aspectRatio?: "square" | "portrait" | "wide" | "auto";
  height?: string;
  imageObjectFit?: "cover" | "contain";
}

export default function Carousel({
  images,
  autoplay = true,
  interval = 5000,
  className = '',
  showControls = true,
  showIndicators = true,
  aspectRatio = "wide",
  height = "h-[60vh]",
  imageObjectFit = "cover"
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Calculate aspect ratio class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square": return "aspect-square";
      case "portrait": return "aspect-[3/4]";
      case "wide": return "aspect-[16/9]";
      case "auto": return "";
      default: return "";
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoplay && !isHovering) {
      timer = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, interval);
    }
    return () => clearTimeout(timer);
  }, [currentIndex, autoplay, interval, images.length, isHovering]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle mouse hover to pause autoplay
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <div 
      className={`relative overflow-hidden ${className} ${aspectRatio === "auto" ? height : getAspectRatioClass()}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} className="min-w-full h-full flex-shrink-0 relative overflow-hidden group">
            <Image
              src={image}
              alt={`Slide ${index + 1}`}
              fill
              priority={index === 0}
              className={`object-${imageObjectFit} transition-transform duration-700 ease-out group-hover:scale-110`}
            />
          </div>
        ))}
      </div>

      {showControls && images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
} 