# Phase 4: Forms & Validation - Audit & Implementation Plan

**Date**: December 2025  
**Status**: In Progress  
**Phase Duration**: 2 weeks (10 working days)

## Executive Summary

This audit identifies all forms in the application, evaluates current validation patterns, and proposes a unified approach using react-hook-form + Zod for type-safe, domain-driven validation.

### Current State
- **15+ forms** across the application (pages, modals, embedded forms)
- **Mixed validation approaches**: Manual state + Zod, HTML5 validation, no validation
- **Inconsistent error handling**: Different patterns per form
- **No domain-level validation reuse**: Business rules duplicated across forms

### Target State
- **Unified validation system**: react-hook-form + Zod schemas
- **Domain-driven schemas**: Validation rules match domain layer constraints
- **Reusable form components**: Consistent field library
- **50%+ reduction in form bugs**: Type-safe, tested validation

## Form Inventory

### Category 1: Full-Page Forms (3 forms)

#### 1. Contact Form (`src/app/contact/page.tsx`)
- **Fields**: name, email, phone, message
- **Current validation**: HTML5 `required` attribute only
- **Issues**:
  - No email format validation beyond browser default
  - No phone number formatting
  - No message length limit
  - No error state styling
- **Complexity**: Low
- **Priority**: Medium

#### 2. Profile Settings (`src/app/portal/profile/page.tsx`)
- **Fields**: name, phone, email (read-only), notification preferences (6 checkboxes)
- **Current validation**: No validation (relies on backend)
- **Issues**:
  - No client-side validation
  - Manual form state management (useState)
  - Uses custom `useFormDraft` hook
  - Inconsistent change detection
- **Complexity**: Medium
- **Priority**: High (production feature)

#### 3. New Case Creation (`src/app/staff/cases/new/page.tsx`)
- **Fields**: decedentName, type (select)
- **Current validation**: Manual validation with `errors` state
- **Issues**:
  - Basic validation only (empty string check)
  - No field-level feedback
  - Manual error state management
- **Complexity**: Low
- **Priority**: High (staff workflow)

### Category 2: Modal Forms (2+ forms)

#### 4. Manual Payment Modal (`src/app/staff/payments/_components/ManualPaymentModal.tsx`)
- **Fields**: caseId (select), method (select), checkNumber (conditional), amount, paymentDate, notes
- **Current validation**: ✅ **Zod schema** (best practice example)
- **Schema**: `manualPaymentSchema` with proper types
- **Strengths**:
  - Type-safe with `z.infer`
  - Field-level error mapping
  - Conditional validation (checkNumber for checks only)
  - Max length validation (notes: 2000 chars)
- **Issues**:
  - Manual `safeParse()` and error mapping (not using react-hook-form)
  - Manual state management
- **Complexity**: Medium
- **Priority**: High (refactor to react-hook-form pattern)

#### 5. Refund Modal (`src/app/staff/payments/_components/RefundModal.tsx`)
- **Fields**: refundAmount, reason (select/custom), notes
- **Current validation**: ✅ **Zod schema** (best practice example)
- **Schema**: `refundSchema` with proper types
- **Strengths**:
  - Type-safe validation
  - Custom validation (amount <= original payment)
  - Conditional reason field (custom input if "Other")
  - Character count display
- **Issues**:
  - Manual `safeParse()` pattern
  - Not using react-hook-form
- **Complexity**: Medium
- **Priority**: High (refactor to react-hook-form pattern)

### Category 3: Embedded Forms (10+ estimated)

These require deeper investigation across the codebase:

#### 6. Memorial Page Forms (`src/app/portal/memorials/[id]/page.tsx`)
- **Lines**: 414, 489 (grep matches)
- **Investigation needed**: Likely photo upload, condolence forms

#### 7. Contract Template Forms (`src/app/staff/contracts/templates/page.tsx`)
- **Line**: 418 (grep match)
- **Investigation needed**: Template configuration forms

#### 8. Contract Builder (`src/app/staff/contracts/builder/page.tsx`)
- **Investigation needed**: Multi-step service arrangement builder

#### 9. Template Editor (`src/app/customize-template/page.tsx`)
- **Line**: 254 (grep match)
- **Investigation needed**: GrapesJS integration forms

#### 10-15. Additional Forms (TBD)
- Family member invitation forms
- Document upload forms
- Task creation/editing forms
- Time entry forms (payroll)
- Inventory adjustment forms

## Current Validation Patterns Analysis

### Pattern A: HTML5 Validation Only ❌
**Example**: Contact form
```tsx
<input type="email" required />
```
**Problems**:
- Browser-dependent validation messages
- No custom error styling
- Can't enforce domain rules (e.g., phone format, name length)
- No TypeScript type safety

### Pattern B: Manual State + Zod ⚠️
**Example**: Manual Payment Modal, Refund Modal
```tsx
const [formData, setFormData] = useState<ManualPaymentForm>({...});
const [errors, setErrors] = useState<Partial<Record<keyof ManualPaymentForm, string>>>({});

const handleSubmit = async (e: React.FormEvent) => {
  const result = manualPaymentSchema.safeParse(formData);
  if (!result.success) {
    const fieldErrors: Partial<Record<keyof ManualPaymentForm, string>> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as keyof ManualPaymentForm] = err.message;
      }
    });
    setErrors(fieldErrors);
    return;
  }
  // Submit...
};
```
**Strengths**:
- Type-safe validation with Zod
- Domain-driven schemas
- Custom error messages

**Problems**:
- **Boilerplate**: 20+ lines of error mapping code per form
- **No field-level validation**: Validates on submit only
- **Manual error state**: Easy to forget clearing errors
- **No dirty state tracking**: Can't disable submit if unchanged

### Pattern C: No Validation ❌
**Example**: Profile Settings
```tsx
const [name, setName] = useState("");
const handleSave = async () => {
  await updateProfileMutation.mutateAsync({ name });
};
```
**Problems**:
- Backend validates only (poor UX)
- No client-side feedback
- Error messages come from server (inconsistent)

### Pattern D: react-hook-form + Zod (Target Pattern) ✅
**Not currently used, but available**

The codebase already has react-hook-form installed:
- `packages/ui/src/components/form.tsx` (shadcn/ui Form components)
- `package.json` includes `react-hook-form`

**Target pattern**:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const manualPaymentSchema = z.object({
  caseId: z.string().min(1, "Please select a case"),
  amount: z.number().positive("Amount must be greater than zero"),
  method: z.enum(["cash", "check", "ach"]),
});

type ManualPaymentForm = z.infer<typeof manualPaymentSchema>;

function ManualPaymentModal() {
  const form = useForm<ManualPaymentForm>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      caseId: "",
      amount: 0,
      method: "cash",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    // Type-safe data, validated
    recordPaymentMutation.mutate(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="caseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Case</FormLabel>
              <FormControl>
                <select {...field}>...</select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Other fields... */}
      </form>
    </Form>
  );
}
```

**Benefits**:
- ✅ Zero boilerplate (react-hook-form handles error mapping)
- ✅ Field-level validation (validates on blur/change)
- ✅ Dirty state tracking (`formState.isDirty`)
- ✅ Built-in touched/error states
- ✅ Async validation support
- ✅ TypeScript type safety

## Domain Validation Analysis

### Domain Layer Constraints (from ARCHITECTURE.md)

We need to ensure form validation matches domain rules:

#### Example: Payment Amount Validation
**Domain Rule** (from Use Case 6.2 - Batch Payment Application):
```typescript
// Validation: Amount between $0.01 and $999,999.99
if (amount <= 0 || amount > 999999.99) {
  throw new ValidationError('Payment amount must be between $0.01 and $999,999.99');
}
```

**Current Form Validation** (Manual Payment Modal):
```typescript
amount: z.number().positive("Amount must be greater than zero")
// ❌ Missing: Upper bound validation
```

**Fix**:
```typescript
amount: z.number()
  .positive("Amount must be greater than zero")
  .max(999999.99, "Amount cannot exceed $999,999.99")
```

#### Example: Phone Number Validation
**Domain Rule** (likely exists in domain layer but not enforced):
```typescript
// US phone format: (555) 123-4567 or 555-123-4567
const PHONE_REGEX = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
```

**Current Form Validation** (Contact, Profile):
```tsx
<input type="tel" />  // ❌ No validation
```

**Fix**:
```typescript
phone: z.string()
  .regex(/^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, 
    "Phone must be in format (555) 123-4567")
  .optional()
```

### Validation Schema Organization

**Proposed structure**:
```
packages/
├── domain/
│   └── src/
│       └── validation/
│           ├── index.ts                    # Re-export all schemas
│           ├── payment-schemas.ts          # Payment-related validation
│           ├── case-schemas.ts             # Case/decedent validation
│           ├── contact-schemas.ts          # Contact info validation
│           └── shared-schemas.ts           # Common fields (email, phone, etc.)
```

**Benefits**:
- ✅ Single source of truth for validation rules
- ✅ Reusable across forms and domain layer
- ✅ Testable in isolation
- ✅ Matches Clean Architecture (domain layer owns rules)

## Implementation Plan

### Phase 4A: Foundation (Days 1-2)

**Day 1: Schema Migration**
- [ ] Create `packages/domain/src/validation/` directory
- [ ] Extract existing Zod schemas from modals:
  - `manualPaymentSchema` → `payment-schemas.ts`
  - `refundSchema` → `payment-schemas.ts`
- [ ] Create shared validation helpers:
  - `emailSchema` (email format validation)
  - `phoneSchema` (US phone format)
  - `currencySchema` (amount validation with bounds)
  - `nameSchema` (min/max length, allowed characters)
- [ ] Write unit tests for all schemas (Vitest)

**Day 2: Form Component Library**
- [ ] Audit `packages/ui/src/components/form.tsx` (already exists)
- [ ] Create field-specific components:
  - `FormInput` (text, email, tel, number)
  - `FormSelect` (dropdown)
  - `FormTextarea` (multi-line text)
  - `FormCheckbox` (single checkbox)
  - `FormDatePicker` (date selection)
  - `FormCurrencyInput` (formatted currency)
- [ ] Document usage patterns in Storybook

### Phase 4B: High-Priority Forms (Days 3-6)

**Day 3: Manual Payment Modal**
- [ ] Refactor to react-hook-form
- [ ] Use domain validation schemas
- [ ] Remove manual error state management
- [ ] Add field-level validation (on blur)
- [ ] Test: Validate all 7 fields work correctly

**Day 4: Refund Modal**
- [ ] Refactor to react-hook-form
- [ ] Use domain validation schemas
- [ ] Implement custom validation (amount <= original)
- [ ] Test: Validate conditional reason field

**Day 5: New Case Creation**
- [ ] Refactor to react-hook-form
- [ ] Create `caseSchema` in domain layer
- [ ] Add decedent name validation (min/max length)
- [ ] Test: Validate optimistic update works with form

**Day 6: Profile Settings**
- [ ] Refactor to react-hook-form
- [ ] Create `profileSchema` in domain layer
- [ ] Integrate with `useFormDraft` hook (preserve auto-save)
- [ ] Add notification preference validation
- [ ] Test: Validate unsaved changes warning

### Phase 4C: Medium-Priority Forms (Days 7-8)

**Day 7: Contact Form**
- [ ] Refactor to react-hook-form
- [ ] Use shared validation schemas (email, phone, name)
- [ ] Add message length validation (max 2000 chars)
- [ ] Add character count display
- [ ] Test: Validate form submission

**Day 8: Embedded Forms Audit**
- [ ] Identify all remaining forms (memorial, contracts, builder)
- [ ] Categorize by priority and complexity
- [ ] Create backlog for Phase 4D

### Phase 4D: Refactor Remaining Forms (Days 9-10)

**Day 9: Contract Builder Forms**
- [ ] Investigate multi-step form state
- [ ] Refactor to react-hook-form + useForm per step
- [ ] Create contract validation schemas
- [ ] Test: Validate wizard navigation

**Day 10: Final Forms + Testing**
- [ ] Refactor any remaining critical forms
- [ ] Write integration tests for all refactored forms
- [ ] Document validation patterns in ADR
- [ ] Update README with form development guidelines

## Success Metrics

### Quantitative Goals
- ✅ **100% forms using react-hook-form + Zod**
- ✅ **Zero manual error state management**
- ✅ **50%+ reduction in validation code** (remove boilerplate)
- ✅ **90%+ test coverage** for validation schemas
- ✅ **Zero TypeScript errors** in form components

### Qualitative Goals
- ✅ Consistent error message patterns across all forms
- ✅ Field-level validation feedback (no submit-only validation)
- ✅ Domain validation rules match business layer constraints
- ✅ Developer experience: Easy to add new forms with established patterns

## Risk Assessment

### Risk 1: Breaking Existing Forms ⚠️ High
**Mitigation**:
- Feature flag each refactored form
- A/B test in production
- Comprehensive manual testing before deployment

### Risk 2: Integration with Custom Hooks 🟡 Medium
**Example**: Profile form uses `useFormDraft` for auto-save
**Mitigation**:
- Research react-hook-form + custom hook integration patterns
- Use `form.watch()` to trigger draft saves
- Test auto-save behavior extensively

### Risk 3: Modal Form State Management 🟡 Medium
**Issue**: Modals reset on close - need to preserve form state
**Mitigation**:
- Use `form.reset()` in close handler
- Test modal open/close cycles

### Risk 4: Performance Impact 🟢 Low
**Concern**: react-hook-form re-renders
**Mitigation**:
- Use `mode: "onBlur"` to reduce validation triggers
- Leverage react-hook-form's built-in optimization

## Validation Examples (Before/After)

### Example 1: Manual Payment Modal

**Before** (72 lines of form logic):
```tsx
const [formData, setFormData] = useState<ManualPaymentForm>({...});
const [errors, setErrors] = useState<Partial<Record<keyof ManualPaymentForm, string>>>({});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setErrors({});
  
  const result = manualPaymentSchema.safeParse(formData);
  if (!result.success) {
    const fieldErrors: Partial<Record<keyof ManualPaymentForm, string>> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as keyof ManualPaymentForm] = err.message;
      }
    });
    setErrors(fieldErrors);
    return;
  }
  
  recordPaymentMutation.mutate(result.data);
};

return (
  <form onSubmit={handleSubmit}>
    <div>
      <label>Case</label>
      <select
        value={formData.caseId}
        onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
        className={errors.caseId ? "border-red-500" : "border-gray-300"}
      >
        <option value="">Select...</option>
      </select>
      {errors.caseId && <p className="text-red-600">{errors.caseId}</p>}
    </div>
    {/* 6 more fields with same pattern... */}
  </form>
);
```

**After** (28 lines of form logic, 61% reduction):
```tsx
const form = useForm<ManualPaymentForm>({
  resolver: zodResolver(manualPaymentSchema),
  defaultValues: { caseId: "", amount: 0, method: "cash" },
});

const onSubmit = form.handleSubmit((data) => {
  recordPaymentMutation.mutate(data);
});

return (
  <Form {...form}>
    <form onSubmit={onSubmit}>
      <FormField
        control={form.control}
        name="caseId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Case</FormLabel>
            <FormControl>
              <select {...field}>
                <option value="">Select...</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* 6 more fields with same pattern... */}
    </form>
  </Form>
);
```

**Benefits**:
- ✅ 61% code reduction (72 → 28 lines)
- ✅ Zero manual error state
- ✅ Automatic field-level validation
- ✅ Dirty state tracking (`form.formState.isDirty`)

### Example 2: Contact Form

**Before** (No validation, 4 uncontrolled inputs):
```tsx
<form onSubmit={handleSubmit}>
  <input type="text" required />
  <input type="email" required />
  <input type="tel" />
  <textarea required />
  <button type="submit">Send</button>
</form>
```

**After** (Domain-validated, type-safe):
```tsx
const form = useForm<ContactForm>({
  resolver: zodResolver(contactSchema),
});

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <FormInput {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Email, phone, message fields with proper validation */}
    </form>
  </Form>
);
```

## Next Steps

1. **Approve Implementation Plan** - Review this audit and approve Day 1-2 foundation work
2. **Create Validation Schemas** - Start with `shared-schemas.ts` (email, phone, currency)
3. **Build Form Components** - Extend `packages/ui/src/components/form.tsx`
4. **Refactor High-Priority Forms** - Manual Payment, Refund, New Case, Profile
5. **Document Patterns** - Create ADR 004: Form Validation Strategy

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Clean Architecture guidelines
- [ADR 001: ViewModel Pattern](./architecture/decisions/001-viewmodel-pattern.md)
- [react-hook-form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui Form Components](https://ui.shadcn.com/docs/components/form)
