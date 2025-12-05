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
import { cn } from '../../lib/utils';

/**
 * FormCurrencyInput - Currency input with $ prefix and formatting
 * 
 * Automatically handles decimal precision (2 places) and displays
 * $ symbol. Internally stores as number for validation.
 * 
 * @example
 * ```tsx
 * <FormCurrencyInput
 *   name="amount"
 *   label="Payment Amount"
 *   placeholder="0.00"
 *   min={0.01}
 *   max={999999.99}
 * />
 * ```
 */

export interface FormCurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'name' | 'type' | 'onChange' | 'value'
  > {
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

export const FormCurrencyInput = React.forwardRef<
  HTMLInputElement,
  FormCurrencyInputProps
>(
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
        render={({ field, fieldState }) => (
          <FormItem className={wrapperClassName}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-red-600 ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                  $
                </span>
                <Input
                  {...field}
                  {...props}
                  ref={ref}
                  type="number"
                  step="0.01"
                  min={props.min ?? 0.01}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Convert empty string to 0, otherwise parse as float
                    field.onChange(value === '' ? 0 : parseFloat(value));
                  }}
                  value={field.value || ''}
                  variant={fieldState.error ? 'error' : 'default'}
                  className={cn('pl-8', className)}
                  aria-invalid={!!fieldState.error}
                />
              </div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);

FormCurrencyInput.displayName = 'FormCurrencyInput';
