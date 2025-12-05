import * as React from 'react';
import { FormInput } from './FormInput';

/**
 * NameFields - Composite component for full name input
 * 
 * Groups first name, middle name (optional), and last name fields.
 * Field names are prefixed for nested form structures.
 * 
 * @example
 * ```tsx
 * // Simple usage
 * <NameFields />
 * 
 * // With prefix for nested forms
 * <NameFields prefix="decedent" />
 * // Creates fields: decedent.firstName, decedent.middleName, decedent.lastName
 * 
 * // Without middle name
 * <NameFields includeMiddleName={false} />
 * ```
 */

export interface NameFieldsProps {
  /** Prefix for field names (e.g., "decedent" → decedent.firstName) */
  prefix?: string;
  /** Show required asterisks */
  required?: boolean;
  /** Include middle name field */
  includeMiddleName?: boolean;
  /** Custom first name label */
  firstNameLabel?: string;
  /** Custom middle name label */
  middleNameLabel?: string;
  /** Custom last name label */
  lastNameLabel?: string;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
}

export const NameFields: React.FC<NameFieldsProps> = ({
  prefix,
  required = false,
  includeMiddleName = true,
  firstNameLabel = 'First Name',
  middleNameLabel = 'Middle Name',
  lastNameLabel = 'Last Name',
  layout = 'horizontal',
}) => {
  const getName = (field: string) => {
    return prefix ? `${prefix}.${field}` : field;
  };

  if (layout === 'vertical') {
    return (
      <div className="space-y-4">
        <FormInput
          name={getName('firstName')}
          label={firstNameLabel}
          placeholder="John"
          required={required}
        />
        
        {includeMiddleName && (
          <FormInput
            name={getName('middleName')}
            label={middleNameLabel}
            placeholder="Robert"
            required={false}
          />
        )}
        
        <FormInput
          name={getName('lastName')}
          label={lastNameLabel}
          placeholder="Smith"
          required={required}
        />
      </div>
    );
  }

  // Horizontal layout (default)
  if (includeMiddleName) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          name={getName('firstName')}
          label={firstNameLabel}
          placeholder="John"
          required={required}
        />
        
        <FormInput
          name={getName('middleName')}
          label={middleNameLabel}
          placeholder="Robert"
          required={false}
        />
        
        <FormInput
          name={getName('lastName')}
          label={lastNameLabel}
          placeholder="Smith"
          required={required}
        />
      </div>
    );
  }

  // Without middle name
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormInput
        name={getName('firstName')}
        label={firstNameLabel}
        placeholder="John"
        required={required}
      />
      
      <FormInput
        name={getName('lastName')}
        label={lastNameLabel}
        placeholder="Smith"
        required={required}
      />
    </div>
  );
};

NameFields.displayName = 'NameFields';
