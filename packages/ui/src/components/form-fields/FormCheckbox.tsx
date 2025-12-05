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
import { Checkbox } from '../checkbox';

/**
 * FormCheckbox - Checkbox integrated with react-hook-form
 * 
 * Handles boolean values automatically. Label appears to the right
 * of the checkbox with proper click handling.
 * 
 * @example
 * ```tsx
 * <FormCheckbox
 *   name="isPrimaryContact"
 *   label="Set as primary contact"
 *   description="This person will receive all notifications"
 * />
 * ```
 */

export interface FormCheckboxProps {
  /** Field name (must match schema) */
  name: string;
  /** Label text (appears to right of checkbox) */
  label: string;
  /** Helper text below checkbox */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom wrapper className */
  wrapperClassName?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  description,
  disabled,
  wrapperClassName,
}) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={wrapperClassName}>
          <div className="flex items-start gap-3">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            <div className="flex-1 space-y-1 leading-none">
              <FormLabel className="cursor-pointer font-normal">
                {label}
              </FormLabel>
              {description && <FormDescription>{description}</FormDescription>}
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

FormCheckbox.displayName = 'FormCheckbox';
