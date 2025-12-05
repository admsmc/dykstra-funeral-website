# Form Components Usage Guide

**Date**: December 2025  
**Phase**: 4 - Forms & Validation (Day 2 Complete)

## Overview

This guide documents the form field components built for Phase 4. All components integrate seamlessly with react-hook-form and Zod validation schemas from the domain layer.

## Available Components

### 1. FormInput
General-purpose text input supporting all HTML input types.

**Props**:
- `name` (required): Field name matching schema
- `label`: Label text
- `type`: Input type (text, email, tel, number, password, url, date, etc.)
- `placeholder`: Placeholder text
- `description`: Helper text below input
- `required`: Show red asterisk
- All standard HTML input attributes

**Example**:
```tsx
<FormInput
  name="email"
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  description="We'll never share your email"
  required
/>
```

### 2. FormTextarea
Multi-line text input with character counting and auto-resize.

**Props**:
- `name` (required): Field name
- `label`: Label text
- `maxLength`: Character limit
- `showCharacterCount`: Display current/max count
- `autoResize`: Auto-grow height based on content
- `description`: Helper text
- `required`: Show asterisk

**Example**:
```tsx
<FormTextarea
  name="message"
  label="Your Message"
  placeholder="Tell us what you need..."
  maxLength={2000}
  showCharacterCount
  autoResize
  required
/>
```

### 3. FormSelect
Native HTML select dropdown with options array.

**Props**:
- `name` (required): Field name
- `label`: Label text
- `options` (required): Array of `{ value, label, disabled? }`
- `placeholder`: Placeholder option
- `description`: Helper text
- `required`: Show asterisk

**Example**:
```tsx
<FormSelect
  name="caseType"
  label="Case Type"
  placeholder="Select type..."
  options={[
    { value: 'AT_NEED', label: 'At-Need' },
    { value: 'PRE_NEED', label: 'Pre-Need' },
    { value: 'INQUIRY', label: 'Inquiry' },
  ]}
  required
/>
```

### 4. FormCurrencyInput
Specialized number input with $ prefix for monetary amounts.

**Props**:
- `name` (required): Field name
- `label`: Label text
- `min`: Minimum value (default: 0.01)
- `max`: Maximum value
- `placeholder`: Placeholder (e.g., "0.00")
- `description`: Helper text
- `required`: Show asterisk

**Features**:
- Automatically formats with 2 decimal places (step="0.01")
- Displays $ symbol on left
- Stores value as number for validation

**Example**:
```tsx
<FormCurrencyInput
  name="amount"
  label="Payment Amount"
  placeholder="0.00"
  min={0.01}
  max={999999.99}
  required
/>
```

### 5. FormCheckbox
Boolean checkbox with label on the right.

**Props**:
- `name` (required): Field name
- `label` (required): Label text
- `description`: Helper text below
- `disabled`: Disabled state

**Example**:
```tsx
<FormCheckbox
  name="isPrimaryContact"
  label="Set as primary contact"
  description="This person will receive all notifications"
/>
```

## Complete Form Example

### Contact Form (Before/After)

**Before** (Manual validation, 72 lines):
```tsx
const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
const [errors, setErrors] = useState<Record<string, string>>({});

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  
  const result = contactFormSchema.safeParse(formData);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
    });
    setErrors(fieldErrors);
    return;
  }
  
  // Submit...
};

return (
  <form onSubmit={handleSubmit}>
    <div>
      <label>Name</label>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className={errors.name ? 'border-red-500' : ''}
      />
      {errors.name && <p className="text-red-600">{errors.name}</p>}
    </div>
    {/* Repeat for 3 more fields... */}
  </form>
);
```

**After** (With form components, 28 lines - 61% reduction):
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema } from '@dykstra/domain/validation';
import { Form } from '@/components/form';
import { FormInput, FormTextarea } from '@/components/form-fields';

const form = useForm({
  resolver: zodResolver(contactFormSchema),
  defaultValues: {
    name: '',
    email: '',
    phone: '',
    message: '',
  },
});

const onSubmit = form.handleSubmit((data) => {
  // Data is validated and type-safe here
  console.log(data); // { name: string, email: string, phone: string, message: string }
});

return (
  <Form {...form}>
    <form onSubmit={onSubmit} className="space-y-4">
      <FormInput name="name" label="Name" required />
      <FormInput name="email" label="Email" type="email" required />
      <FormInput name="phone" label="Phone" type="tel" />
      <FormTextarea name="message" label="Message" maxLength={2000} showCharacterCount required />
      <button type="submit">Send Message</button>
    </form>
  </Form>
);
```

## Integration with Domain Validation

All form components work seamlessly with validation schemas from `@dykstra/domain/validation`.

### Manual Payment Form Example

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { manualPaymentSchema } from '@dykstra/domain/validation';
import { Form } from '@/components/form';
import { FormSelect, FormCurrencyInput, FormInput, FormTextarea } from '@/components/form-fields';

function ManualPaymentModal() {
  const form = useForm({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      caseId: '',
      amount: 0,
      method: 'cash',
      checkNumber: '',
      paymentDate: new Date(),
      notes: '',
    },
  });

  const paymentMethod = form.watch('method');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormSelect
          name="caseId"
          label="Case"
          placeholder="Select a case..."
          options={cases.map(c => ({ value: c.id, label: c.decedentName }))}
          required
        />

        <FormSelect
          name="method"
          label="Payment Method"
          options={[
            { value: 'cash', label: 'Cash' },
            { value: 'check', label: 'Check' },
            { value: 'ach', label: 'ACH / Bank Transfer' },
          ]}
          required
        />

        {paymentMethod === 'check' && (
          <FormInput
            name="checkNumber"
            label="Check Number"
            placeholder="e.g., 1234"
          />
        )}

        <FormCurrencyInput
          name="amount"
          label="Amount"
          placeholder="0.00"
          required
        />

        <FormInput
          name="paymentDate"
          label="Payment Date"
          type="date"
          required
        />

        <FormTextarea
          name="notes"
          label="Notes"
          placeholder="Additional notes..."
          maxLength={2000}
          showCharacterCount
        />

        <button type="submit">Record Payment</button>
      </form>
    </Form>
  );
}
```

## Validation Features

### Automatic Error Display
All components automatically show validation errors from Zod schemas:
- Error text appears below field in red
- Input border turns red
- ARIA attributes set for screen readers

### Field-Level Validation
Validation occurs on blur and change:
```tsx
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur', // Validate when user leaves field
});
```

### Dirty State Tracking
Know when form has unsaved changes:
```tsx
const isDirty = form.formState.isDirty;

<button disabled={!isDirty}>Save Changes</button>
```

### Submit Validation
Prevent submission with invalid data:
```tsx
const onSubmit = form.handleSubmit((data) => {
  // This only runs if all validation passes
  console.log(data); // Type-safe, validated data
});
```

## Styling & Customization

### Custom Wrapper Classes
```tsx
<FormInput
  name="email"
  label="Email"
  wrapperClassName="md:col-span-2" // Grid layout
/>
```

### Custom Input Classes
```tsx
<FormInput
  name="email"
  label="Email"
  className="text-lg" // Larger text
/>
```

### Error State Styling
Automatic red border and error message - no custom styling needed.

## Accessibility

All components include:
- Proper label associations (`htmlFor` / `id`)
- ARIA attributes (`aria-invalid`, `aria-describedby`)
- Error announcements for screen readers
- Keyboard navigation support
- Focus management

## Best Practices

### 1. Always Use Schema Validation
```tsx
// ✅ GOOD - Type-safe validation
const form = useForm({
  resolver: zodResolver(contactFormSchema),
});

// ❌ BAD - No validation
const form = useForm();
```

### 2. Set Default Values
```tsx
// ✅ GOOD - Prevents controlled/uncontrolled warnings
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {
    name: '',
    email: '',
  },
});

// ❌ BAD - Missing defaults
const form = useForm({
  resolver: zodResolver(schema),
});
```

### 3. Use Required Prop for Visual Cues
```tsx
// ✅ GOOD - Shows asterisk, but validation comes from schema
<FormInput name="email" label="Email" required />

// Note: The `required` prop is visual only.
// Actual validation is enforced by Zod schema.
```

### 4. Conditional Fields
```tsx
const paymentMethod = form.watch('method');

{paymentMethod === 'check' && (
  <FormInput name="checkNumber" label="Check Number" />
)}
```

## Performance Tips

### 1. Memoize Options Arrays
```tsx
const caseOptions = useMemo(
  () => cases.map(c => ({ value: c.id, label: c.name })),
  [cases]
);

<FormSelect name="caseId" options={caseOptions} />
```

### 2. Use onBlur Mode for Large Forms
```tsx
const form = useForm({
  mode: 'onBlur', // Less frequent validation = better performance
});
```

### 3. Debounce Watch for Expensive Operations
```tsx
import { useDebounce } from '@/hooks/useDebounce';

const searchQuery = form.watch('search');
const debouncedQuery = useDebounce(searchQuery, 300);

// Use debouncedQuery for API calls
```

## Troubleshooting

### "Cannot find module 'react-hook-form'"
Install dependencies:
```bash
pnpm add react-hook-form @hookform/resolvers zod
```

### "Field not registered"
Ensure field name matches schema:
```tsx
// Schema
const schema = z.object({
  email: z.string().email(),
});

// Component - name must match
<FormInput name="email" /> // ✅
<FormInput name="emailAddress" /> // ❌
```

### Validation Not Working
Check zodResolver is configured:
```tsx
const form = useForm({
  resolver: zodResolver(mySchema), // Required!
});
```

## Component File Locations

```
packages/ui/src/components/
├── form.tsx                      # Base form primitives (shadcn/ui)
├── form-fields/
│   ├── FormInput.tsx             # Text/email/tel/number inputs
│   ├── FormTextarea.tsx          # Multi-line text with char count
│   ├── FormSelect.tsx            # Native select dropdown
│   ├── FormCurrencyInput.tsx     # Currency input with $ symbol
│   ├── FormCheckbox.tsx          # Boolean checkbox
│   └── index.ts                  # Barrel export
```

## Next Steps (Day 3)

With form components complete, Day 3 will refactor existing forms:
1. Manual Payment Modal → Use FormCurrencyInput, FormSelect
2. Refund Modal → Use FormCurrencyInput, conditional reasoning
3. New Case Creation → Use FormInput, FormSelect
4. Profile Settings → Use FormInput, FormCheckbox

**Expected results**: 50%+ code reduction per form, consistent UX, zero manual error state management.
