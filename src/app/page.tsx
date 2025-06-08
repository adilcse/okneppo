import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";
import ClientHomeContent from "@/components/pages/home/ClientHomeContent";
import { getDesignerData, getFeaturedProducts, getModelData } from "@/lib/api";

export const metadata: Metadata = {
  title: 'Luxury Fashion Designs | Ok Neppo by Nishad Fatma',
  description: 'Exquisite handcrafted fashion pieces by designer Nishad Fatma. Premium quality clothing with meticulous attention to detail and sustainable practices. Discover our unique collection of luxury garments.',
  keywords: ['luxury fashion', 'handcrafted clothing', 'Nishad Fatma', 'sustainable fashion', 'premium garments', 'designer collection'],
  openGraph: {
    title: 'Luxury Fashion Designs | Ok Neppo by Nishad Fatma',
    description: 'Explore exquisite handcrafted fashion pieces by designer Nishad Fatma. Each piece is crafted with precision and sustainable practices.',
    images: [
      {
        url: '/images/OkneppoLogo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo by Nishad Fatma',
      }
    ],
    type: 'website',
    locale: 'en_US',
    siteName: 'Ok Neppo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luxury Fashion Designs | Ok Neppo by Nishad Fatma',
    description: 'Explore exquisite handcrafted fashion pieces by designer Nishad Fatma.',
    images: ['/images/OkneppoLogo.jpeg'],
  },
  alternates: {
    canonical: 'https://okneppo.in',
  },
};

// Revalidate page data every hour for fresh content
export const revalidate = 3600;

export default async function Home() {

  
  // Get featured products directly from the database
  const featuredDesigns = await getFeaturedProducts();
  const modelData = await getModelData();
  console.log(`Found ${featuredDesigns.length} featured products`);
  
  let designerData;
  
  try {
    // Fetch designer data
    designerData = await getDesignerData();
  } catch (error) {
    console.error('Error loading designer data:', error);
    // Provide fallback designer data
    designerData = {
      name: "Nishad Fatma",
      title: "Designer & Founder",
      short_bio: "Renowned designer known for blending tradition with contemporary design.",
      achievements: "",
      story: { intro: "", approach: "", vision: "" },
      philosophy: { main: "", practices: "", process: "" },
      recognition: { industry: "", influence: "", legacy: "" },
      studio: { description: "" },
      images: {
        portrait: "/images/designer/Nishad-crop.jpg",
        at_work: "/images/designer/Nishad-crop.jpg",
        fashion_show: "/images/designer/Nishad-crop.jpg", 
        studio: "/images/designer/Nishad-crop.jpg",
        homepage: "/images/designer/Nishad-crop.jpg"
      }
    };
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <ClientHomeContent 
        modelData={{
          showcaseImages: modelData.showcase,
          featuredDesigns
        }}
        designer={designerData}
      />
      <Footer />
    </div>
  );
}
