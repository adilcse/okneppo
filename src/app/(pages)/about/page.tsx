import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDesignerData } from "@/lib/api";
import ClientAboutSection from "@/components/pages/about/ClientAboutSection";

// Generate metadata for the about page
export const metadata: Metadata = {
  title: 'About Nishad Fatma | Ok Neppo',
  description: 'Learn about fashion designer Nishad Fatma and the story behind Ok Neppo. Discover her journey, design philosophy, and commitment to quality craftsmanship.',
  openGraph: {
    title: 'About Nishad Fatma | Ok Neppo',
    description: 'Learn about fashion designer Nishad Fatma and the story behind Ok Neppo.',
    images: ['/images/designer/IMG_7569-POP_OUT.jpg'],
  },
};

// Revalidate every hour
export const revalidate = 3600;

export default async function AboutPage() {
  // Fetch designer data on the server
  const designer = await getDesignerData();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* About Header */}
      <section className="bg-gray-100 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 sm:mb-4">About Ok Neppo</h1>
          <p className="text-gray-600 text-center max-w-2xl mx-auto text-sm sm:text-base">
            Discover the journey and passion behind {designer.name}&apos;s fashion designs.
          </p>
        </div>
      </section>
      
      {/* Client component with all the designer information */}
      <ClientAboutSection designer={designer} />
      
      <Footer />
    </div>
  );
} 