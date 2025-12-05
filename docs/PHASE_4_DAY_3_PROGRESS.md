# Phase 4 Day 3 Progress - Form Refactoring

**Date**: December 3, 2025  
**Status**: In Progress (2/4 forms refactored - 50%)

## Overview

Day 3 involves refactoring existing forms to use the new form component library and domain validation schemas created in Days 1-2. This eliminates manual validation boilerplate and improves consistency.

## Progress Summary

### ✅ Completed Forms (2/4)

#### 1. Manual Payment Modal
- **File**: `src/app/staff/payments/_components/ManualPaymentModal.tsx`
- **Before**: 326 lines with manual validation
- **After**: 229 lines using form components
- **Reduction**: 97 lines (30% code reduction)
- **Components Used**: FormCurrencyInput, FormSelect, FormInput, FormTextarea
- **Validation**: `manualPaymentSchema` from domain layer
- **Key Improvements**:
  - Eliminated 28 lines of manual error mapping code
  - Automatic validation with react-hook-form
  - Consistent error display and ARIA attributes
  - Conditional check number field validation

#### 2. Refund Modal
- **File**: `src/app/staff/payments/_components/RefundModal.tsx`
- **Before**: 322 lines with manual validation
- **After**: 214 lines using form components
- **Reduction**: 108 lines (34% code reduction)
- **Components Used**: FormCurrencyInput, FormSelect, FormInput, FormTextarea
- **Validation**: `createRefundSchemaWithMax(payment.amount)` from domain layer
- **Key Improvements**:
  - Dynamic max amount validation (refund ≤ original payment)
  - Eliminated manual error mapping and state management
  - Preserved conditional "Other" reason field behavior
  - Character counter built into FormTextarea
  - Cleaner form submission with automatic validation

### 🔜 Remaining Forms (2/4)

#### 3. New Case Creation Page
- **File**: `src/app/staff/cases/new/page.tsx`
- **Current**: Manual form with validation boilerplate
- **Plan**: Use `newCaseSchema` from domain layer
- **Components**: FormInput (decedentName), FormSelect (type)
- **Estimated Reduction**: 40-50%

#### 4. Contact Form Page
- **File**: `src/app/contact/page.tsx`
- **Current**: Manual form with validation
- **Plan**: Use `contactFormSchema` from domain layer
- **Components**: FormInput (name, email, phone), FormTextarea (message)
- **Estimated Reduction**: 50-60%

## Refactoring Pattern Established

All refactored forms follow this consistent pattern:

### Before (Manual Validation)
```tsx
const [formData, setFormData] = useState({...});
const [errors, setErrors] = useState({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const result = schema.safeParse(formData);
  if (!result.success) {
    // 20+ lines of error mapping
    const fieldErrors = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0]] = err.message;
      }
    });
    setErrors(fieldErrors);
    return;
  }
  // Submit data
};

// Manual JSX for each field
<input
  value={formData.field}
  onChange={(e) => setFormData({...formData, field: e.target.value})}
  className={errors.field ? "border-red-500" : "border-gray-300"}
/>
{errors.field && <p className="text-red-600">{errors.field}</p>}
```

### After (react-hook-form + Components)
```tsx
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: {...},
});

const onSubmit = form.handleSubmit((data) => {
  mutation.mutate(data); // Data already validated
});

// Form components handle validation display
<Form {...form}>
  <form onSubmit={onSubmit}>
    <FormCurrencyInput name="amount" label="Amount" required />
    <FormSelect name="reason" label="Reason" options={OPTIONS} required />
  </form>
</Form>
```

## Code Quality Metrics

### Lines of Code Reduction
- Manual Payment Modal: 326 → 229 (-97 lines, 30%)
- Refund Modal: 322 → 214 (-108 lines, 34%)
- **Total so far**: 648 → 443 lines (-205 lines, 32% average)
- **Expected Day 3 total**: ~50% reduction across all 4 forms

### Eliminated Boilerplate (per form)
- ❌ Manual useState for form data
- ❌ Manual useState for errors
- ❌ Manual onChange handlers (5-10 per form)
- ❌ Manual error mapping logic (20-30 lines)
- ❌ Manual error display JSX for each field
- ❌ Manual className logic for error states
- ❌ Manual character counting
- ❌ Manual ARIA attribute management

### New Benefits
- ✅ Automatic validation on blur and submit
- ✅ Type-safe form data (TypeScript infers from schema)
- ✅ Consistent error display across all forms
- ✅ Accessible by default (ARIA attributes)
- ✅ Character counters built-in
- ✅ Consistent styling and UX patterns
- ✅ Domain-level validation schemas (reusable, testable)

## Next Steps

1. **Refactor New Case Creation Page**
   - Location: `src/app/staff/cases/new/page.tsx`
   - Use `newCaseSchema` from domain validation
   - Components: FormInput, FormSelect

2. **Refactor Contact Form Page**
   - Location: `src/app/contact/page.tsx`
   - Use `contactFormSchema` from domain validation
   - Components: FormInput, FormTextarea

3. **Verify All Forms Work Correctly**
   - Manual testing of each refactored form
   - Verify validation messages display correctly
   - Ensure conditional fields work (e.g., "Other" reason)

4. **Update Day 3 Complete Document**
   - Final metrics and code quality analysis
   - Before/after screenshots
   - Update implementation plan

## Technical Notes

### Dynamic Validation Pattern
The Refund Modal demonstrates a useful pattern for dynamic validation:

```typescript
// Create schema with dynamic max amount
const schema = createRefundSchemaWithMax(payment.amount);

const form = useForm<RefundForm>({
  resolver: zodResolver(schema),
  defaultValues: { refundAmount: payment.amount },
});
```

This pattern can be reused for other forms with dynamic business rules.

### Conditional Field Pattern
For conditional fields (e.g., "Other" reason):

```typescript
// Watch field value
const reason = form.watch("reason");
const showCustomInput = reason === "Other";

// Render conditional field with same name to override
{showCustomInput && (
  <FormInput name="reason" label="Please specify" />
)}
```

The conditional field uses the same `name` prop to override the selected value.

### Form Component Integration
All form components integrate seamlessly with react-hook-form:

```tsx
<Form {...form}>
  <form onSubmit={onSubmit}>
    <FormCurrencyInput name="amount" label="Amount" required />
    <FormSelect name="type" options={OPTIONS} required />
    <FormTextarea name="notes" maxLength={2000} showCharacterCount />
  </form>
</Form>
```

No additional wiring needed - components automatically:
- Register with react-hook-form
- Display validation errors
- Apply error styling
- Add ARIA attributes
- Handle value updates

## Dependencies

- ✅ Domain validation schemas (Day 1)
- ✅ Form component library (Day 2)
- ✅ react-hook-form (already installed)
- ✅ @hookform/resolvers/zod (already installed)
- ✅ zod (already installed)

## Related Documentation

- [Phase 4 Day 1 Complete](./PHASE_4_DAY_1_COMPLETE.md) - Validation schemas
- [Phase 4 Day 2 Complete](./PHASE_4_DAY_2_COMPLETE.md) - Form components
- [Form Components Guide](../packages/ui/FORM_COMPONENTS_GUIDE.md) - Component API reference
- [Phase 4 Audit](./PHASE_4_FORMS_VALIDATION_AUDIT.md) - Complete implementation plan
