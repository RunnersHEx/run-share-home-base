import React, { useState, useEffect } from 'react';
import { X, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMessagingAccess } from '@/hooks/useMessaging';
import ChatInterface from './ChatInterface';
import MessagingErrorBoundary from './MessagingErrorBoundary';

// ==========================================
// TYPES
// ==========================================

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  currentUserId: string;
  otherParticipantName?: string;
}

// ==========================================
// COMPONENTS
// ==========================================

function AccessDeniedState({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
      <p className="text-gray-600 mb-6">
        You don't have permission to view this conversation. You must be either the guest or host of this booking.
      </p>
      <Button onClick={onClose} className="w-full">
        Close
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-6 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Checking access permissions...</p>
    </div>
  );
}

function ErrorState({ error, onRetry, onClose }: { 
  error: string; 
  onRetry: () => void; 
  onClose: () => void; 
}) {
  return (
    <div className="p-6">
      <Alert className="border-red-200 bg-red-50 mb-4">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          {error}
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button onClick={onRetry} className="flex-1">
          Try Again
        </Button>
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function MessagingModal({
  isOpen,
  onClose,
  bookingId,
  currentUserId,
  otherParticipantName
}: MessagingModalProps) {
  const [mounted, setMounted] = useState(false);
  const { hasAccess, loading: accessLoading } = useMessagingAccess(bookingId);

  // Handle component mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server
  if (!mounted) {
    return null;
  }

  // Validate required props
  if (!bookingId || !currentUserId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] h-[600px] p-0">
          <ErrorState
            error="Missing required information. Please try again."
            onRetry={onClose}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>
    );
  }

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] max-h-[600px] p-0 overflow-hidden">
        <MessagingErrorBoundary
          fallback={
            <ErrorState
              error="The messaging system encountered an error"
              onRetry={() => window.location.reload()}
              onClose={handleClose}
            />
          }
        >
          <DialogHeader className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <span>
                  {otherParticipantName ? `Chat with ${otherParticipantName}` : 'Conversation'}
                </span>
              </DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose}
                className="rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {accessLoading ? (
              <LoadingState />
            ) : hasAccess === false ? (
              <AccessDeniedState onClose={handleClose} />
            ) : hasAccess === true ? (
              <ChatInterface
                bookingId={bookingId}
                currentUserId={currentUserId}
                onClose={undefined} // No close button in modal - use dialog close
                className="h-full"
              />
            ) : (
              <ErrorState
                error="Unable to verify access permissions"
                onRetry={() => window.location.reload()}
                onClose={handleClose}
              />
            )}
          </div>
        </MessagingErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}

export default MessagingModal;
