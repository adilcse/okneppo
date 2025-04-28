import { NextResponse } from 'next/server';
import designer from '@/data/designer.json';
 
export async function GET() {
  return NextResponse.json(designer);
} 