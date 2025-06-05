import { Metadata } from "next";
import { getDesignerData } from "@/lib/api";
import ClientAboutSection from "@/components/pages/about/ClientAboutSection";
import { Container } from "@/components/common";

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
      {/* About Header */}
      <section className="bg-gray-100 dark:bg-gray-800 py-8 sm:py-12">
        <Container>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 sm:mb-4 text-gray-900 dark:text-white">About Ok Neppo</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto text-sm sm:text-base">
            Discover the journey and passion behind {designer.name}&apos;s fashion designs.
          </p>
        </Container>
      </section>
      
      {/* Client component with all the designer information */}
      <ClientAboutSection designer={designer} />
    </div>
  );
} 