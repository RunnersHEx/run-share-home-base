import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount } from '@/hooks/useMessaging';

// ==========================================
// TYPES
// ==========================================

interface UnreadBadgeFixedProps {
  className?: string;
  showZero?: boolean;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'pulse' | 'minimal';
}

// ==========================================
// COMPONENT
// ==========================================

export function UnreadBadge({
  className = '',
  showZero = false,
  maxCount = 99,
  size = 'md',
  variant = 'default'
}: UnreadBadgeFixedProps) {
  const { unreadCount, loading } = useUnreadCount();

  // Don't show badge if loading or no unread messages (unless showZero is true)
  if (loading || (!showZero && unreadCount === 0)) {
    return null;
  }

  // Format count with max limit
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();

  // Size classes
  const sizeClasses = {
    sm: 'text-xs min-w-[16px] h-4 px-1',
    md: 'text-xs min-w-[20px] h-5 px-2',
    lg: 'text-sm min-w-[24px] h-6 px-2'
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-red-500 text-white',
    pulse: 'bg-red-500 text-white animate-pulse',
    minimal: 'bg-gray-500 text-white'
  };

  const baseClasses = `
    inline-flex items-center justify-center rounded-full font-medium
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <Badge className={baseClasses}>
      {displayCount}
    </Badge>
  );
}

// ==========================================
// SIMPLIFIED NOTIFICATION DOT
// ==========================================

interface NotificationDotProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'blue' | 'green' | 'yellow';
  pulse?: boolean;
}

export function NotificationDot({
  className = '',
  size = 'md',
  color = 'red',
  pulse = false
}: NotificationDotProps) {
  const { unreadCount, loading } = useUnreadCount();

  // Don't show if loading or no unread messages
  if (loading || unreadCount === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
  };

  const baseClasses = `
    rounded-full
    ${sizeClasses[size]}
    ${colorClasses[color]}
    ${pulse ? 'animate-pulse' : ''}
    ${className}
  `;

  return <div className={baseClasses} />;
}

// ==========================================
// MESSAGE COUNTER
// ==========================================

interface MessageCounterProps {
  className?: string;
  prefix?: string;
  suffix?: string;
  showZero?: boolean;
}

export function MessageCounter({
  className = '',
  prefix = '',
  suffix = '',
  showZero = false
}: MessageCounterProps) {
  const { unreadCount, loading } = useUnreadCount();

  if (loading) {
    return (
      <span className={`text-gray-400 ${className}`}>
        {prefix}...{suffix}
      </span>
    );
  }

  if (!showZero && unreadCount === 0) {
    return null;
  }

  return (
    <span className={className}>
      {prefix}{unreadCount}{suffix}
    </span>
  );
}

export default UnreadBadge;
