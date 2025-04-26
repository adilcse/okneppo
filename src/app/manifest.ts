import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ok Neppo - Luxury Fashion by Nishad Fatma',
    short_name: 'Ok Neppo',
    description: 'Discover handcrafted luxury fashion designs by Nishad Fatma',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/images/OkneppoLogo.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/images/OkneppoLogo.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
} 