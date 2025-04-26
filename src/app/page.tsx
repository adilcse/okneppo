import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Metadata } from "next";
import ClientHomeContent from "@/components/pages/home/ClientHomeContent";
import { getModelData, getDesignerData } from "@/lib/api";

export const metadata: Metadata = {
  title: 'Luxury Fashion Designs | Ok Neppo by Nishad Fatma',
  description: 'Explore exquisite handcrafted fashion pieces by designer Nishad Fatma. Premium quality clothing with meticulous attention to detail and sustainable practices.',
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
  let modelData;
  let designerData;
  
  try {
    modelData = await getModelData();
  } catch (error) {
    console.error('Error loading model data:', error);
    // Provide fallback data
    modelData = {
      showcase: ["/images/model/IMG_4693.jpg"],
      featured: []
    };
  }

  try {
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
          showcaseImages: modelData.showcase,
          featuredDesigns: modelData.featured
        }}
        designer={designerData}
      />
      <Footer />
    </div>
  );
}
