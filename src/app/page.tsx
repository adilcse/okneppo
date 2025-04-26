import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";
import ClientHomeContent from "@/components/pages/home/ClientHomeContent";
import { getDesignerData } from "@/lib/api";
import { FeaturedProduct } from "@/lib/types";

export const metadata: Metadata = {
  title: 'Luxury Fashion Designs | Ok Neppo by Nishad Fatma',
  description: 'Exquisite handcrafted fashion pieces by designer Nishad Fatma. Premium quality clothing with meticulous attention to detail and sustainable practices.',
  openGraph: {
    title: 'Luxury Fashion Designs | Ok Neppo by Nishad Fatma',
    description: 'Explore exquisite handcrafted fashion pieces by designer Nishad Fatma.',
    images: [
      {
        url: '/images/OkneppoLogo.jpeg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo by Nishad Fatma',
      }
    ],
  }
};

// Revalidate page data every hour for fresh content
export const revalidate = 3600;

export default async function Home() {
  // Default showcase images - these could be stored in the database later
  const showcaseImages = [
    "/images/model/IMG_4693.jpg",
    "/images/model/DSC04122 Copy-EDIT.jpg",
    "/images/model/DSC04246.jpeg",
    "/images/model/DSC04341.jpeg",
    "/images/model/IMG_8033.JPG"
  ];
  
  let featuredDesigns: FeaturedProduct[] = [];
  let designerData;
  
  try {
    // Fetch featured products from the API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const featuredResponse = await fetch(`${baseUrl}/api/featured-products`, {
      next: { revalidate }
    });
    
    if (featuredResponse.ok) {
      featuredDesigns = await featuredResponse.json();
    } else {
      console.error('Failed to fetch featured products:', featuredResponse.status);
    }
  } catch (error) {
    console.error('Error loading featured products:', error);
  }

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
        portrait: "/images/designer/Nishad.jpg",
        at_work: "/images/designer/Nishad.jpg",
        fashion_show: "/images/designer/Nishad.jpg", 
        studio: "/images/designer/Nishad.jpg",
        homepage: "/images/designer/Nishad.jpg"
      }
    };
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <ClientHomeContent 
        modelData={{
          showcaseImages,
          featuredDesigns
        }}
        designer={designerData}
      />
      <Footer />
    </div>
  );
}
