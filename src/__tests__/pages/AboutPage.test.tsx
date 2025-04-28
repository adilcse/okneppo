import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutPage from '@/app/(pages)/about/page';
import ClientAboutSection from '@/components/pages/about/ClientAboutSection';
import { Designer } from '@/lib/types';



// Store the last props received by ClientAboutSection
let lastReceivedProps: { designer: Designer } | null = null;

// Mock the API functions
jest.mock('@/lib/api', () => ({
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

// Mock the ClientAboutSection component
jest.mock('@/components/pages/about/ClientAboutSection', () => {
  return jest.fn().mockImplementation((props) => {
    lastReceivedProps = props;
    return (
      <div data-testid="mock-about-section">
        <div data-testid="designer-name">{props.designer.name}</div>
      </div>
    );
  });
});

describe('About Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastReceivedProps = null;
  });

  it('renders the about page with header, content, and footer', async () => {
    const AboutPageCopy = AboutPage as React.FC<object>;
    render(await AboutPageCopy({}));
    
    // Check that header and footer are rendered
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    
    // Check that about section is rendered
    expect(screen.getByTestId('mock-about-section')).toBeInTheDocument();
    expect(screen.getByTestId('designer-name')).toHaveTextContent('Test Designer');
  });
  
  it('passes the correct designer data to ClientAboutSection', async () => {
    const AboutPageCopy = AboutPage as React.FC<object>;
    render(await AboutPageCopy({}));
    
    // Log the actual props for debugging
    console.log('ClientAboutSection was called with:', lastReceivedProps);
    
    // Check that ClientAboutSection was called
    expect(ClientAboutSection).toHaveBeenCalled();
    
    // Verify the props structure
    expect(lastReceivedProps).toEqual({
      designer: expect.objectContaining({
        name: "Test Designer",
        title: "Designer & Founder",
        story: expect.objectContaining({
          intro: expect.any(String),
          approach: expect.any(String),
          vision: expect.any(String)
        }),
        philosophy: expect.objectContaining({
          main: expect.any(String)
        }),
        images: expect.objectContaining({
          portrait: expect.any(String)
        })
      })
    });
  });
}); 