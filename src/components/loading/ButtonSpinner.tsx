import { memo } from 'react';

interface ButtonSpinnerProps {
  className?: string;
}

export const ButtonSpinner = memo(function ButtonSpinner({ className = '' }: ButtonSpinnerProps) {
  return (
    <div
      className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
});
