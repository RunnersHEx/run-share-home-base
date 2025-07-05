import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UnreadBadgeProps } from '@/types/messaging';

export function UnreadBadge({ count, className = '' }: UnreadBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <Badge 
      className={cn(
        'bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full p-0 border-2 border-white',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

export default UnreadBadge;
