import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

// Handle file upload
export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique file name
    const fileExtension = path.extname(file.name);
    const fileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    
    // Ensure the directory exists
    const dirPath = path.join(process.cwd(), 'public/images/products');
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }

    // Write the file to the public directory
    const filePath = path.join(dirPath, fileName);
    await writeFile(filePath, buffer);

    // Return the file path relative to the public directory
    const relativePath = `/images/products/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      filePath: relativePath
    });
  } catch (error: unknown) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'File upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 