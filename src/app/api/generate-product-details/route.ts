import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Simple key rotation system to alternate between API keys
let currentKeyIndex = 0;
const getNextApiKey = () => {
  // Get all API keys from environment variables
  const keys = [
    process.env.OPENAI_API_KEY_1,
    process.env.OPENAI_API_KEY_2
  ].filter(Boolean); // Filter out any undefined or empty keys
  
  if (keys.length === 0) {
    console.error('No OpenAI API keys found in environment variables');
    return null;
  }
  
  // Get the next key and update the index
  const key = keys[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  
  return key;
};

// Function to create a new OpenAI client with the next API key
const createOpenAIClient = () => {
  const apiKey = getNextApiKey();
  
  if (!apiKey) {
    throw new Error('No OpenAI API key available');
  }
  
  // Log which key index is being used (for debugging, without showing the actual key)
  console.log(`Using OpenAI API key index: ${currentKeyIndex === 0 ? 'Primary' : 'Alternative'}`);
  
  return new OpenAI({
    apiKey: apiKey,
  });
};

// Function to call DeepSeek API as fallback using OpenAI client with custom base URL
async function callDeepSeekAPI(imageUrl: string) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      throw new Error('DeepSeek API key not found in environment variables');
    }
    
    console.log('Falling back to DeepSeek API');
    
    // Initialize OpenAI client but with DeepSeek base URL
    const deepseekClient = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.deepseek.com",
    });
    
    const systemPrompt = "You are a helpful assistant that analyzes fashion product images for Ok Neppo, a website of a renowned Indian fashion designer. Generate detailed and appealing product information for fashion items like sarees, kurtas, lehengas, and other traditional and contemporary Indian fashion items.";
    
    const userPrompt = `Analyze this fashion product image and generate the following details: product name, price (in INR, typically between ₹1,000-₹50,000), category (choose from: Saree, Kurta, Lehenga, Ethnic Wear, Fusion Wear, Accessories, Bridal Wear, or other appropriate fashion category), detailed description (2-3 paragraphs highlighting fabric, design elements, craftsmanship, occasions it's suitable for), specific product details as bullet points (material, embellishments, style features), care instructions (washing, dry cleaning, storing), and estimated delivery time. Format your response as JSON.\n\n![Product Image](${imageUrl})`;

    const response = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: 'json_object'
      },
      max_tokens: 2000,
      temperature: 0.7,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the image URL from the request body
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      );
    }

    let assistantMessage = '';
    let apiUsed = 'openai';

    try {
      // Try OpenAI first
      // Initialize a new OpenAI client for this request
      const openai = createOpenAIClient();

      // Call OpenAI's API to analyze the image
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes fashion product images for Ok Neppo, a website of a renowned Indian fashion designer. Generate detailed and appealing product information for fashion items like sarees, kurtas, lehengas, and other traditional and contemporary Indian fashion items.",
          },
          {
            role: "user",
            content: [
              {
                type: "text", 
                text: "Analyze this fashion product image and generate the following details: product name, price (in INR, typically between ₹1,000-₹50,000), category (choose from: Saree, Kurta, Lehenga, Ethnic Wear, Fusion Wear, Accessories, Bridal Wear, or other appropriate fashion category), detailed description (2-3 paragraphs highlighting fabric, design elements, craftsmanship, occasions it's suitable for), specific product details as bullet points (material, embellishments, style features), care instructions (washing, dry cleaning, storing), and estimated delivery time. Format your response as JSON.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      assistantMessage = response.choices[0]?.message?.content || "";
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // If OpenAI fails, try DeepSeek as fallback
      try {
        assistantMessage = await callDeepSeekAPI(imageUrl);
        apiUsed = 'deepseek';
        console.log('Successfully used DeepSeek API as fallback');
      } catch (deepseekError) {
        console.error('Both OpenAI and DeepSeek APIs failed:', deepseekError);
        return NextResponse.json(
          { error: "Failed to generate product details with all available APIs" },
          { status: 500 }
        );
      }
    }
    
    // Parse the response to extract structured data
    // The assistant might return JSON directly or it might be in text format
    // Let's try to extract the JSON part if it's within text
    let productData;
    try {
      // Attempt to parse the entire response as JSON
      productData = JSON.parse(assistantMessage);
    } catch {
      // If that fails, try to extract JSON from the text
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          productData = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json(
            { error: "Failed to parse product data from API response" },
            { status: 500 }
          );
        }
      } else {
        // No JSON found, try to extract information manually
        productData = {
          name: extractProperty(assistantMessage, "name", "product name"),
          price: extractNumberProperty(assistantMessage, "price"),
          category: extractProperty(assistantMessage, "category"),
          description: extractProperty(assistantMessage, "description"),
          details: extractArrayProperty(assistantMessage, "details", "product details"),
          careInstructions: extractProperty(assistantMessage, "care instructions", "care"),
          deliveryTime: extractProperty(assistantMessage, "delivery time", "delivery"),
        };
      }
    }

    // Validate and format the response
    const formattedData = {
      name: productData.name || "",
      price: typeof productData.price === 'number' ? productData.price : 
             typeof productData.price === 'string' ? parseFloat(productData.price.replace(/[^0-9.]/g, '')) : 0,
      category: productData.category || "",
      description: productData.description || "",
      details: Array.isArray(productData.details) ? productData.details : 
               productData.details ? [productData.details] : [],
      careInstructions: productData.careInstructions || "",
      deliveryTime: productData.deliveryTime || "",
      apiUsed: apiUsed // Include which API was used for transparency
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error generating product details:', error);
    return NextResponse.json(
      { error: "Failed to generate product details" },
      { status: 500 }
    );
  }
}

// Helper functions to extract properties from text
function extractProperty(text: string, key: string, altKey?: string): string {
  const regex = new RegExp(`${key}[:\\s]*(.*?)(?=\\n\\n|\\n[A-Za-z]+[:\\s]|$)`, 'is');
  const altRegex = altKey ? new RegExp(`${altKey}[:\\s]*(.*?)(?=\\n\\n|\\n[A-Za-z]+[:\\s]|$)`, 'is') : null;
  
  const match = regex.exec(text);
  const altMatch = altRegex ? altRegex.exec(text) : null;
  
  return (match?.[1] || altMatch?.[1] || "").trim();
}

function extractNumberProperty(text: string, key: string): number {
  const value = extractProperty(text, key);
  // Extract numeric part from strings like "₹12,500" or "12,500 INR"
  const numericMatch = value.match(/[\d,]+(\.\d+)?/);
  if (numericMatch) {
    return parseFloat(numericMatch[0].replace(/,/g, ''));
  }
  return 0;
}

function extractArrayProperty(text: string, key: string, altKey?: string): string[] {
  const rawText = extractProperty(text, key, altKey);
  if (!rawText) return [];
  
  // Split by bullet points or numbered lists
  const items = rawText.split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*/).filter(Boolean);
  return items.map(item => item.trim());
}
