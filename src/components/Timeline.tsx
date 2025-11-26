import React from 'react';

/**
 * Timeline Item
 * Represents a single event in the timeline
 */
export interface TimelineItem {
  id: string;
  timestamp: Date;
  title: string;
  description?: string;
  icon?: string;
  type?: 'created' | 'updated' | 'signed' | 'payment' | 'upload' | 'default';
  actor?: string; // Who performed the action
}

interface TimelineProps {
  items: TimelineItem[];
  variant?: 'compact' | 'comfortable';
}

/**
 * Timeline Component
 * Displays a vertical timeline of events with icons and timestamps
 * 
 * Features:
 * - Color-coded by event type
 * - Icons for visual distinction
 * - Actor information (who did what)
 * - Responsive design
 * - Two size variants
 */
export function Timeline({ items, variant = 'comfortable' }: TimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No timeline events yet.
      </div>
    );
  }

  const getTypeColor = (type: TimelineItem['type']): string => {
    switch (type) {
      case 'created':
        return 'bg-[--navy] border-[--navy]';
      case 'updated':
        return 'bg-[--sage] border-[--sage]';
      case 'signed':
        return 'bg-[--gold] border-[--gold]';
      case 'payment':
        return 'bg-green-600 border-green-600';
      case 'upload':
        return 'bg-blue-500 border-blue-500';
      default:
        return 'bg-gray-400 border-gray-400';
    }
  };

  const getDefaultIcon = (type: TimelineItem['type']): string => {
    switch (type) {
      case 'created':
        return '✨';
      case 'updated':
        return '📝';
      case 'signed':
        return '✍️';
      case 'payment':
        return '💳';
      case 'upload':
        return '📤';
      default:
        return '•';
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div className="relative">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const typeColor = getTypeColor(item.type);
        const icon = item.icon || getDefaultIcon(item.type);

        return (
          <div key={item.id} className="relative">
            {/* Connecting line */}
            {!isLast && (
              <div
                className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"
                style={{ marginLeft: isCompact ? '-2px' : '0' }}
              />
            )}

            {/* Timeline item */}
            <div className={`flex gap-4 ${isCompact ? 'pb-4' : 'pb-6'}`}>
              {/* Icon/dot */}
              <div className="relative flex-shrink-0">
                <div
                  className={`
                    ${isCompact ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'}
                    rounded-full border-2 ${typeColor}
                    flex items-center justify-center
                    text-white font-medium
                    z-10 relative bg-white
                  `}
                >
                  {icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                {/* Title and timestamp */}
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3
                    className={`
                      font-medium text-[--navy]
                      ${isCompact ? 'text-sm' : 'text-base'}
                    `}
                  >
                    {item.title}
                  </h3>
                  <time
                    className={`
                      text-gray-500 flex-shrink-0
                      ${isCompact ? 'text-xs' : 'text-sm'}
                    `}
                    dateTime={item.timestamp.toISOString()}
                  >
                    {formatTimestamp(item.timestamp)}
                  </time>
                </div>

                {/* Description */}
                {item.description && (
                  <p
                    className={`
                      text-gray-600
                      ${isCompact ? 'text-xs' : 'text-sm'}
                    `}
                  >
                    {item.description}
                  </p>
                )}

                {/* Actor */}
                {item.actor && (
                  <p
                    className={`
                      text-gray-500 italic mt-1
                      ${isCompact ? 'text-xs' : 'text-sm'}
                    `}
                  >
                    by {item.actor}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Format timestamp for display
 * Shows relative time for recent events, absolute date for older ones
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * TimelineCard Component
 * Wrapper that adds a card around the timeline
 */
interface TimelineCardProps {
  title: string;
  items: TimelineItem[];
  variant?: 'compact' | 'comfortable';
}

export function TimelineCard({ title, items, variant }: TimelineCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-serif text-[--navy] mb-4">{title}</h2>
      <Timeline items={items} variant={variant} />
    </div>
  );
}
