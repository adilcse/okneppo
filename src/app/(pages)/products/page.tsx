import { Metadata } from "next";
import { Container } from "@/components/common";
import ClientProductsPage from "../../../components/pages/products/ClientProductsPage";
import { getAllProducts, getProductFilters, FilterData, PaginationInfo } from "@/lib/api";
import { Product } from "@/lib/types";

// Generate metadata for SEO
export const metadata: Metadata = {
  title: 'Premium Designer Collections | Ok Neppo',
  description: 'Browse our exclusive collection of high-quality designer clothing and accessories by Nishad Fatma. Each piece is crafted with attention to detail and fine artisanship. Discover unique, sustainable fashion pieces.',
  keywords: ['designer collection', 'luxury fashion', 'handcrafted clothing', 'sustainable fashion', 'premium garments', 'Nishad Fatma designs'],
  openGraph: {
    title: 'Premium Designer Collections | Ok Neppo',
    description: 'Browse our exclusive collection of high-quality designer clothing and accessories by Nishad Fatma. Each piece is crafted with attention to detail and fine artisanship.',
    images: [
      {
        url: '/images/model/DSC04122 Copy-EDIT.jpg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Designer Collection',
      },
      {
        url: '/images/model/DSC04246.jpeg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Fashion Pieces',
      },
      {
        url: '/images/model/DSC04341.jpeg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Luxury Collection',
      },
      {
        url: '/images/model/IMG_8033.JPG',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Designer Wear',
      }
    ],
    type: 'website',
    locale: 'en_US',
    siteName: 'Ok Neppo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Premium Designer Collections | Ok Neppo',
    description: 'Browse our exclusive collection of high-quality designer clothing and accessories by Nishad Fatma.',
    images: ['/images/model/DSC04122 Copy-EDIT.jpg'],
  },
  alternates: {
    canonical: 'https://okneppo.in/products',
  },
};

// Set the revalidation timer - refresh the page every hour
export const revalidate = 3600;

export default async function ProductsPage(Props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await Props.searchParams;

  // Get page and limit from searchParams
  const page = typeof searchParams?.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit = typeof searchParams?.limit === 'string' ? parseInt(searchParams.limit) : 9;
  
  let productsData: { products: Product[], pagination: PaginationInfo } = {
    products: [],
    pagination: {
      page: 1,
      limit: 9,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  };
  
  let filterData: FilterData = {
    categories: [],
    priceRanges: []
  };
  
  try {
    // Fetch products and filters on the server for SEO benefits
    const [productsResult, filtersResult] = await Promise.all([
      getAllProducts(page, limit),
      getProductFilters()
    ]);
    
    productsData = productsResult;
    filterData = filtersResult;
  } catch (error) {
    console.error('Error loading products and filters:', error);
    // Products will remain an empty array
  }
  
  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-8 sm:py-12">
        <Container>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Our Collections</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-sm sm:text-base">
            Each piece in our collection is meticulously crafted by designer Nishad Fatma, 
            combining traditional techniques with contemporary designs. Explore our 
            curated selection of premium garments and accessories.
          </p>
        </Container>
      </section>
      
      {/* Client Component that handles filtering and sorting */}
      <ClientProductsPage 
        initialProducts={productsData.products}
        initialFilterData={filterData}
        initialPagination={productsData.pagination}
      />
    </main>
  );
} 