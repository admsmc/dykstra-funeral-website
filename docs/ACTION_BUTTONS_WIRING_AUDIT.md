# Action Buttons Wiring Audit

**Date**: December 5, 2025  
**Status**: 🟡 **PARTIAL - Many Buttons Need Wiring**

## Executive Summary

Audit of all action buttons across the staff portal reveals that **payment-related buttons are fixed**, but many other "Create/New" buttons exist without modal implementations or workflows.

## Button Status Categories

- ✅ **WORKING** - Has modal/workflow and backend wiring
- 🟡 **NAVIGATION ONLY** - Button exists, navigates to page, but no modal/form
- ❌ **NOT WIRED** - Button exists but does nothing (no onClick handler)
- 🔵 **PLANNED** - Listed in command palette but not implemented yet

## Detailed Audit Results

### Operations

#### Case Management
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **New Case** | `/staff/dashboard`, Command Palette | ✅ WORKING | Has dedicated `/staff/cases/new` page with full form |
| **New Contract** | Command Palette | 🟡 NAVIGATION ONLY | Routes to `/staff/contracts/new` (page may not exist) |

### Finance

#### Payments
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Record Payment** | `/staff/payments` | ✅ WORKING | **FIXED** - Has ManualPaymentModal, fully wired |
| **Process Refund** | `/staff/payments/[id]` | ✅ WORKING | Has RefundModal, uses same policy |
| **Create Payment Plan** | `/staff/payments` (Plans tab) | ✅ WORKING | Has form in PaymentPlanTab |
| **Apply Batch Payment** | `/staff/payments` (Bulk actions) | ✅ WORKING | Has BulkPaymentActions component |

#### Accounts Payable
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Pay Vendor Bill** | `/staff/finops/ap` | ✅ WORKING | Backend wired, may need modal |
| **Record Insurance Claim** | `/staff/finops/ar` | 🟡 NAVIGATION ONLY | Backend exists, needs frontend modal |

### HR & Payroll

#### Employee Management
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Add Employee** | `/staff/hr` (line 131-134) | ❌ NOT WIRED | Button exists, **no onClick handler** |
| **Onboard Employee** | HR workflows | 🔵 PLANNED | Backend exists (GoEmployeeOnboarding), no UI |
| **Offboard Employee** | HR workflows | 🔵 PLANNED | Backend exists (GoEmployeeTermination), no UI |

#### Scheduling
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Assign Shift** | `/staff/scheduling` | 🟡 NAVIGATION ONLY | Has scheduling page, needs modal |
| **Request Shift Swap** | Employee view | 🔵 PLANNED | Use case exists, no UI |
| **Assign On-Call** | Director rotation | 🔵 PLANNED | Use case exists, no UI |

#### Time & Payroll
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Submit Timesheet** | `/staff/payroll/time` | 🟡 NAVIGATION ONLY | Page exists, needs submission modal |
| **Approve Timesheet** | Manager view | 🟡 NAVIGATION ONLY | Needs approval workflow |
| **Run Payroll** | `/staff/payroll` | 🔵 PLANNED | Use case exists, needs UI |

### CRM & Sales

#### Lead Management
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **New Lead** | `/staff/leads` (line 124-127) | ❌ NOT WIRED | Button exists, **no onClick handler** |
| **Convert to Case** | Lead card | 🔵 PLANNED | Use case exists (`convertLeadToCase`), no UI |
| **Qualify Lead** | Lead pipeline | 🔵 PLANNED | Backend exists, needs modal |

#### Contact Management
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **New Contact** | `/staff/contacts` | 🟡 NAVIGATION ONLY | Has ContactProfileHeader with inline edit |
| **Merge Contacts** | Contact details | ✅ WORKING | Has MergeContactsModal component |
| **Add Family Member** | Contact view | 🔵 PLANNED | Repository exists, needs UI |

### Procurement & Inventory

#### Purchase Orders
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **New Purchase Order** | `/staff/procurement` | 🟡 NAVIGATION ONLY | Page exists, needs creation modal |
| **Approve PO** | PO details | 🔵 PLANNED | Backend exists (GoApprovalWorkflow), no UI |
| **Receive Items** | PO details | 🔵 PLANNED | Use case exists, needs modal |

#### Inventory
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Add Inventory** | `/staff/inventory` | 🟡 NAVIGATION ONLY | Page exists, needs add modal |
| **Transfer Inventory** | Command Palette | 🟡 NAVIGATION ONLY | Routes with `?action=transfer`, needs modal |
| **Adjust Inventory** | Inventory item | 🔵 PLANNED | Use case exists, needs UI |
| **Reorder Items** | Low stock view | 🔵 PLANNED | Could trigger PO creation |

#### Suppliers
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Add Supplier** | Command Palette | 🟡 NAVIGATION ONLY | Routes with `?action=new`, needs modal |
| **Rate Supplier** | Supplier view | 🔵 PLANNED | Feature exists in suppliers page |

### Communication

#### Email & SMS
| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Compose Email** | Command Palette, `/staff/communication` | 🟡 NAVIGATION ONLY | Routes with `?action=compose`, needs modal |
| **Compose SMS** | Command Palette | 🟡 NAVIGATION ONLY | Routes with `?action=compose&type=sms`, needs modal |
| **Create Template** | `/staff/communication/templates` | 🔵 PLANNED | Page exists, needs creation modal |

### Tasks & Collaboration

| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Create Task** | `/staff/tasks`, Command Palette | 🟡 NAVIGATION ONLY | Routes with `?action=new`, needs modal |
| **Assign Task** | Task details | 🔵 PLANNED | Backend exists, needs UI |
| **Mark Complete** | Task card | 🟡 NAVIGATION ONLY | Needs quick action |

### Family Portal

| Button | Location | Status | Notes |
|--------|----------|--------|-------|
| **Invite Family** | `/staff/families`, Command Palette | 🟡 NAVIGATION ONLY | Routes with `?action=invite`, needs modal |
| **Resend Invitation** | Invitation list | 🟡 NAVIGATION ONLY | Use case exists, needs UI |
| **Revoke Invitation** | Invitation list | 🟡 NAVIGATION ONLY | Use case exists, needs UI |

## Priority Classification

### 🔥 CRITICAL (Blocks Core Workflows)
1. **New Lead Modal** - Lead creation is core CRM functionality
2. **Add Employee Modal** - HR onboarding workflow
3. **Compose Email/SMS Modal** - Family communication
4. **Create Task Modal** - Task management
5. **New PO Modal** - Procurement workflow

### 🟡 HIGH (Important but Workarounds Exist)
6. **Transfer Inventory Modal** - Multi-location operations
7. **Add Supplier Modal** - Vendor management
8. **Approve Timesheet Workflow** - Payroll processing
9. **Convert Lead to Case** - Sales pipeline
10. **Invite Family Modal** - Portal access

### 🟢 MEDIUM (Nice to Have)
11. **Run Payroll Workflow** - Can use manual process
12. **Approve PO Workflow** - Can approve offline
13. **Shift Swap Request** - Can use manual scheduling
14. **Create Email Template** - Can compose manually
15. **Onboard/Offboard Employee** - Can use manual HR process

### ⚪ LOW (Future Enhancements)
16. Qualify Lead workflow
17. Rate Supplier
18. Adjust Inventory (manual entry exists)
19. Reorder automation
20. Task assignment

## Implementation Pattern

All modals should follow the **established pattern** from ManualPaymentModal:

### 1. Modal Component Structure
```typescript
// File: src/app/staff/[module]/_components/[Action]Modal.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trpc } from '@/lib/trpc-client';
import { [schema]Schema, type [Schema]Form } from '@dykstra/domain/validation';
import { Form, SuccessCelebration } from '@dykstra/ui';
import { useToast } from '@/components/toast';

export default function [Action]Modal({ isOpen, onClose, onSuccess }) {
  const form = useForm<[Schema]Form>({
    resolver: zodResolver([schema]Schema),
    defaultValues: { /* ... */ },
  });
  
  const mutation = trpc.[module].[action].useMutation();
  
  // ... form submission logic
  
  return (
    <>
      <div className="fixed inset-0 z-50">
        {/* Modal content */}
      </div>
      <SuccessCelebration show={showCelebration} /* ... */ />
    </>
  );
}
```

### 2. Parent Page Integration
```typescript
// Add state
const [isModalOpen, setIsModalOpen] = useState(false);

// Add button
<button onClick={() => setIsModalOpen(true)}>
  <Plus /> New [Entity]
</button>

// Add modal
<[Action]Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSuccess={() => {
    refetch();
    setIsModalOpen(false);
  }}
/>
```

### 3. Validation Schema
```typescript
// File: packages/domain/src/validation/[module]-schemas.ts
export const [action]Schema = z.object({
  // ... field validations
});

export type [Action]Form = z.infer<typeof [action]Schema>;
```

### 4. tRPC Router Endpoint
```typescript
// File: packages/api/src/routers/[module].router.ts
[action]: staffProcedure
  .input([schema])
  .mutation(async ({ input, ctx }) => {
    return await runEffect([useCase](input));
  }),
```

### 5. Use Case (if missing)
```typescript
// File: packages/application/src/use-cases/[module]/[action].ts
export const [action] = (command: [Action]Command): Effect.Effect<Result, Error, Dependencies> =>
  Effect.gen(function* () {
    // ... business logic
  });
```

## Estimated Implementation Time

### Per Modal (Average)
- **Validation Schema**: 15 min
- **Modal Component**: 30 min
- **Parent Integration**: 15 min
- **Testing**: 15 min
- **Total per modal**: ~75 minutes (1.25 hours)

### Priority Group Estimates
- **CRITICAL (5 modals)**: 6-7 hours
- **HIGH (5 modals)**: 6-7 hours  
- **MEDIUM (5 modals)**: 6-7 hours
- **Total for 15 priority modals**: 18-21 hours (3 sprints)

## Recommendations

### Immediate (This Sprint)
1. **Create Lead Modal** - Unblock CRM pipeline
2. **Add Employee Modal** - Unblock HR workflows
3. **Compose Email/SMS Modals** - Unblock family communication

### Next Sprint
4. **Create Task Modal** - Improve task management
5. **New PO Modal** - Unblock procurement
6. **Transfer Inventory Modal** - Multi-location operations

### Following Sprint
7. **Add Supplier Modal** - Vendor management
8. **Approve Timesheet** - Payroll approval
9. **Convert Lead to Case** - Sales conversion
10. **Invite Family Modal** - Portal access

## Testing Checklist

For each modal implementation:
- [ ] Modal opens on button click
- [ ] Form validation works (Zod schema)
- [ ] Submission calls correct tRPC endpoint
- [ ] Success toast appears
- [ ] Success celebration animation (if applicable)
- [ ] Modal closes after success
- [ ] Parent page refreshes data
- [ ] Error handling shows user-friendly messages
- [ ] Keyboard shortcuts work (ESC to close)
- [ ] Mobile responsive

## Related Documentation

- [Transaction Button Fix](./TRANSACTION_BUTTON_FIX_COMPLETE.md) - Payment modal pattern
- [UX Transformation](./UX_TRANSFORMATION_AUDIT.md) - Modal design guidelines
- [Implementation Plan](./Implementation%20Plan_%20Remaining%2020%20Critical%20Use%20Cases.md) - Use case completion

---

**Next Steps**: Prioritize and implement CRITICAL modals (New Lead, Add Employee, Compose Email/SMS)
