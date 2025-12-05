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
 * FormInput - Integrated text input with react-hook-form
 * 
 * Automatically handles validation state, error messages, and accessibility.
 * Supports all input types: text, email, tel, number, password, url, date, etc.
 * 
 * @example
 * ```tsx
 * <FormInput
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   placeholder="you@example.com"
 *   description="We'll never share your email"
 * />
 * ```
 */

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
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

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      name,
      label,
      description,
      required,
      wrapperClassName,
      className,
      type = 'text',
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
              <Input
                {...field}
                {...props}
                ref={ref}
                type={type}
                variant={fieldState.error ? 'error' : 'default'}
                className={className}
                aria-invalid={!!fieldState.error}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
