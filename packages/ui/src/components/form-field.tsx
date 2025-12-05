import * as React from 'react';
import { cn } from '../lib/utils';

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const SimpleFormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    { label, htmlFor, error, description, required, children, className },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)}>
        {label && (
          <label
            htmlFor={htmlFor}
            className="block text-sm font-medium text-charcoal"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {description && !error && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
        {children}
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

SimpleFormField.displayName = 'SimpleFormField';

// Helper component for grouping form fields
export const FormGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-4', className)} {...props} />
));
FormGroup.displayName = 'FormGroup';

// Helper component for inline form fields (e.g., checkbox with label)
export interface InlineFormFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const InlineFormField = React.forwardRef<
  HTMLDivElement,
  InlineFormFieldProps
>(({ label, description, children, className }, ref) => (
  <div ref={ref} className={cn('flex items-start gap-3', className)}>
    <div className="flex items-center h-5">{children}</div>
    <div className="flex-1">
      <label className="text-sm font-medium text-charcoal cursor-pointer">
        {label}
      </label>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  </div>
));
InlineFormField.displayName = 'InlineFormField';
