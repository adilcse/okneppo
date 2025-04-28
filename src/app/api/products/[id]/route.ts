import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bucketName, storage } from '@/lib/gcpStorage';

// Get a single product by ID
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
  
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    let product = await db.findById('products', id);

    // Convert snake_case to camelCase for response
    if (product) {
      const camelCasedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category,
        description: product.description,
        details: product.details,
        careInstructions: product.care_instructions,
        deliveryTime: product.delivery_time,
        featured: product.featured
      };
      product = camelCasedProduct;
    }
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// Update a product
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const existingProduct = await db.findById('products', id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const updateData = await request.json();
    
    // Debug logging to see incoming data
    console.log('Received update data:', JSON.stringify(updateData));
    console.log('Existing product:', JSON.stringify(existingProduct));
    
    // Ensure price is a number
    if (typeof updateData.price === 'string') {
      updateData.price = parseFloat(updateData.price.replace(/[^0-9.]/g, '')) || 0;
    }
    
    // Explicitly handle the careInstructions and deliveryTime fields
    // If they exist in the update data, use those values (even if empty strings)
    // Otherwise fall back to existing values
    const careInstructions = 'careInstructions' in updateData 
      ? updateData.careInstructions 
      : existingProduct.careInstructions || existingProduct.care_instructions || '';
      
    const deliveryTime = 'deliveryTime' in updateData
      ? updateData.deliveryTime
      : existingProduct.deliveryTime || existingProduct.delivery_time || '';
    
    // Ensure optional fields are properly handled
    const finalUpdateData = {
      ...updateData,
      // Use snake_case keys instead
      careInstructions: careInstructions,
      deliveryTime: deliveryTime,
      details: Array.isArray(updateData.details) ? updateData.details : existingProduct.details || [],
      featured: updateData.featured !== undefined ? Boolean(updateData.featured) : Boolean(existingProduct.featured)
    };
    
    console.log('Final update data being sent to database:', JSON.stringify(finalUpdateData));
    
    // Update product using the criteria object { id }
    const [rowsUpdated, updatedProducts] = await db.update('products', { id }, finalUpdateData);
    
    if (rowsUpdated === 0 || !updatedProducts || updatedProducts.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
    
    console.log('Product updated successfully:', JSON.stringify(updatedProducts[0]));
    
    return NextResponse.json({
      success: true,
      product: updatedProducts[0]
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// Delete a product
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Check if product exists and retrieve its data including images
    const existingProduct = await db.findById('products', id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // If images exist in the product, delete them from storage
    const deletedImages = [];
    const failedImages = [];
    
    if (existingProduct.images && Array.isArray(existingProduct.images) && existingProduct.images.length > 0) {
      console.log(`Deleting ${existingProduct.images.length} images for product ${id}`);
      
      // Only attempt to delete images if bucket is configured
      if (bucketName && storage) {
        const bucket = storage.bucket(bucketName);
        
        // Process each image URL
        for (const imageUrl of existingProduct.images) {
          try {
            // Skip if not a cloud storage URL
            if (!imageUrl.includes('storage.googleapis.com')) {
              console.log(`Skipping non-GCS image: ${imageUrl}`);
              continue;
            }
            
            // Extract the file path from the URL
            // Format: https://storage.googleapis.com/bucketName/path/to/file.jpg
            let filePath;
            const url = new URL(imageUrl);
            if (url.hostname === 'storage.googleapis.com') {
              // Remove the leading slash and the bucket name from the pathname
              const pathWithBucket = url.pathname.substring(1); // Remove leading slash
              filePath = pathWithBucket.substring(pathWithBucket.indexOf('/') + 1);
            } else {
              throw new Error('Invalid Google Cloud Storage URL format');
            }
            
            // Delete the file from the bucket
            const file = bucket.file(filePath);
            await file.delete();
            
            // Track successfully deleted images
            deletedImages.push(imageUrl);
            console.log(`Successfully deleted image: ${filePath}`);
          } catch (imgError) {
            // Don't stop the deletion process if one image fails
            console.error(`Error deleting image ${imageUrl}:`, imgError);
            failedImages.push(imageUrl);
          }
        }
      } else {
        console.warn('Skipping image deletion: Google Cloud Storage is not properly configured');
      }
    }
    
    // Delete product using the criteria object { id }
    const rowsDeleted = await db.destroy('products', { id });
    
    if (rowsDeleted === 0) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      imagesDeletionSummary: {
        totalImages: Array.isArray(existingProduct.images) ? existingProduct.images.length : 0,
        deletedImages: deletedImages.length,
        failedImages: failedImages.length
      }
    });
    
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
} 