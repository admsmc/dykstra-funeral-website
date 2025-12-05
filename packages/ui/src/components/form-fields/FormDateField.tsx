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
 * FormDateField - Date input integrated with react-hook-form
 * 
 * Uses HTML5 date input for built-in date picker support.
 * Value is automatically converted to/from Date objects.
 * 
 * @example
 * ```tsx
 * <FormDateField
 *   name="serviceDate"
 *   label="Service Date"
 *   description="When the service will be held"
 *   min={new Date()} // Cannot be in the past
 * />
 * ```
 */

export interface FormDateFieldProps
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

export const FormDateField = React.forwardRef<HTMLInputElement, FormDateFieldProps>(
  (
    {
      name,
      label,
      description,
      required,
      wrapperClassName,
      className,
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
          // Convert Date to string for input, and string to Date on change
          const value = field.value instanceof Date
            ? field.value.toISOString().split('T')[0]
            : field.value || '';

          const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const dateValue = e.target.value ? new Date(e.target.value) : null;
            field.onChange(dateValue);
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
                  type="date"
                  value={value}
                  onChange={handleChange}
                  onBlur={field.onBlur}
                  variant={fieldState.error ? 'error' : 'default'}
                  className={className}
                  aria-invalid={!!fieldState.error}
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

FormDateField.displayName = 'FormDateField';
