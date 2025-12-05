# Zustand + tRPC Integration Architecture

**Date**: December 3, 2025  
**Purpose**: Document how Zustand stores integrate with tRPC for backend state management

---

## Core Principle: Separation of Client and Server State

### Two-Layer State Management

1. **Server State** (tRPC + React Query) - Primary source of truth
   - ALL backend data (cases, payments, shifts, etc.)
   - Automatic cache invalidation
   - Optimistic updates with rollback
   - Background refetching

2. **Client State** (Zustand) - UI-only state
   - User preferences (theme, sidebar)
   - Transient UI state (drag-and-drop, modals)
   - Workflow position (wizard steps)
   - Optimistic transaction placeholders

---

## Store Patterns

### Pattern 1: Pure Client State ✅
**Use Case**: User preferences, UI settings  
**Example**: Preferences Store

```typescript
// ✅ CORRECT - Pure client state, no backend sync needed
interface PreferencesState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  tablePageSize: number;
}

// Usage - no tRPC needed
const { theme, setTheme } = usePreferencesStore();
```

**Stores Using This Pattern**:
- ✅ Preferences Store (theme, sidebar, table settings)

---

### Pattern 2: Transient Editing State ✅
**Use Case**: Local editing with undo/redo before saving  
**Example**: Template Editor Store

```typescript
// ✅ CORRECT - Temporary editing state
interface TemplateEditorState {
  currentTemplate: Template | null; // Loaded from backend
  history: Template[]; // For undo/redo
  isDirty: boolean; // Unsaved changes
}

// Usage - Load from tRPC, edit locally, save back
function TemplateEditor() {
  // Load from backend
  const { data: template } = trpc.template.get.useQuery({ id });
  
  // Local editing state
  const { setTemplate, updateTemplate, undo, redo } = useTemplateEditorStore();
  
  useEffect(() => {
    if (template) setTemplate(template);
  }, [template]);
  
  // Save back to backend
  const mutation = trpc.template.update.useMutation();
  const handleSave = () => mutation.mutate(currentTemplate);
}
```

**Stores Using This Pattern**:
- ✅ Template Editor Store (undo/redo, autosave)

---

### Pattern 3: Workflow UI State ✅
**Use Case**: Multi-step forms, wizard navigation  
**Example**: Case Workflow Store (REFACTORED)

```typescript
// ✅ CORRECT - UI state only, no case data
interface CaseWorkflowState {
  currentStep: WorkflowStep; // Where user is in wizard
  completedSteps: Set<WorkflowStep>; // Progress tracking
  stepValidations: Map<WorkflowStep, StepValidation>; // Validation state
  caseId: string | null; // Which case (not the case data itself)
}

// Usage - Case data from tRPC, workflow state from Zustand
function CaseCreationWizard() {
  // Backend data via tRPC
  const { data: draftCase } = trpc.case.getDraft.useQuery({ id });
  const updateMutation = trpc.case.update.useMutation();
  
  // UI state via Zustand
  const { currentStep, nextStep, markStepComplete } = useCaseWorkflowStore();
  const { canProceed, progressPercentage } = useCaseWorkflowSelectors();
  
  // Update case data via tRPC
  const handleUpdateField = (field, value) => {
    updateMutation.mutate({ id, [field]: value });
  };
  
  // Navigate workflow via Zustand
  const handleNext = () => {
    if (canProceed) {
      markStepComplete(currentStep);
      nextStep();
    }
  };
}
```

**Stores Using This Pattern**:
- ✅ Case Workflow Store (refactored) - workflow position only

---

### Pattern 4: Optimistic Updates Only ✅
**Use Case**: Fast UX during mutations  
**Example**: Financial Transaction Store (REFACTORED)

```typescript
// ✅ CORRECT - Only temporary optimistic transactions
interface FinancialTransactionState {
  optimisticTransactions: Map<string, OptimisticTransaction>; // Temporary only
}

// Usage - Real data from tRPC, optimistic state for UX
function PaymentForm({ caseId }: { caseId: string }) {
  // PRIMARY: Real transactions from tRPC
  const { data: transactions } = trpc.payment.list.useQuery({ caseId });
  
  // SECONDARY: Optimistic placeholders from Zustand
  const { addOptimisticPayment, confirmPayment, rollbackPayment } = 
    useFinancialTransactionStore();
  const { optimisticTransactions } = useFinancialTransactionSelectors();
  
  // Merge for display (real + optimistic)
  const allTransactions = [...(transactions || []), ...optimisticTransactions];
  
  const processPaymentMutation = trpc.payment.process.useMutation({
    onSuccess: (result) => {
      confirmPayment(tempId); // Remove optimistic, tRPC auto-refetches real data
    },
    onError: () => {
      rollbackPayment(tempId); // Remove optimistic on error
    }
  });
  
  const handlePayment = async (payment) => {
    // 1. Add optimistic (instant UI feedback)
    const tempId = addOptimisticPayment(payment);
    
    // 2. Send to backend
    await processPaymentMutation.mutateAsync(payment);
    
    // 3. tRPC automatically invalidates and refetches real data
    // 4. Optimistic transaction removed on success/error
  };
}
```

**Stores Using This Pattern**:
- ✅ Financial Transaction Store (refactored) - optimistic-only

---

### Pattern 5: Calendar/View UI State ⏳
**Use Case**: Calendar views, filters, drag-and-drop  
**Example**: Scheduling Store (TO BE REFACTORED)

```typescript
// ✅ CORRECT - UI state only, no shift data
interface SchedulingState {
  currentView: CalendarView; // day/week/month
  currentDate: Date; // Which date/week/month to show
  filters: ScheduleFilters; // Which shifts to display
  dragState: DragState; // Drag-and-drop UI state
}

// Usage - Shifts from tRPC, view state from Zustand
function StaffScheduler() {
  // Backend data via tRPC
  const { currentView, currentDate, filters } = useSchedulingStore();
  const { data: shifts } = trpc.scheduling.getShifts.useQuery({
    view: currentView,
    date: currentDate,
    filters
  });
  
  // UI state via Zustand
  const { setView, setDate, startDrag, dropShift } = useSchedulingStore();
  
  // Apply filters client-side
  const filteredShifts = applyFilters(shifts, filters);
}
```

**Stores TO BE Refactored**:
- ⏳ Scheduling Store - currently stores shifts (should come from tRPC)

---

## Anti-Patterns ❌

### ❌ WRONG: Storing Backend Data in Zustand

```typescript
// ❌ BAD - Don't store backend data permanently
interface BadTransactionState {
  transactions: Map<string, Transaction>; // Duplicates backend!
  caseBalances: Map<string, number>; // Gets out of sync!
}

// ❌ BAD - Manually syncing with backend
const syncTransactions = async () => {
  const transactions = await fetch('/api/transactions');
  set({ transactions }); // Manual sync is error-prone!
};
```

**Problems**:
- Data gets stale
- Manual sync is error-prone
- Duplicates what tRPC + React Query already does
- Cache invalidation is complex

---

## Benefits of This Architecture

### 1. Single Source of Truth ✅
- Backend data always from tRPC
- No stale data in Zustand
- Automatic cache invalidation

### 2. Simpler Stores ✅
- Zustand stores are smaller (UI-only)
- Less state to manage
- Fewer bugs

### 3. Better Performance ✅
- tRPC handles caching, deduplication, background refetching
- Zustand only re-renders for UI state changes
- Optimistic updates for instant feedback

### 4. Easier Testing ✅
- UI state tests don't need API mocks
- Backend integration tests use tRPC mocks (MSW)
- Clear separation of concerns

---

## Migration Guide

### Refactoring Backend-Data Stores

If a Zustand store currently stores backend data, refactor it:

**Step 1**: Identify what's backend data vs. UI state

```typescript
// BEFORE
interface Store {
  cases: Case[]; // ❌ Backend data
  currentStep: WorkflowStep; // ✅ UI state
  filters: FilterState; // ✅ UI state
}

// AFTER
interface Store {
  // Remove backend data
  currentStep: WorkflowStep; // ✅ Keep UI state
  filters: FilterState; // ✅ Keep UI state
}
```

**Step 2**: Move backend data to tRPC queries

```typescript
// BEFORE
const { cases } = useCaseStore();

// AFTER
const { data: cases } = trpc.case.list.useQuery(filters);
```

**Step 3**: Update components

```typescript
// BEFORE
const { cases, addCase, updateCase } = useCaseStore();

// AFTER
const { data: cases } = trpc.case.list.useQuery();
const addMutation = trpc.case.create.useMutation();
const updateMutation = trpc.case.update.useMutation();

// UI state still from Zustand
const { currentStep, nextStep } = useCaseWorkflowStore();
```

---

## Summary Table

| Store | Pattern | Backend Data | UI State | Status |
|-------|---------|--------------|----------|--------|
| Preferences | Pure Client | None | Theme, sidebar, table settings | ✅ Correct |
| Template Editor | Transient Edit | Via tRPC | Undo/redo history, dirty state | ✅ Correct |
| Case Workflow | Workflow UI | Via tRPC | Step position, validation | ✅ Refactored |
| Financial Transaction | Optimistic | Via tRPC | Pending optimistic transactions | ✅ Refactored |
| Scheduling | Calendar UI | Via tRPC | View, filters, drag state | ⏳ Needs refactor |

---

## Key Takeaways

1. **Zustand = UI State Only** - Never store backend data permanently
2. **tRPC = Backend State** - Single source of truth for all server data
3. **Optimistic Updates** - Use Zustand for temporary placeholders during mutations
4. **Transient Edits** - OK to load data, edit locally with undo/redo, then save
5. **Workflow State** - Track user's position in multi-step flows, not the data itself

---

**Related Documentation**:
- [PHASE_5_COMPLETE.md](./PHASE_5_COMPLETE.md) - Complete Phase 5 state management
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall Clean Architecture guidelines
