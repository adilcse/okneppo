import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyPage from '@/app/(pages)/privacy/page';

describe('Privacy Page', () => {
  it('renders the privacy policy page with heading and sections', () => {
    render(<PrivacyPage />);
    
    // Check that the main heading is rendered
    expect(screen.getByRole('heading', { name: /privacy policy/i, level: 1 })).toBeInTheDocument();
    
    // Check that all required sections are present
    expect(screen.getByRole('heading', { name: /introduction/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /information we collect/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /how we use your information/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /disclosure of your information/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /data security/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /changes to our privacy policy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact information/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /cookies/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /third-party links/i })).toBeInTheDocument();
  });
  
  it('includes important content in each section', () => {
    render(<PrivacyPage />);
    
    // Check for specific content in various sections
    expect(screen.getByText(/we respect your privacy and are committed/i)).toBeInTheDocument();
    expect(screen.getByText(/we collect several types of information/i)).toBeInTheDocument();
    
    // Check for data security content
    expect(screen.getByText(/we have implemented measures designed to secure/i)).toBeInTheDocument();
    
    // Check for cookies information
    expect(screen.getByText(/our website uses cookies to distinguish you/i)).toBeInTheDocument();
    
    // Check for third-party links information
    expect(screen.getByText(/our website may include links to third-party websites/i)).toBeInTheDocument();
  });

  it('displays a last updated date', () => {
    // Use a spy instead of mocking the entire Date object
    const dateSpy = jest.spyOn(Date.prototype, 'toLocaleDateString');
    dateSpy.mockReturnValue('4/29/2025');
    
    render(<PrivacyPage />);
    
    // Check that the last updated date is present
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
    expect(screen.getByText(/August 15, 2025/)).toBeInTheDocument();
    
    // Restore the original function
    dateSpy.mockRestore();
  });
}); 