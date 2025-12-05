import * as React from 'react';
import { FormInput } from './FormInput';
import { FormSelect } from './FormSelect';

/**
 * AddressFields - Composite component for US address input
 * 
 * Groups street, city, state, and ZIP code fields together.
 * Field names are prefixed for nested form structures.
 * 
 * @example
 * ```tsx
 * // Simple usage
 * <AddressFields />
 * 
 * // With prefix for nested forms
 * <AddressFields prefix="billing" />
 * // Creates fields: billing.street, billing.city, billing.state, billing.zip
 * ```
 */

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export interface AddressFieldsProps {
  /** Prefix for field names (e.g., "billing" → billing.street) */
  prefix?: string;
  /** Show required asterisks */
  required?: boolean;
  /** Custom street address label */
  streetLabel?: string;
  /** Custom city label */
  cityLabel?: string;
  /** Custom state label */
  stateLabel?: string;
  /** Custom ZIP label */
  zipLabel?: string;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({
  prefix,
  required = false,
  streetLabel = 'Street Address',
  cityLabel = 'City',
  stateLabel = 'State',
  zipLabel = 'ZIP Code',
}) => {
  const getName = (field: string) => {
    return prefix ? `${prefix}.${field}` : field;
  };

  return (
    <div className="space-y-4">
      <FormInput
        name={getName('street')}
        label={streetLabel}
        placeholder="123 Main Street"
        required={required}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name={getName('city')}
          label={cityLabel}
          placeholder="Anytown"
          required={required}
        />
        
        <FormSelect
          name={getName('state')}
          label={stateLabel}
          placeholder="Select state"
          options={US_STATES}
          required={required}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name={getName('zip')}
          label={zipLabel}
          placeholder="12345"
          maxLength={10}
          required={required}
        />
      </div>
    </div>
  );
};

AddressFields.displayName = 'AddressFields';
