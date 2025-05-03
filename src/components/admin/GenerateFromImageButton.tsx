import React, { useState } from 'react';

interface GenerateFromImageProps {
  images: string[];
  onSuccess: (generatedData: {
    name: string;
    description: string;
    details: string[];
    careInstructions: string;
    deliveryTime: string;
    price: number;
    category: string;
  }) => void;
  disabled?: boolean;
}

export default function GenerateFromImageButton({ 
  images, 
  onSuccess, 
  disabled = false 
}: GenerateFromImageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = async () => {
    if (disabled || isGenerating || images.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Use the first image to generate product details
      const imageUrl = images[0];
      
      const response = await fetch('/api/generate-product-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate product details');
      }
      
      const generatedData = await response.json();
      
      // Call the success handler with the generated data
      onSuccess(generatedData);
    } catch (err) {
      console.error('Error generating product details:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate product details');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={handleGenerateClick}
        disabled={disabled || isGenerating || images.length === 0}
        className={`flex items-center justify-center px-4 py-2 ${
          images.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        } text-white rounded-md transition-colors ${isGenerating ? 'opacity-75' : ''}`}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate from Image
          </>
        )}
      </button>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      
      {images.length === 0 && !disabled && (
        <p className="mt-2 text-sm text-gray-600">
          Upload at least one image to use this feature
        </p>
      )}
    </div>
  );
} 