import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMessagingAccess } from '@/hooks/useMessaging';
import ChatInterface from './ChatInterface';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  currentUserId: string;
  title?: string;
}

export function MessagingModal({
  isOpen,
  onClose,
  bookingId,
  currentUserId,
  title = 'Chat',
}: MessagingModalProps) {
  const { hasAccess, loading: accessLoading } = useMessagingAccess(bookingId);

  // Close modal if no booking ID is provided
  useEffect(() => {
    if (isOpen && !bookingId) {
      onClose();
    }
  }, [isOpen, bookingId, onClose]);

  const renderContent = () => {
    if (!bookingId) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Booking Selected</h3>
            <p className="text-gray-600">
              Please select a booking to start a conversation.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (accessLoading) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold mb-2">Loading...</h3>
            <p className="text-gray-600">
              Checking conversation permissions...
            </p>
          </CardContent>
        </Card>
      );
    }

    if (hasAccess === false) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this conversation. 
              You can only chat with people involved in your bookings.
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <ChatInterface
        bookingId={bookingId}
        currentUserId={currentUserId}
        onClose={onClose}
        className="border-0 shadow-none rounded-none"
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6 pt-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MessagingModal;
