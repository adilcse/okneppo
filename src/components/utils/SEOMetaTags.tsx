import { Metadata } from 'next';

type OpenGraphType = 
  | 'website' 
  | 'article' 
  | 'book' 
  | 'profile' 
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_station'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other';

type TwitterCardType = 'summary' | 'summary_large_image' | 'app' | 'player';

interface SEOMetaTagsProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogType?: OpenGraphType;
  twitterCard?: TwitterCardType;
  canonicalUrl?: string;
}

/**
 * Generate metadata for a page using Next.js App Router metadata API
 * 
 * @returns Metadata object for Next.js App Router
 */
export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  ogImage = '/images/OkneppoLogo.jpeg',
  ogImageWidth = 1200,
  ogImageHeight = 630,
  ogType = 'website',
  twitterCard = 'summary_large_image',
}: SEOMetaTagsProps): Metadata {
  return {
    title,
    description,
    keywords: keywords,
    openGraph: {
      title,
      description,
      type: ogType,
      images: [
        {
          url: ogImage,
          width: ogImageWidth,
          height: ogImageHeight,
          alt: title,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogImage],
    },
  };
} 