import { ReactNode } from 'react';
import { Separator } from '@dykstra/ui';

export interface DashboardLayoutProps {
  /** Page title (h1) */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Action buttons (e.g., "Create New") */
  actions?: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Optional breadcrumb navigation */
  breadcrumb?: ReactNode;
  /** Custom class name for container */
  className?: string;
}

/**
 * Dashboard Layout
 * 
 * Consistent layout for dashboard/admin pages with:
 * - Title and subtitle
 * - Action buttons
 * - Optional breadcrumb
 * - Responsive container
 * 
 * @example
 * ```tsx
 * <DashboardLayout
 *   title="Template Library"
 *   subtitle="Manage memorial templates"
 *   actions={
 *     <Button onClick={() => setCreateOpen(true)}>
 *       Create Template
 *     </Button>
 *   }
 * >
 *   <TemplateGrid templates={templates} />
 * </DashboardLayout>
 * ```
 */
export function DashboardLayout({
  title,
  subtitle,
  actions,
  children,
  breadcrumb,
  className = '',
}: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen bg-neutral-50 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb (optional) */}
        {breadcrumb && (
          <div className="mb-4">
            {breadcrumb}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-900 font-serif">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-base text-neutral-600">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        <Separator className="mb-6" />

        {/* Main content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
