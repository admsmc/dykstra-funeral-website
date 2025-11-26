import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const timelineVariants = cva('relative space-y-6', {
  variants: {
    variant: {
      compact: 'space-y-4',
      comfortable: 'space-y-6',
    },
  },
  defaultVariants: {
    variant: 'comfortable',
  },
});

export interface TimelineProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof timelineVariants> {}

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(timelineVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Timeline.displayName = 'Timeline';

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  timestamp?: string | Date;
  title: string;
  description?: string;
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  isLast?: boolean;
}

export const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  (
    {
      className,
      icon,
      timestamp,
      title,
      description,
      status = 'default',
      isLast = false,
      children,
      ...props
    },
    ref
  ) => {
    const statusColors = {
      default: 'bg-gray-400',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
    };

    const formatTimestamp = (ts?: string | Date): string => {
      if (!ts) return '';
      const date = typeof ts === 'string' ? new Date(ts) : ts;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <div ref={ref} className={cn('relative flex gap-4', className)} {...props}>
        {/* Timeline line and dot */}
        <div className="relative flex flex-col items-center">
          {/* Dot/Icon */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white z-10',
              statusColors[status]
            )}
          >
            {icon ? (
              <div className="text-white text-sm">{icon}</div>
            ) : (
              <div className="h-2 w-2 rounded-full bg-white" />
            )}
          </div>

          {/* Connecting line */}
          {!isLast && (
            <div className="w-0.5 flex-1 bg-gray-300 min-h-[24px] mt-1" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 pb-6">
          {timestamp && (
            <time className="text-xs text-gray-500 mb-1 block">
              {formatTimestamp(timestamp)}
            </time>
          )}
          <h3 className="text-base font-semibold text-charcoal mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-2">{description}</p>
          )}
          {children && <div className="mt-2">{children}</div>}
        </div>
      </div>
    );
  }
);
TimelineItem.displayName = 'TimelineItem';

// Convenience component for common event types
export interface TimelineEventProps extends Omit<TimelineItemProps, 'icon'> {
  eventType?:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'signed'
    | 'payment'
    | 'upload'
    | 'message'
    | 'user';
}

export const TimelineEvent = React.forwardRef<HTMLDivElement, TimelineEventProps>(
  ({ eventType, status, ...props }, ref) => {
    const eventIcons = {
      created: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      updated: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
      ),
      deleted: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      ),
      signed: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      payment: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      ),
      upload: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
      ),
      message: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      user: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    };

    // Auto-set status based on event type if not provided
    const autoStatus = !status
      ? eventType === 'created'
        ? 'success'
        : eventType === 'deleted'
        ? 'error'
        : eventType === 'payment' || eventType === 'signed'
        ? 'success'
        : 'default'
      : status;

    return (
      <TimelineItem
        ref={ref}
        icon={eventType ? eventIcons[eventType] : undefined}
        status={autoStatus}
        {...props}
      />
    );
  }
);
TimelineEvent.displayName = 'TimelineEvent';
