import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface GalleryImage {
  id: number;
  image_url: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  try {
    const images = await db.find<GalleryImage>('gallery', {}, {
      orderBy: 'display_order',
      order: 'ASC'
    });
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch gallery images' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    // Get the current highest display order
    const images = await db.find<GalleryImage>('gallery', {}, {
      orderBy: 'display_order',
      order: 'DESC',
      limit: 1
    });

    const nextDisplayOrder = images.length > 0 ? images[0].display_order + 1 : 0;

    // Create new gallery entry
    const newImage = await db.create<GalleryImage>('gallery', {
      image_url: imageUrl,
      display_order: nextDisplayOrder
    });

    return NextResponse.json({ success: true, image: newImage });
  } catch (error) {
    console.error('Error adding gallery image:', error);
    return NextResponse.json({ success: false, error: 'Failed to add gallery image' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { images } = await request.json();

    // Update display order for each image
    for (let i = 0; i < images.length; i++) {
      await db.update('gallery', { id: images[i].id }, { display_order: i });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering gallery images:', error);
    return NextResponse.json({ success: false, error: 'Failed to reorder gallery images' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'No image ID provided' }, { status: 400 });
    }

    await db.destroy('gallery', { id: parseInt(id) });

    // Reorder remaining images
    const remainingImages = await db.find<GalleryImage>('gallery', {}, {
      orderBy: 'display_order',
      order: 'ASC'
    });

    for (let i = 0; i < remainingImages.length; i++) {
      await db.update('gallery', { id: remainingImages[i].id }, { display_order: i });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete gallery image' }, { status: 500 });
  }
} 