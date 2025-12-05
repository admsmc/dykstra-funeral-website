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
import { RadioGroup, RadioGroupItem } from '../radio-group';
import { Label } from '../label';

/**
 * FormRadioGroup - Radio button group integrated with react-hook-form
 * 
 * For single-choice selection from a list of options.
 * Uses Radix UI for accessibility and keyboard navigation.
 * 
 * @example
 * ```tsx
 * <FormRadioGroup
 *   name="serviceType"
 *   label="Service Type"
 *   description="Select the type of service"
 *   options={[
 *     { value: 'funeral', label: 'Funeral Service' },
 *     { value: 'memorial', label: 'Memorial Service' },
 *     { value: 'graveside', label: 'Graveside Service' },
 *   ]}
 * />
 * ```
 */

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface FormRadioGroupProps {
  /** Field name (must match schema) */
  name: string;
  /** Label text */
  label?: string;
  /** Helper text below radio group */
  description?: string;
  /** Show required asterisk */
  required?: boolean;
  /** Radio options */
  options: RadioOption[];
  /** Custom wrapper className */
  wrapperClassName?: string;
  /** Layout direction */
  direction?: 'vertical' | 'horizontal';
}

export const FormRadioGroup: React.FC<FormRadioGroupProps> = ({
  name,
  label,
  description,
  required,
  options,
  wrapperClassName,
  direction = 'vertical',
}) => {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={wrapperClassName}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-red-600 ml-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className={direction === 'horizontal' ? 'flex flex-wrap gap-4' : undefined}
            >
              {options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start gap-3"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`${name}-${option.value}`}
                    disabled={option.disabled}
                  />
                  <div className="flex-1 space-y-1 leading-none">
                    <Label
                      htmlFor={`${name}-${option.value}`}
                      className="cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

FormRadioGroup.displayName = 'FormRadioGroup';
