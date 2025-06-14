import React, { useState } from 'react';

// Define interface for product form data structure
export interface ProductFormData {
  name?: string;
  price?: string;
  category?: string;
  description?: string;
  images?: string[];
  details?: string[];
  careInstructions?: string;
  deliveryTime?: string;
  featured?: boolean;
}

interface JsonFormFillerProps {
  onFillForm: (data: ProductFormData) => void;
}

const JsonFormFiller: React.FC<JsonFormFillerProps> = ({ onFillForm }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    setError(null);
  };

  const handleFillAll = () => {
    try {
      if (!jsonText.trim()) {
        setError('Please enter JSON data');
        return;
      }
      
      const parsedData = JSON.parse(jsonText) as ProductFormData;
      onFillForm(parsedData);
      setError(null);
    } catch (error) {
      console.error('JSON parsing error:', error);
      setError('Invalid JSON format. Please check your input.');
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="mb-6 p-4 border border-gray-300 rounded bg-gray-50 dark:bg-gray-800">
      <div className="flex justify-between items-center cursor-pointer" onClick={toggleCollapse}>
        <h3 className="text-md font-semibold text-gray-700 dark:text-white">
          Import Product Data from JSON
        </h3>
        <button 
          type="button" 
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg> :
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          }
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="mt-3">
          <textarea
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[120px] font-mono text-sm"
            placeholder="Paste product JSON data here..."
            value={jsonText}
            onChange={handleTextChange}
          />
          {error && (
            <div className="text-red-500 text-sm mt-1">{error}</div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleFillAll}
              className="px-4 py-2 bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700 transition-colors"
            >
              Fill All Fields
            </button>
            <button
              type="button"
              onClick={() => setJsonText('')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear
            </button>
          </div>
          
          <div className="mt-3 text-xs text-gray-500 dark:text-white">
            <p>Paste a JSON object with product fields to quickly fill the form.</p>
            <p className="mt-1">Example format:</p>
            <pre className="bg-gray-100 dark:bg-gray-600 p-2 rounded mt-1 text-xs overflow-auto">
              {`{
  "name": "Product Name",
  "price": "1999",
  "category": "Category",
  "description": "Product description...",
  "details": ["Detail 1", "Detail 2"],
  "careInstructions": "Care instructions...",
  "deliveryTime": "1-2 weeks",
  "featured": false
}`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonFormFiller; 