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
import { Textarea } from '../textarea';
import { cn } from '../../lib/utils';

/**
 * FormTextarea - Integrated textarea with react-hook-form
 * 
 * Automatically handles validation state, error messages, character counting.
 * Supports auto-resize for dynamic height based on content.
 * 
 * @example
 * ```tsx
 * <FormTextarea
 *   name="message"
 *   label="Your Message"
 *   placeholder="Tell us what you need..."
 *   maxLength={2000}
 *   showCharacterCount
 *   autoResize
 * />
 * ```
 */

export interface FormTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> {
  /** Field name (must match schema) */
  name: string;
  /** Label text */
  label?: string;
  /** Helper text below textarea */
  description?: string;
  /** Show required asterisk */
  required?: boolean;
  /** Show character count (current / max) */
  showCharacterCount?: boolean;
  /** Auto-resize textarea based on content */
  autoResize?: boolean;
  /** Custom wrapper className */
  wrapperClassName?: string;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      name,
      label,
      description,
      required,
      showCharacterCount,
      autoResize,
      wrapperClassName,
      className,
      maxLength,
      ...props
    },
    ref
  ) => {
    const { control, watch } = useFormContext();
    const fieldValue = watch(name) as string | undefined;
    const currentLength = fieldValue?.length || 0;

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
              <Textarea
                {...field}
                {...props}
                ref={ref}
                variant={fieldState.error ? 'error' : 'default'}
                autoResize={autoResize}
                maxLength={maxLength}
                className={className}
                aria-invalid={!!fieldState.error}
              />
            </FormControl>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {description && <FormDescription>{description}</FormDescription>}
                <FormMessage />
              </div>
              {showCharacterCount && maxLength && (
                <span
                  className={cn(
                    'text-xs text-gray-500',
                    currentLength > maxLength * 0.9 && 'text-orange-600',
                    currentLength >= maxLength && 'text-red-600'
                  )}
                >
                  {currentLength} / {maxLength}
                </span>
              )}
            </div>
          </FormItem>
        )}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
