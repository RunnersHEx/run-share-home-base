import React from 'react';
import { useVerification } from '@/hooks/useVerification';
import { Skeleton } from '@/components/ui/skeleton';

interface VerificationLoadingWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showSkeleton?: boolean;
}

/**
 * Wrapper component that prevents the "flash" effect during verification loading
 * by showing consistent loading state instead of unrestricted UI
 */
const VerificationLoadingWrapper: React.FC<VerificationLoadingWrapperProps> = ({
  children,
  fallback,
  showSkeleton = false,
}) => {
  const { isLoading, canAccessPlatform } = useVerification();

  // During loading, show either skeleton or restricted state
  if (isLoading) {
    if (showSkeleton) {
      return fallback || <Skeleton className="h-6 w-32" />;
    }
    
    // Show restricted version during loading to prevent flash
    return (
      <div className="cursor-not-allowed opacity-60 pointer-events-none">
        <div className="pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  // After loading, show appropriate state
  if (!canAccessPlatform) {
    return (
      <div className="cursor-not-allowed opacity-60 pointer-events-none">
        <div className="pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default VerificationLoadingWrapper;
