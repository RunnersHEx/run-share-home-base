import React from 'react';
import { useVerification } from '@/hooks/useVerification';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface VerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showToast?: boolean;
  toastMessage?: string;
  redirectToProfile?: boolean;
  showLoadingSkeleton?: boolean;
}

const VerificationGuard: React.FC<VerificationGuardProps> = ({
  children,
  fallback,
  showToast = true,
  toastMessage = "Debes completar la verificación de identidad para acceder a esta función. Ve a tu perfil y sube los documentos requeridos.",
  redirectToProfile = false,
  showLoadingSkeleton = false,
}) => {
  const { canAccessPlatform, isLoading } = useVerification();
  const navigate = useNavigate();

  const handleRestrictedAccess = () => {
    if (showToast) {
      toast.error(toastMessage);
    }
    if (redirectToProfile) {
      navigate('/profile', { state: { activeSection: 'verification' } });
    }
  };

  // Show loading skeleton instead of unrestricted content during verification check
  if (isLoading) {
    if (showLoadingSkeleton) {
      return <Skeleton className="h-6 w-32" />;
    }
    // For navigation items, show restricted state during loading to prevent flash
    return (
      <div className="cursor-not-allowed opacity-60 pointer-events-none">
        <div className="pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  if (!canAccessPlatform) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Return children but wrapped with click prevention
    return (
      <div 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleRestrictedAccess();
        }}
        className="cursor-not-allowed opacity-60 pointer-events-none"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default VerificationGuard;
