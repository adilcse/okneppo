import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactPage from '@/app/(pages)/contact/page';

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

// Mock the Image component
jest.mock('next/image', () => {
  return function MockImage(props: React.ComponentProps<'img'> & { fill?: boolean }) {
    // Omit the fill prop which causes React warnings
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, ...rest } = props;
    return <img data-testid="mock-image" {...rest} />;
  };
});

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockOpen
});

describe('Contact Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the contact form with all required fields', () => {
    render(<ContactPage />);
    
    // Check that header and footer are rendered
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    
    // Check that form elements are rendered
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send via whatsapp/i })).toBeInTheDocument();
  });

  it('updates form fields when user types input', () => {
    render(<ContactPage />);
    
    // Get form elements
    const nameInput = screen.getByLabelText(/your name/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const subjectInput = screen.getByLabelText(/subject/i);
    const messageInput = screen.getByLabelText(/message/i);
    
    // Type in form fields
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'This is a test message' } });
    
    // Assert the values were updated
    expect(nameInput).toHaveValue('Test User');
    expect(phoneInput).toHaveValue('1234567890');
    expect(subjectInput).toHaveValue('Test Subject');
    expect(messageInput).toHaveValue('This is a test message');
  });

  it('opens WhatsApp with encoded message on form submission', () => {
    render(<ContactPage />);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'This is a test message' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send via whatsapp/i }));
    
    // Check that window.open was called with correct WhatsApp URL
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/'),
      '_blank'
    );
    
    // Get the URL that was passed to window.open
    const openCall = mockOpen.mock.calls[0][0];
    
    // Decode the URL to check its contents
    const decodedUrl = decodeURIComponent(openCall);
    expect(decodedUrl).toContain('Test User');
    expect(decodedUrl).toContain('1234567890');
    expect(decodedUrl).toContain('Test Subject');
    expect(decodedUrl).toContain('This is a test message');
  });

  it('displays contact information correctly', () => {
    render(<ContactPage />);
    
    // Check that contact information is displayed
    expect(screen.getByText(/okneppo@gmail.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Rourkela, Odisha, India/i)).toBeInTheDocument();
    expect(screen.getByText(/Book a Consultation/i)).toBeInTheDocument();
  });
}); 