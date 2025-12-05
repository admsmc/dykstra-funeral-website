'use client';

import { Input } from '@dykstra/ui';
import { forwardRef } from 'react';

/**
 * FormCurrencyInput - Temporary wrapper for currency input
 * TODO: Move to @dykstra/ui package
 */
export const FormCurrencyInput = forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input> & {
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
>(({ value, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-numeric characters except decimal point
    const cleaned = e.target.value.replace(/[^\d.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    
    if (onChange) {
      e.target.value = formatted;
      onChange(e);
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
        $
      </span>
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        className="pl-7"
      />
    </div>
  );
});

FormCurrencyInput.displayName = 'FormCurrencyInput';
