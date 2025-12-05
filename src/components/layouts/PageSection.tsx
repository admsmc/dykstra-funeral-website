import { ReactNode } from 'react';
import { Card } from '@dykstra/ui';

export interface PageSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Section content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Action buttons for section header */
  actions?: ReactNode;
  /** Use Card wrapper (default: true) */
  withCard?: boolean;
  /** Card padding (default: true) */
  withPadding?: boolean;
}

/**
 * Page Section
 * 
 * Reusable section component for grouping related content with
 * optional title, description, and actions.
 * 
 * @example
 * ```tsx
 * <PageSection
 *   title="Financial Summary"
 *   description="Overview of payments and outstanding balance"
 *   actions={<Button variant="outline">View Details</Button>}
 * >
 *   <FinancialStats data={financial} />
 * </PageSection>
 * ```
 * 
 * @example
 * // Without card wrapper
 * ```tsx
 * <PageSection
 *   title="Recent Activity"
 *   withCard={false}
 * >
 *   <ActivityList items={activities} />
 * </PageSection>
 * ```
 */
export function PageSection({
  title,
  description,
  children,
  className = '',
  actions,
  withCard = true,
  withPadding = true,
}: PageSectionProps) {
  const header = (title || description || actions) && (
    <div className={`${withCard && withPadding ? 'mb-4' : 'mb-6'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {title && (
            <h2 className="text-xl font-semibold text-neutral-900">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-neutral-600">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );

  const content = (
    <>
      {header}
      {children}
    </>
  );

  if (withCard) {
    return (
      <section className={className}>
        <Card className={withPadding ? 'p-6' : ''}>
          {content}
        </Card>
      </section>
    );
  }

  return (
    <section className={className}>
      {content}
    </section>
  );
}
