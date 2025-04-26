import React from 'react';
import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function Logo({ width = 80, height = 80, className = '' }: LogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Image
        src="/images/OkneppoLogo.jpeg"
        alt="Ok Neppo Logo"
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  );
} 