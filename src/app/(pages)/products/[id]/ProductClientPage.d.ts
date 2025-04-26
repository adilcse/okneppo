import { ReactNode } from 'react';

declare module "./ProductClientPage" {
  export interface ProductClientPageProps {
    params: {
      id: string;
    };
  }

  export default function ProductClientPage(props: ProductClientPageProps): ReactNode;
} 