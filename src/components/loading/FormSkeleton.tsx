import { memo } from 'react';

interface FormSkeletonProps {
  fieldCount?: number;
  showSubmitButton?: boolean;
  className?: string;
}

export const FormSkeleton = memo(function FormSkeleton({
  fieldCount = 5,
  showSubmitButton = true,
  className = '',
}: FormSkeletonProps) {
  return (
    <div className={`space-y-6 animate-pulse ${className}`}>
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i}>
          {/* Label */}
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          {/* Input */}
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}

      {showSubmitButton && (
        <div className="flex justify-end pt-4">
          {/* Button placeholder */}
          <div className="h-10 bg-gray-300 rounded w-32"></div>
        </div>
      )}
    </div>
  );
});
