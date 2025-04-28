"use client";

import Image from 'next/image';

type LogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

export default function Logo({ width = 60, height = 60, className = '' }: LogoProps) {
  
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/images/OkneppoLogo.jpeg"
        alt="OKNEPPO Logo"
        width={width}
        height={height}
        priority
        className="transition-opacity duration-300"
      />
    </div>
  );
} 