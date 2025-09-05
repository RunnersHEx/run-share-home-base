import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export interface VerificationStatus {
  hasUploadedDocuments: boolean;
  isVerifiedByAdmin: boolean;
  canAccessPlatform: boolean;
  showVerificationModal: boolean;
  requiredDocuments: {
    id_document: boolean;
    selfie_with_id: boolean;
  };
  uploadedDocumentCount: number;
  isLoading: boolean;
}

export const useVerification = (): VerificationStatus => {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const { profile: useProfileData, loading: profileLoading } = useProfile();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for verification status change events
  useEffect(() => {
    const handleVerificationChange = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('verificationStatusChanged', handleVerificationChange);
    
    return () => {
      window.removeEventListener('verificationStatusChanged', handleVerificationChange);
    };
  }, []);

  // Use the most up-to-date profile data available - prefer useProfile over authProfile
  const profile = useProfileData || authProfile;
  
  // Simplified loading logic - only consider loading if we don't have basic user data
  const isLoading = !user || authLoading;

  const verificationStatus = useMemo(() => {
    // If no user, return safe defaults
    if (!user) {
      return {
        hasUploadedDocuments: false,
        isVerifiedByAdmin: false,
        canAccessPlatform: false,
        showVerificationModal: false,
        requiredDocuments: {
          id_document: false,
          selfie_with_id: false,
        },
        uploadedDocumentCount: 0,
        isLoading: true,
      };
    }

    // If user exists but we're still loading auth, return restricted state immediately
    if (isLoading) {
      return {
        hasUploadedDocuments: false,
        isVerifiedByAdmin: false,
        canAccessPlatform: false, // Restrict access during loading
        showVerificationModal: false, // Never show modal during loading
        requiredDocuments: {
          id_document: false,
          selfie_with_id: false,
        },
        uploadedDocumentCount: 0,
        isLoading: true,
      };
    }

    // If we have user but no profile data, assume no verification (be restrictive)
    if (!profile) {
      return {
        hasUploadedDocuments: false,
        isVerifiedByAdmin: false,
        canAccessPlatform: false,
        showVerificationModal: false, // Don't show modal if profile data is not yet available
        requiredDocuments: {
          id_document: false,
          selfie_with_id: false,
        },
        uploadedDocumentCount: 0,
        isLoading: false,
      };
    }

    const verificationDocs = profile.verification_documents || [];
    
    // Check for required documents
    const hasIdDocument = verificationDocs.some(doc => doc.includes('id_document'));
    const hasSelfieWithId = verificationDocs.some(doc => doc.includes('selfie_with_id'));
    
    // User has uploaded documents if they have both required documents
    const hasUploadedDocuments = hasIdDocument && hasSelfieWithId;
    
    // User is verified by admin if status is 'verified' or 'approved'
    const isVerifiedByAdmin = profile.verification_status === 'verified' || profile.verification_status === 'approved';
    
    // User can access platform if they have uploaded the required documents
    const canAccessPlatform = hasUploadedDocuments;
    
    // Show verification modal ONLY if user hasn't uploaded documents (regardless of admin verification status)
    const showVerificationModal = !hasUploadedDocuments;
    
    return {
      hasUploadedDocuments,
      isVerifiedByAdmin,
      canAccessPlatform,
      showVerificationModal,
      requiredDocuments: {
        id_document: hasIdDocument,
        selfie_with_id: hasSelfieWithId,
      },
      uploadedDocumentCount: verificationDocs.length,
      isLoading: false,
    };
  }, [user, profile, forceUpdate, isLoading]);

  return verificationStatus;
};
