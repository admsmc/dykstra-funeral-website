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
import { cn } from '../../lib/utils';

/**
 * FormSelect - Native HTML select integrated with react-hook-form
 * 
 * Simple, accessible dropdown for form selection. For more advanced
 * select components, see FormRadixSelect.
 * 
 * @example
 * ```tsx
 * <FormSelect
 *   name="caseType"
 *   label="Case Type"
 *   placeholder="Select type..."
 *   options={[
 *     { value: 'AT_NEED', label: 'At-Need' },
 *     { value: 'PRE_NEED', label: 'Pre-Need' },
 *   ]}
 * />
 * ```
 */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> {
  /** Field name (must match schema) */
  name: string;
  /** Label text */
  label?: string;
  /** Helper text below select */
  description?: string;
  /** Show required asterisk */
  required?: boolean;
  /** Placeholder option */
  placeholder?: string;
  /** Select options */
  options: SelectOption[];
  /** Custom wrapper className */
  wrapperClassName?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      name,
      label,
      description,
      required,
      placeholder,
      options,
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
        render={({ field, fieldState }) => (
          <FormItem className={wrapperClassName}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-red-600 ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <select
                {...field}
                {...props}
                ref={ref}
                className={cn(
                  'w-full rounded border bg-white px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
                  fieldState.error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-navy focus:ring-navy',
                  className
                )}
                aria-invalid={!!fieldState.error}
              >
                {placeholder && (
                  <option value="" disabled>
                    {placeholder}
                  </option>
                )}
                {options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);

FormSelect.displayName = 'FormSelect';
