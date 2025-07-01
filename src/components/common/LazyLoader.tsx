
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  height?: string;
}

const LazyLoader = ({ children, fallback, height = "200px" }: LazyLoaderProps) => {
  const defaultFallback = (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default LazyLoader;
