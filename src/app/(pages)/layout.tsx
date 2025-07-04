import Layout from '@/components/layout/Layout';

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
} 