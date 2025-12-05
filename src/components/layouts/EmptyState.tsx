import { ReactNode } from 'react';
import { Button } from '@dykstra/ui';

export interface EmptyStateProps {
  /** Icon or illustration */
  icon?: ReactNode;
  /** Empty state title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty State
 * 
 * Display when there's no data to show, with optional
 * icon, description, and call-to-action.
 * 
 * @example
 * ```tsx
 * import { FileText } from 'lucide-react';
 * 
 * <EmptyState
 *   icon={<FileText className="w-12 h-12" />}
 *   title="No templates yet"
 *   description="Create your first memorial template to get started"
 *   action={{
 *     label: 'Create Template',
 *     onClick: () => setCreateOpen(true),
 *   }}
 * />
 * ```
 * 
 * @example
 * // Minimal usage
 * ```tsx
 * <EmptyState title="No results found" />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {icon && (
        <div className="mb-4 text-neutral-400">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-neutral-600 max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
