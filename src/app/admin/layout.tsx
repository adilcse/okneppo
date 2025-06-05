"use client";
import AdminLayout from '@/components/layout/AdminLayout';
import { usePathname } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  try {
    const pathname = usePathname();
    if (pathname?.includes('login')) {
      return <>{children}</>;
    }
  } catch (error) {
    console.log(error);
  }

  return <AdminLayout>{children}</AdminLayout>;
} 