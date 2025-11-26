import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

/**
 * Stack - Vertical spacing container
 */
const stackVariants = cva('flex flex-col', {
  variants: {
    spacing: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
  },
  defaultVariants: {
    spacing: 'md',
    align: 'stretch',
  },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, spacing, align, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(stackVariants({ spacing, align }), className)}
        {...props}
      />
    );
  }
);
Stack.displayName = 'Stack';

/**
 * Grid - Responsive grid layout
 */
const gridVariants = cva('grid', {
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
      12: 'grid-cols-12',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  defaultVariants: {
    cols: 2,
    gap: 'md',
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(gridVariants({ cols, gap }), className)}
        {...props}
      />
    );
  }
);
Grid.displayName = 'Grid';

/**
 * Panel - Content panel with optional header
 */
const panelVariants = cva('rounded-lg bg-white shadow-md', {
  variants: {
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
  },
  defaultVariants: {
    padding: 'md',
  },
});

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, padding, header, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-white shadow-md overflow-hidden',
          className
        )}
        {...props}
      >
        {header && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            {header}
          </div>
        )}
        <div className={cn(panelVariants({ padding: padding || (header || footer ? 'md' : 'md') }))}>
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    );
  }
);
Panel.displayName = 'Panel';

/**
 * PanelHeader - Styled header for Panel
 */
export const PanelHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
  }
>(({ className, title, description, actions, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-start justify-between gap-4', className)}
    {...props}
  >
    <div className="flex-1">
      {title && (
        <h3 className="text-lg font-serif font-semibold text-navy">{title}</h3>
      )}
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
      {children}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
));
PanelHeader.displayName = 'PanelHeader';

/**
 * PageShell - Standard page wrapper with breadcrumbs
 */
export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  (
    {
      className,
      title,
      description,
      breadcrumbs,
      actions,
      maxWidth = 'full',
      children,
      ...props
    },
    ref
  ) => {
    const maxWidthClasses = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-8', maxWidthClasses[maxWidth])}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <svg
                        className="w-4 h-4 text-gray-400 mx-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="text-gray-500 hover:text-navy transition-colors"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Header */}
          {(title || actions) && (
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                {title && (
                  <h1 className="text-4xl font-serif text-navy font-bold">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-lg text-gray-600 mt-2">{description}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          )}

          {/* Content */}
          <div>{children}</div>
        </div>
      </div>
    );
  }
);
PageShell.displayName = 'PageShell';
