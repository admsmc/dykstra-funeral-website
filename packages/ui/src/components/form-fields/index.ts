/**
 * Form Field Components
 * 
 * Pre-built form fields integrated with react-hook-form and Zod validation.
 * All components automatically handle error states, accessibility, and validation messages.
 * 
 * Usage:
 * ```tsx
 * import { FormInput, FormSelect } from '@/components/form-fields';
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 * import { contactFormSchema } from '@dykstra/domain/validation';
 * 
 * const form = useForm({
 *   resolver: zodResolver(contactFormSchema),
 * });
 * 
 * return (
 *   <Form {...form}>
 *     <FormInput name="name" label="Name" required />
 *     <FormInput name="email" label="Email" type="email" required />
 *     <FormTextarea name="message" label="Message" maxLength={2000} showCharacterCount />
 *   </Form>
 * );
 * ```
 */

export { FormInput, type FormInputProps } from './FormInput';
export { FormTextarea, type FormTextareaProps } from './FormTextarea';
export { FormSelect, type FormSelectProps, type SelectOption } from './FormSelect';
export { FormCurrencyInput, type FormCurrencyInputProps } from './FormCurrencyInput';
export { FormCheckbox, type FormCheckboxProps } from './FormCheckbox';
export { FormDateField, type FormDateFieldProps } from './FormDateField';
export { FormRadioGroup, type FormRadioGroupProps, type RadioOption } from './FormRadioGroup';
export { FormPhoneField, type FormPhoneFieldProps } from './FormPhoneField';

// Composite components
export { AddressFields, type AddressFieldsProps } from './AddressFields';
export { NameFields, type NameFieldsProps } from './NameFields';
