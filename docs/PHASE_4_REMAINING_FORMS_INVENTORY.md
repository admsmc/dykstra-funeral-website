# Phase 4 Remaining Forms Inventory

**Date**: December 3, 2025

## Summary

After analyzing the codebase, **5 additional forms** were identified that use manual validation patterns and can benefit from the react-hook-form + domain validation refactoring.

## Completed Forms (Day 3) ✅

1. Manual Payment Modal - `src/app/staff/payments/_components/ManualPaymentModal.tsx`
2. Refund Modal - `src/app/staff/payments/_components/RefundModal.tsx`
3. New Case Creation - `src/app/staff/cases/new/page.tsx`
4. Contact Form - `src/app/contact/page.tsx`

## Remaining Forms to Refactor (5)

### 1. Template Customization Form ⏳
**File**: `src/app/customize-template/page.tsx`  
**Lines**: 355+ (multi-step form)  
**Complexity**: High  
**Fields**: 12+ fields across 3 steps
- Basic Info: deceasedName, photoUrl, birthDate, deathDate
- Obituary: obituary text (long text)
- Service Details: serviceDate, serviceLocation
- Order of Service: Dynamic array of items
- Pallbearers: 6-item array
- Funeral Home Info: name, address, phone

**Validation Needed**:
- Required fields: deceasedName, birthDate, deathDate
- Optional: photoUrl (URL validation), obituary, serviceLocation
- Array validation for orderOfService and pallbearers

**Estimated Reduction**: 30-40% (complex multi-step form)

---

### 2. Portal Payment Form ⏳
**File**: `src/app/portal/payments/new/page.tsx`  
**Lines**: 200+  
**Complexity**: Medium  
**Fields**: 2-3 fields
- amount: Currency input (required, positive number)
- notes: Textarea (optional, max length)
- Stripe integration placeholder

**Validation Needed**:
- Currency validation (amount > 0)
- Optional notes (max 2000 chars)

**Estimated Reduction**: 40-50%

---

### 3. Contract Template Form ⏳
**File**: `src/app/staff/contracts/templates/page.tsx` (TemplateForm component)  
**Lines**: 425+ (nested component)  
**Complexity**: High  
**Fields**: 6 fields + dynamic variables array
- name: Text input (required)
- description: Textarea (optional)
- serviceType: Select dropdown
- content: Large textarea (contract body)
- variables: Dynamic array of strings
- isDefault: Checkbox

**Validation Needed**:
- Required: name, content
- Optional: description, serviceType
- Variable name validation (no duplicates, alphanumeric)

**Estimated Reduction**: 30-40%

---

### 4. Memorial Tribute/Guestbook Forms ⏳
**File**: `src/app/portal/memorials/[id]/page.tsx`  
**Lines**: 215+  
**Complexity**: Medium  
**Forms**: 2 separate forms on same page
  
**Tribute Form**:
- name: Text input (required)
- email: Email input (required)
- message: Textarea (required, max length)

**Guestbook Form**:
- name: Text input (required)
- email: Email input (required)
- message: Textarea (required, max length)
- city: Text input (optional)
- state: Select dropdown (US states, optional)

**Validation Needed**:
- Email validation
- Message max length validation (2000 chars)
- State dropdown validation

**Estimated Reduction**: 40-50%

---

### 5. Family Invitation Form ⏳
**File**: `src/features/case-detail/components/index.tsx` (InvitationForm component)  
**Lines**: 780+ (nested component at lines 661-780)  
**Complexity**: Medium  
**Fields**: 5 fields
- name: Text input (required)
- email: Email input (required)
- phone: Tel input (optional, format validation)
- relationship: Text input (optional)
- role: Select dropdown (PRIMARY_CONTACT or FAMILY_MEMBER)

**Validation Needed**:
- Required: name, email
- Email format validation
- Phone format validation (optional): (XXX) XXX-XXXX
- Relationship optional text

**Estimated Reduction**: 30-40%

---

## Priority Order for Refactoring

### Priority 1 (Simple, High Impact)
1. **Portal Payment Form** - Simple 2-field form, high visibility
2. **Family Invitation Form** - Standard form pattern, used frequently

### Priority 2 (Medium Complexity)
3. **Memorial Tribute/Guestbook Forms** - 2 similar forms, family-facing

### Priority 3 (Complex, Lower Priority)
4. **Contract Template Form** - Complex with dynamic variables
5. **Template Customization Form** - Multi-step with arrays

---

## Validation Schemas Needed

### New Schemas to Create

#### 1. Template Customization Schema
```typescript
// packages/domain/src/validation/template-schemas.ts

export const templateCustomizationSchema = z.object({
  deceasedName: decedentNameSchema,
  birthDate: z.string().min(1, "Birth date is required"),
  deathDate: z.string().min(1, "Death date is required"),
  photoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  obituary: optionalLongTextSchema,
  serviceDate: z.string().optional().or(z.literal('')),
  serviceLocation: z.string().max(200).optional().or(z.literal('')),
  orderOfService: z.array(z.object({
    item: z.string(),
    officiant: z.string(),
  })),
  pallbearers: z.array(z.string()),
  funeralHomeName: z.string().min(1),
  funeralHomeAddress: z.string().min(1),
  funeralHomePhone: phoneSchema,
});
```

#### 2. Portal Payment Schema
```typescript
// packages/domain/src/validation/payment-schemas.ts (add to existing)

export const portalPaymentSchema = z.object({
  amount: currencySchema,
  notes: optionalLongTextSchema,
});
```

#### 3. Contract Template Schema
```typescript
// packages/domain/src/validation/contract-schemas.ts (new file)

export const contractTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: optionalLongTextSchema,
  serviceType: z.enum([
    'TRADITIONAL_BURIAL',
    'TRADITIONAL_CREMATION',
    'MEMORIAL_SERVICE',
    'DIRECT_BURIAL',
    'DIRECT_CREMATION',
    'CELEBRATION_OF_LIFE',
  ]).optional().or(z.literal('')),
  content: z.string().min(1, "Content is required"),
  variables: z.array(z.string()),
  isDefault: z.boolean().default(false),
});
```

#### 4. Memorial Forms Schemas
```typescript
// packages/domain/src/validation/memorial-schemas.ts (new file)

export const tributeSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: z.string()
    .min(1, "Message is required")
    .max(2000, "Message must be less than 2000 characters"),
});

export const guestbookSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  message: z.string()
    .min(1, "Message is required")
    .max(2000, "Message must be less than 2000 characters"),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().length(2).optional().or(z.literal('')),
});
```

#### 5. Family Invitation Schema
```typescript
// packages/domain/src/validation/family-schemas.ts (new file)

export const familyInvitationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  relationship: z.string().max(100).optional().or(z.literal('')),
  role: z.enum(['PRIMARY_CONTACT', 'FAMILY_MEMBER']),
});
```

---

## Estimated Impact

### Code Reduction
| Form | Before | Estimated After | Reduction | % |
|------|--------|----------------|-----------|---|
| Portal Payment | 200 | 120 | -80 | 40% |
| Family Invitation | 120 | 80 | -40 | 33% |
| Memorial Forms | 200 | 120 | -80 | 40% |
| Contract Template | 200 | 140 | -60 | 30% |
| Template Customization | 355 | 250 | -105 | 30% |
| **Total** | **1075** | **710** | **-365** | **34%** |

Combined with Day 3 forms:
- **Day 3**: 960 → 636 (-324, 33.8%)
- **Remaining**: 1075 → 710 (-365, 34%)
- **Grand Total**: 2035 → 1346 lines (**-689 lines, 33.9% reduction**)

---

## Implementation Plan

### Day 3 Extended (4-6 hours)

**Session 1: Priority 1 Forms (2 hours)**
1. Portal Payment Form (1 hour)
2. Family Invitation Form (1 hour)

**Session 2: Priority 2 Forms (2 hours)**
3. Memorial Tribute/Guestbook Forms (2 hours)

**Session 3: Priority 3 Forms (2-3 hours)**
4. Contract Template Form (1-1.5 hours)
5. Template Customization Form (1-1.5 hours)

---

## Dependencies

All form components from Day 2 are already available:
- ✅ FormInput
- ✅ FormTextarea
- ✅ FormSelect
- ✅ FormCurrencyInput
- ✅ FormCheckbox

New component needed:
- ❓ **FormArray** - For dynamic arrays (order of service, pallbearers, variables)
  - Could be added if complex forms require it
  - Alternative: Manual array handling with form.watch() + setValue()

---

## Success Criteria

For each form refactored:
- ✅ 100% feature parity maintained
- ✅ Zero breaking changes
- ✅ All validation moved to domain layer
- ✅ Manual state management eliminated
- ✅ Code reduction of 30-50%
- ✅ Consistent error display
- ✅ Type-safe validation

---

## Next Steps

1. Create new validation schemas in domain package
2. Refactor forms in priority order
3. Test each form for feature parity
4. Update documentation with final metrics
5. Update Phase 4 implementation plan

---

## Notes

- **Actual count**: 5 forms remaining (not 15 as originally estimated)
- **Total forms in project**: 9 forms total (4 complete + 5 remaining)
- **Expected total impact**: ~700 lines removed across all forms
- **Timeline**: Can complete all 5 forms in 4-6 hours
