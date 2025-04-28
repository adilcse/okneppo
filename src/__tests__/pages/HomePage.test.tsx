import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';
import ClientHomeContent from '@/components/pages/home/ClientHomeContent';
import { Designer, Product } from '@/lib/types';


// Define types for the mocked components
type HomeContentProps = {
  modelData: {
    showcaseImages: string[];
    featuredDesigns: Product[];
  };
  designer: Designer;
};

// Store the last props received by ClientHomeContent
let lastReceivedProps: HomeContentProps | null = null;

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getFeaturedProducts: jest.fn().mockResolvedValue([
    { 
      id: 1, 
      name: 'Test Product', 
      price: 1000, 
      description: 'Test description',
      images: ['/images/test.jpg'],
      category: 'Test Category',
      featured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]),
  getModelData: jest.fn().mockResolvedValue({
    showcase: ['/images/test1.jpg', '/images/test2.jpg']
  }),
  getDesignerData: jest.fn().mockResolvedValue({
    name: "Test Designer",
    title: "Designer & Founder",
    short_bio: "Test bio",
    achievements: "Test achievements",
    story: { intro: "Test intro", approach: "Test approach", vision: "Test vision" },
    philosophy: { main: "Test philosophy", practices: "Test practices", process: "Test process" },
    recognition: { industry: "Test industry", influence: "Test influence", legacy: "Test legacy" },
    studio: { description: "Test studio" },
    images: {
      portrait: "/images/test.jpg",
      at_work: "/images/test.jpg",
      fashion_show: "/images/test.jpg", 
      studio: "/images/test.jpg",
      homepage: "/images/test.jpg"
    }
  })
}));

// Mock the Header and Footer components
jest.mock('@/components/layout/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/layout/Footer', () => {
  return function MockFooter() {
    return <div data-testid="mock-footer">Footer</div>;
  };
});

// Mock the ClientHomeContent component
jest.mock('@/components/pages/home/ClientHomeContent', () => {
  return jest.fn().mockImplementation((props: HomeContentProps) => {
    lastReceivedProps = props;
    return (
      <div data-testid="mock-client-home-content">
        <div data-testid="model-data">{JSON.stringify(props.modelData)}</div>
        <div data-testid="designer-data">{JSON.stringify(props.designer)}</div>
      </div>
    );
  });
});

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastReceivedProps = null;
  });

  it('renders the home page with header, content, and footer', async () => {
    const HomeCopy = Home as React.FC<object>;
    render(await HomeCopy({}));
    
    // Check that header and footer are rendered
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    
    // Check that client home content is rendered
    expect(screen.getByTestId('mock-client-home-content')).toBeInTheDocument();
  });
  
  it('passes the correct props to ClientHomeContent', async () => {
    const HomeCopy = Home as React.FC<object>;
    render(await HomeCopy({}));
    
    // Log the actual props for debugging
    console.log('ClientHomeContent was called with:', lastReceivedProps);
    
    // Check that ClientHomeContent was called
    expect(ClientHomeContent).toHaveBeenCalled();
    
    // Verify the props structure
    expect(lastReceivedProps).toEqual(
      expect.objectContaining({
        modelData: expect.objectContaining({
          showcaseImages: expect.any(Array),
          featuredDesigns: expect.any(Array)
        }),
        designer: expect.objectContaining({
          name: expect.any(String),
          title: expect.any(String)
        })
      })
    );
  });
}); 