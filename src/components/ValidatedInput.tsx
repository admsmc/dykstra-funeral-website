import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

export interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  registration?: UseFormRegisterReturn;
  required?: boolean;
}

/**
 * Validated Input Component
 * 
 * Features:
 * - Label with required indicator
 * - Error message display
 * - Optional hint text
 * - Accessible with proper ARIA attributes
 * - Highlighted error state
 * 
 * @example
 * <ValidatedInput
 *   label="Email"
 *   type="email"
 *   error={errors.email?.message}
 *   registration={register('email')}
 *   required
 * />
 */
export function ValidatedInput({
  label,
  error,
  hint,
  registration,
  required,
  id,
  className,
  ...props
}: ValidatedInputProps) {
  const inputId = id || registration?.name || label.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;

  return (
    <div className="space-y-1">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Hint */}
      {hint && !hasError && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}

      {/* Input */}
      <input
        id={inputId}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
          transition-colors
          ${hasError 
            ? 'border-red-500 bg-red-50 focus:ring-red-500' 
            : 'border-gray-300 hover:border-gray-400'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
          ${className || ''}
        `}
        {...registration}
        {...props}
      />

      {/* Error Message */}
      {hasError && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  registration?: UseFormRegisterReturn;
  required?: boolean;
}

/**
 * Validated Textarea Component
 */
export function ValidatedTextarea({
  label,
  error,
  hint,
  registration,
  required,
  id,
  className,
  rows = 4,
  ...props
}: ValidatedTextareaProps) {
  const inputId = id || registration?.name || label.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;

  return (
    <div className="space-y-1">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Hint */}
      {hint && !hasError && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}

      {/* Textarea */}
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
          transition-colors
          resize-y
          ${hasError 
            ? 'border-red-500 bg-red-50 focus:ring-red-500' 
            : 'border-gray-300 hover:border-gray-400'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
          ${className || ''}
        `}
        {...registration}
        {...props}
      />

      {/* Error Message */}
      {hasError && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export interface ValidatedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  registration?: UseFormRegisterReturn;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

/**
 * Validated Select Component
 */
export function ValidatedSelect({
  label,
  error,
  hint,
  registration,
  required,
  options,
  placeholder,
  id,
  className,
  ...props
}: ValidatedSelectProps) {
  const inputId = id || registration?.name || label.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;

  return (
    <div className="space-y-1">
      {/* Label */}
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Hint */}
      {hint && !hasError && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}

      {/* Select */}
      <select
        id={inputId}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`
          w-full px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[--navy] focus:border-transparent
          transition-colors
          ${hasError 
            ? 'border-red-500 bg-red-50 focus:ring-red-500' 
            : 'border-gray-300 hover:border-gray-400'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
          ${className || ''}
        `}
        {...registration}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Error Message */}
      {hasError && (
        <p
          id={`${inputId}-error`}
          className="text-sm text-red-600 flex items-center gap-1"
          role="alert"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
