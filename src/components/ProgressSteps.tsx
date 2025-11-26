import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

export interface ProgressStepsProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  variant?: 'horizontal' | 'vertical';
  showDescription?: boolean;
}

/**
 * Progress Steps Component
 * Visual indicator for multi-step processes
 * 
 * Features:
 * - Horizontal or vertical layout
 * - Completed, current, and upcoming states
 * - Optional step descriptions
 * - Accessible with ARIA attributes
 * - Responsive design
 * 
 * @example
 * <ProgressSteps
 *   steps={[
 *     { id: 'review', label: 'Review' },
 *     { id: 'consent', label: 'Consent' },
 *     { id: 'sign', label: 'Sign' },
 *   ]}
 *   currentStep={1}
 * />
 */
export function ProgressSteps({
  steps,
  currentStep,
  variant = 'horizontal',
  showDescription = false,
}: ProgressStepsProps) {
  if (variant === 'vertical') {
    return (
      <nav aria-label="Progress" className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    transition-colors duration-200
                    ${
                      isCompleted
                        ? 'bg-[--navy] text-white'
                        : isCurrent
                        ? 'bg-[--sage] text-white ring-4 ring-[--sage]/20'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`
                      w-0.5 h-12 mt-2
                      ${isCompleted ? 'bg-[--navy]' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pt-2">
                <p
                  className={`
                    text-sm font-medium
                    ${
                      isCompleted || isCurrent
                        ? 'text-[--navy]'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </p>
                {showDescription && step.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </nav>
    );
  }

  // Horizontal layout
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* Step indicator */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    transition-colors duration-200 relative z-10
                    ${
                      isCompleted
                        ? 'bg-[--navy] text-white'
                        : isCurrent
                        ? 'bg-[--sage] text-white ring-4 ring-[--sage]/20'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <p
                  className={`
                    text-xs sm:text-sm font-medium mt-2 text-center
                    ${
                      isCompleted || isCurrent
                        ? 'text-[--navy]'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </p>

                {showDescription && step.description && (
                  <p className="text-xs text-gray-500 mt-1 text-center max-w-[120px]">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mx-2 -mt-12">
                  <div
                    className={`
                      h-full transition-colors duration-200
                      ${isCompleted ? 'bg-[--navy]' : 'bg-gray-200'}
                    `}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface ProgressPercentageProps {
  percentage: number; // 0-100
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Progress Percentage Component
 * Circular or bar progress indicator
 * 
 * @example
 * <ProgressPercentage
 *   percentage={75}
 *   label="Arrangements Complete"
 *   showLabel
 * />
 */
export function ProgressPercentage({
  percentage,
  label,
  showLabel = true,
  size = 'md',
}: ProgressPercentageProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="space-y-2">
      {showLabel && label && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[--navy]">{label}</p>
          <p className="text-sm text-gray-600">{clampedPercentage}%</p>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className="h-full bg-[--sage] transition-all duration-500 ease-out"
          style={{ width: `${clampedPercentage}%` }}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}

export interface CircularProgressProps {
  percentage: number; // 0-100
  size?: number; // Size in pixels
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
}

/**
 * Circular Progress Component
 * Circular progress indicator with percentage
 */
export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
  showPercentage = true,
}: CircularProgressProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-[--sage] transition-all duration-500 ease-out"
            role="progressbar"
            aria-valuenow={clampedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-[--navy]">
              {Math.round(clampedPercentage)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <p className="text-sm font-medium text-gray-700 text-center">{label}</p>
      )}
    </div>
  );
}
