import { Metadata } from "next";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import ClientProductsPage from "../../../components/pages/products/ClientProductsPage";
import { getAllProducts, getProductFilters, Product, FilterData } from "@/lib/api";

// Generate metadata for SEO
export const metadata: Metadata = {
  title: 'Premium Designer Collections | Ok Neppo',
  description: 'Browse our exclusive collection of high-quality designer clothing and accessories by Nishad Fatma. Each piece is crafted with attention to detail and fine artisanship.',
  openGraph: {
    title: 'Premium Designer Collections | Ok Neppo',
    description: 'Browse our exclusive collection of high-quality designer clothing and accessories by Nishad Fatma.',
    images: [
      '/images/model/DSC04122 Copy-EDIT.jpg',
      '/images/model/DSC04246.jpeg', 
      '/images/model/DSC04341.jpeg',
      '/images/model/IMG_8033.JPG'
    ],
  },
};

// Set the revalidation timer - refresh the page every hour
export const revalidate = 3600;

export default async function ProductsPage() {
  let products: Product[] = [];
  let filterData: FilterData = {
    categories: [],
    priceRanges: []
  };
  
  try {
    // Fetch products and filters on the server for SEO benefits
    const [productsData, filtersData] = await Promise.all([
      getAllProducts(),
      getProductFilters()
    ]);
    
    products = productsData;
    filterData = filtersData;
  } catch (error) {
    console.error('Error loading products and filters:', error);
    // Products will remain an empty array
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gray-50 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Our Collections</h1>
          <p className="text-gray-600 max-w-2xl text-sm sm:text-base">
            Each piece in our collection is meticulously crafted by designer Nishad Fatma, 
            combining traditional techniques with contemporary designs. Explore our 
            curated selection of premium garments and accessories.
          </p>
        </div>
      </section>
      
      {/* Client Component that handles filtering and sorting */}
      <ClientProductsPage 
        initialProducts={products}
        initialFilterData={filterData}
      />
      
      <Footer />
    </div>
  );
} 