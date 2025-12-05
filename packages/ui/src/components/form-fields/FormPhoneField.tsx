import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '../form';
import { Input } from '../input';

/**
 * FormPhoneField - Phone number input with US formatting
 * 
 * Automatically formats as user types: (555) 123-4567
 * Accepts various input formats and normalizes them.
 * 
 * @example
 * ```tsx
 * <FormPhoneField
 *   name="contactPhone"
 *   label="Phone Number"
 *   placeholder="(555) 123-4567"
 *   description="Primary contact number"
 * />
 * ```
 */

export interface FormPhoneFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'> {
  /** Field name (must match schema) */
  name: string;
  /** Label text */
  label?: string;
  /** Helper text below input */
  description?: string;
  /** Show required asterisk */
  required?: boolean;
  /** Custom wrapper className */
  wrapperClassName?: string;
}

/**
 * Format phone number as user types
 * Handles: 1234567890 → (123) 456-7890
 */
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Extract raw digits from formatted phone number
 */
function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export const FormPhoneField = React.forwardRef<HTMLInputElement, FormPhoneFieldProps>(
  (
    {
      name,
      label,
      description,
      required,
      wrapperClassName,
      className,
      placeholder = '(555) 123-4567',
      ...props
    },
    ref
  ) => {
    const { control } = useFormContext();

    return (
      <FormField
        control={control}
        name={name}
        render={({ field, fieldState }) => {
          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const formatted = formatPhoneNumber(e.target.value);
            field.onChange(formatted);
          };

          return (
            <FormItem className={wrapperClassName}>
              {label && (
                <FormLabel>
                  {label}
                  {required && <span className="text-red-600 ml-1">*</span>}
                </FormLabel>
              )}
              <FormControl>
                <Input
                  {...props}
                  ref={ref}
                  type="tel"
                  placeholder={placeholder}
                  value={field.value || ''}
                  onChange={handleChange}
                  onBlur={field.onBlur}
                  maxLength={14} // (555) 123-4567 = 14 characters
                  variant={fieldState.error ? 'error' : 'default'}
                  className={className}
                  aria-invalid={!!fieldState.error}
                  inputMode="tel"
                />
              </FormControl>
              {description && <FormDescription>{description}</FormDescription>}
              <FormMessage />
            </FormItem>
          );
        }}
      />
    );
  }
);

FormPhoneField.displayName = 'FormPhoneField';
