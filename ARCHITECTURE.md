# Clean Architecture Guidelines

> **Critical**: This document defines the architectural standards for this codebase. All developers and AI agents MUST follow these patterns.

## Table of Contents
- [Overview](#overview)
- [Layer Boundaries](#layer-boundaries)
- [State Management](#state-management)
- [Testing](#testing)
- [Repository Pattern](#repository-pattern)
- [SCD2 Temporal Pattern](#scd2-temporal-pattern)
- [Error Handling](#error-handling)
- [Enforcement](#enforcement)
- [Code Examples](#code-examples)

---

## Overview

This project follows **Clean Architecture** principles with strict layer separation:

```
┌─────────────────────────────────────────┐
│           API Layer (tRPC)              │  ← No business logic, only routing
├─────────────────────────────────────────┤
│        Application Layer                │  ← Use cases, orchestration
├─────────────────────────────────────────┤
│         Domain Layer                    │  ← Business rules, entities
├─────────────────────────────────────────┤
│      Infrastructure Layer               │  ← Database, external services
└─────────────────────────────────────────┘
```

**Dependency Rule**: Inner layers NEVER depend on outer layers.
- ✅ Infrastructure → Application → Domain
- ❌ Domain → Application (FORBIDDEN)
- ❌ Application → API (FORBIDDEN)

---

## Layer Boundaries

### 1. Domain Layer (`@dykstra/domain`)

**Purpose**: Pure business logic, zero dependencies on frameworks or databases.

**Rules**:
- ✅ Define entities as Effect Data classes
- ✅ All business rules inside domain methods
- ✅ Pure functions and immutable data
- ❌ NO database access
- ❌ NO Effect tags for services (those belong in application layer)
- ❌ NO HTTP/API concerns

**Example**:
```typescript
// ✅ CORRECT: Domain entity with business rules
export class Case extends Data.Class<{
  readonly id: CaseId;
  readonly status: CaseStatus;
  // ... other fields
}> {
  // Business rule method
  transitionStatus(newStatus: CaseStatus): Effect.Effect<Case, InvalidStateTransitionError> {
    const validTransitions = Case.STATUS_TRANSITIONS[this.status];
    if (!validTransitions?.includes(newStatus)) {
      return Effect.fail(new InvalidStateTransitionError({...}));
    }
    return Effect.succeed(new Case({ ...this, status: newStatus }));
  }
}
```

### 2. Application Layer (`@dykstra/application`)

**Purpose**: Use cases and ports (interfaces). Orchestrates domain entities.

**Rules**:
- ✅ Define repository ports as TypeScript interfaces
- ✅ Export Context tags for dependency injection
- ✅ Use cases coordinate domain entities
- ✅ All ports exported from `src/ports/`
- ❌ NO direct database access
- ❌ NO Prisma imports
- ❌ NO implementation details

**Structure**:
```
application/
├── src/
│   ├── ports/              # Repository interfaces (ports)
│   │   ├── case-repository.ts
│   │   └── contract-repository.ts
│   ├── use-cases/          # Business operations
│   │   ├── case-management/
│   │   └── contracts/
│   └── index.ts            # Export everything
```

**Port Example**:
```typescript
// ✅ CORRECT: Port definition
export interface CaseRepository {
  readonly findById: (id: CaseId) => Effect.Effect<Case, NotFoundError | PersistenceError>;
  readonly save: (case_: Case) => Effect.Effect<void, PersistenceError>;
}

export const CaseRepository = Context.GenericTag<CaseRepository>('@dykstra/CaseRepository');
```

**Use Case Example**:
```typescript
// ✅ CORRECT: Use case using domain entity methods
export const updateCaseStatus = (command: UpdateCaseStatusCommand) =>
  Effect.gen(function* () {
    const caseRepo = yield* CaseRepository;
    const currentCase = yield* caseRepo.findByBusinessKey(command.businessKey);
    
    if (!currentCase) {
      return yield* Effect.fail(new NotFoundError({...}));
    }
    
    // Use domain method for business logic
    const updatedCase = yield* currentCase.transitionStatus(command.newStatus);
    
    // Persist via repository
    const newCase = yield* caseRepo.update(updatedCase);
    return { id: newCase.id, status: newCase.status };
  });
```

### 3. Infrastructure Layer (`@dykstra/infrastructure`)

**Purpose**: Adapters that implement ports. Database, external APIs, etc.

**Rules**:
- ✅ Implement repository ports from application layer
- ✅ Use **object-based pattern** (NOT classes)
- ✅ Import `prisma` singleton directly
- ✅ Handle SCD2 temporal patterns
- ✅ All adapters in `src/database/` or `src/adapters/`
- ❌ NO class-based repositories
- ❌ NO business logic (that's in domain)

**Structure**:
```
infrastructure/
├── src/
│   ├── database/
│   │   ├── prisma-client.ts        # Singleton export
│   │   ├── prisma-case-repository.ts
│   │   └── prisma-contract-repository.ts
│   ├── adapters/
│   │   ├── storage/
│   │   └── payment/
│   └── index.ts
```

**Adapter Example**:
```typescript
// ✅ CORRECT: Object-based repository
import { prisma } from './prisma-client';
import type { CaseRepository } from '@dykstra/application';

export const PrismaCaseRepository: CaseRepository = {
  findById: (id: CaseId) =>
    Effect.tryPromise({
      try: async () => {
        const prismaCase = await prisma.case.findFirst({
          where: { businessKey: id, isCurrent: true }
        });
        if (!prismaCase) {
          throw new NotFoundError({...});
        }
        return toDomain(prismaCase);
      },
      catch: (error) => new PersistenceError('Failed to find case', error),
    }),
    
  save: (case_: Case) =>
    Effect.tryPromise({
      try: async () => {
        // SCD2 implementation here
      },
      catch: (error) => new PersistenceError('Failed to save case', error),
    }),
};
```

**❌ ANTI-PATTERN - DO NOT USE**:
```typescript
// ❌ WRONG: Class-based repository (old pattern)
export class PrismaCaseRepository implements CaseRepository {
  constructor(private prisma: PrismaClient) {}  // ❌ NO!
  
  findById(id: CaseId) {
    return Effect.tryPromise({
      try: async () => {
        const prismaCase = await this.prisma.case.findFirst({...}); // ❌ NO!
      }
    });
  }
}
```

### 4. API Layer (`@dykstra/api`)

**Purpose**: HTTP routing with tRPC. No business logic.

**Rules**:
- ✅ Define tRPC routers with Zod schemas
- ✅ Call use cases from application layer
- ✅ Use `runEffect()` helper to execute Effects
- ❌ NO business logic
- ❌ NO direct database access
- ❌ NO domain entity manipulation

**Example**:
```typescript
// ✅ CORRECT: Thin router delegates to use case
export const caseRouter = router({
  updateStatus: staffProcedure
    .input(z.object({
      businessKey: z.string(),
      newStatus: z.enum(['inquiry', 'active', 'completed', 'archived']),
    }))
    .mutation(async ({ input }) => {
      return await runEffect(
        updateCaseStatus({
          businessKey: input.businessKey,
          newStatus: input.newStatus,
        })
      );
    }),
});
```

---

## State Management

**Critical Rule**: **NEVER store backend data in Zustand stores.**

### Two-Layer State Management

This application uses two distinct state management systems:

```
┌─────────────────────────────────────────────────────┐
│  Client State (Zustand)         Server State (tRPC) │
│  • UI preferences               • Cases             │
│  • Workflow position            • Payments          │
│  • Drag-and-drop state          • Shifts            │
│  • Optimistic placeholders      • Contracts         │
│                                 • ALL backend data  │
└─────────────────────────────────────────────────────┘
```

### 1. Server State (tRPC + React Query) - Primary Source of Truth

**Purpose**: ALL backend data

**Rules**:
- ✅ Use tRPC queries for ALL backend data
- ✅ Automatic caching via React Query
- ✅ Automatic cache invalidation on mutations
- ✅ Background refetching
- ❌ NEVER duplicate this data in Zustand

**Example**:
```typescript
// ✅ CORRECT: Backend data from tRPC
function PaymentList({ caseId }: { caseId: string }) {
  const { data: payments } = trpc.payment.list.useQuery({ caseId });
  
  return <PaymentTable data={payments} />;
}
```

### 2. Client State (Zustand) - UI-Only State

**Purpose**: Transient UI state that doesn't need backend persistence

**Rules**:
- ✅ User preferences (theme, sidebar state)
- ✅ UI state (modals, tooltips, drag-and-drop)
- ✅ Workflow position (current step in wizard)
- ✅ Temporary optimistic placeholders
- ❌ NEVER store backend entities
- ❌ NEVER store lists of data from backend

### Zustand Store Patterns

#### Pattern 1: Pure Client State ✅
**Use Case**: Settings, preferences, UI state

```typescript
// ✅ CORRECT: Pure client state
interface PreferencesState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  tablePageSize: number;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const usePreferencesStore = createPersistedStore<PreferencesState>(
  'preferences',
  (set) => ({
    theme: 'system',
    sidebarCollapsed: false,
    tablePageSize: 25,
    setTheme: (theme) => set({ theme }),
    toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  })
);
```

#### Pattern 2: Workflow UI State ✅
**Use Case**: Multi-step forms, wizards

```typescript
// ✅ CORRECT: Workflow position only, no data
interface CaseWorkflowState {
  currentStep: WorkflowStep; // Which step user is on
  completedSteps: Set<WorkflowStep>; // Progress tracking
  stepValidations: Map<WorkflowStep, StepValidation>; // UI validation state
  caseId: string | null; // Which case (NOT the case data itself)
}

// Usage - combine with tRPC
function CaseCreationWizard() {
  // Backend data from tRPC
  const { data: draftCase } = trpc.case.getDraft.useQuery({ id });
  const updateMutation = trpc.case.update.useMutation();
  
  // UI state from Zustand
  const { currentStep, nextStep } = useCaseWorkflowStore();
  
  // Update backend via tRPC
  const handleUpdate = (data) => updateMutation.mutate({ id, ...data });
}
```

#### Pattern 3: Optimistic Updates ✅
**Use Case**: Instant UI feedback during mutations

```typescript
// ✅ CORRECT: Only temporary optimistic state
interface FinancialTransactionState {
  optimisticTransactions: Map<string, OptimisticTransaction>; // Temporary only!
  addOptimisticPayment: (payment: Payment) => string; // Returns temp ID
  confirmPayment: (tempId: string) => void; // Remove after success
  rollbackPayment: (tempId: string) => void; // Remove on error
}

// Usage - merge optimistic with real data
function PaymentList({ caseId }: { caseId: string }) {
  // PRIMARY: Real transactions from tRPC
  const { data: transactions } = trpc.payment.list.useQuery({ caseId });
  
  // SECONDARY: Optimistic placeholders from Zustand
  const { optimisticTransactions } = useFinancialTransactionSelectors();
  
  // Merge for display
  const allTransactions = [...(transactions || []), ...optimisticTransactions];
  
  return <TransactionTable data={allTransactions} />;
}
```

### Anti-Patterns ❌

**❌ WRONG: Storing Backend Data in Zustand**
```typescript
// ❌ BAD - Don't do this!
interface BadPaymentState {
  payments: Payment[]; // ❌ Duplicates backend data!
  cases: Case[]; // ❌ Gets out of sync!
  addPayment: (payment: Payment) => void; // ❌ Manual sync!
}
```

**Problems**:
- Data gets stale (no auto-refetch)
- Manual cache invalidation is error-prone
- Duplicates what tRPC + React Query already does
- Complex synchronization logic

**✅ CORRECT: Use tRPC Instead**
```typescript
// ✅ Good - Let tRPC handle it
function PaymentList() {
  const { data: payments } = trpc.payment.list.useQuery();
  const addMutation = trpc.payment.create.useMutation({
    onSuccess: () => {
      // tRPC automatically invalidates and refetches!
    }
  });
}
```

### Quick Decision Guide

**Store in Zustand if**:
- ✅ It's UI-only state (theme, sidebar, modals)
- ✅ It's workflow position (current step)
- ✅ It's temporary (optimistic placeholders)
- ✅ It doesn't need backend persistence

**Use tRPC if**:
- ✅ It's backend data (cases, payments, shifts)
- ✅ It needs to sync across tabs/devices
- ✅ It needs to persist to database
- ✅ Multiple users need to see it

**See Also**: [ZUSTAND_TRPC_INTEGRATION.md](./docs/ZUSTAND_TRPC_INTEGRATION.md) for detailed patterns and examples.

---

## Testing

**Critical Rule**: **Frontend and backend tests are SEPARATE with different configurations.**

### Two Testing Environments

This application uses separate test setups for frontend and backend:

```
┌────────────────────────────────────────────────────────────────┐
│  Frontend Tests              Backend Tests                     │
│  • Location: src/**          • Location: packages/**           │
│  • Config: root vitest       • Config: per-package vitest     │
│  • Environment: happy-dom    • Environment: node              │
│  • Tools: React Testing      • Tools: Vitest only             │
│    Library, MSW                                                │
└────────────────────────────────────────────────────────────────┘
```

### Frontend Tests (Next.js App)

**Location**: `src/**/*.{test,spec}.{ts,tsx}`

**Configuration**: Root `vitest.config.ts` (uses happy-dom)

**What to Test**:
- ✅ React components (UI behavior)
- ✅ Custom hooks (state logic)
- ✅ Zustand stores (client state)
- ✅ ViewModels (data transformation)
- ✅ Integration with tRPC (using MSW mocks)

**Commands**:
```bash
pnpm test:frontend          # Run once
pnpm test:frontend:watch    # Watch mode
pnpm test:frontend:ui       # Visual UI
pnpm test:frontend:coverage # Coverage report
```

**Example Component Test**:
```typescript
import { render, screen, userEvent } from '@/test-utils';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

**Example Store Test**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { usePreferencesStore } from '@/stores';

describe('usePreferencesStore', () => {
  it('sets theme correctly', () => {
    const { result } = renderHook(() => usePreferencesStore());
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.theme).toBe('dark');
  });
});
```

**Example Integration Test with MSW**:
```typescript
import { render, screen, waitFor } from '@/test-utils';
import { server } from '@/test-utils/msw-server';
import { http, HttpResponse } from 'msw';

describe('TemplateList', () => {
  it('displays templates from API', async () => {
    render(<TemplateList />);
    
    await waitFor(() => {
      expect(screen.getByText('Classic Memorial Program')).toBeInTheDocument();
    });
  });
  
  it('displays error on API failure', async () => {
    // Override MSW handler for this test
    server.use(
      http.get('/api/trpc/template.list', () => {
        return HttpResponse.json({ error: 'Failed' }, { status: 500 });
      })
    );
    
    render(<TemplateList />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Backend Tests (Clean Architecture Layers)

**Location**: `packages/**/*.test.ts`

**Configuration**: Per-package `vitest.config.ts` (uses node environment)

**What to Test**:
- ✅ Domain entities (business rules)
- ✅ Use cases (orchestration)
- ✅ Repositories (data access)
- ✅ Adapters (external services)

**Commands**:
```bash
pnpm test:backend           # Run all backend tests (via turbo)
```

**Example Domain Test** (`packages/domain/`):
```typescript
import { Case } from '@dykstra/domain';
import { Effect } from 'effect';

describe('Case entity', () => {
  it('allows valid status transition', async () => {
    const case_ = new Case({ status: 'inquiry', ...otherFields });
    
    const result = await Effect.runPromise(
      case_.transitionStatus('active')
    );
    
    expect(result.status).toBe('active');
  });
  
  it('prevents invalid status transition', async () => {
    const case_ = new Case({ status: 'completed', ...otherFields });
    
    await expect(
      Effect.runPromise(case_.transitionStatus('inquiry'))
    ).rejects.toThrow('InvalidStateTransitionError');
  });
});
```

**Example Use Case Test** (`packages/application/`):
```typescript
import { updateCaseStatus } from '@dykstra/application';
import { Effect, Layer } from 'effect';

describe('updateCaseStatus use case', () => {
  it('updates case status successfully', async () => {
    // Create mock repository layer
    const mockRepo = Layer.succeed(CaseRepository, {
      findByBusinessKey: () => Effect.succeed(mockCase),
      update: () => Effect.succeed(undefined),
    });
    
    const result = await Effect.runPromise(
      updateCaseStatus({ businessKey: 'case-001', newStatus: 'active' })
        .pipe(Effect.provide(mockRepo))
    );
    
    expect(result.status).toBe('active');
  });
});
```

**Example Repository Test** (`packages/infrastructure/`):
```typescript
import { PrismaCaseRepository } from '@dykstra/infrastructure';
import { Effect } from 'effect';

describe('PrismaCaseRepository', () => {
  it('finds case by ID', async () => {
    const result = await Effect.runPromise(
      PrismaCaseRepository.findById('case-001')
    );
    
    expect(result.businessKey).toBe('case-001');
    expect(result.status).toBe('active');
  });
});
```

### Test Utilities

**Frontend Utilities** (`src/test-utils/`):
- `render.tsx` - Custom render with React Query provider
- `factories.ts` - Mock data generators
- `msw-handlers.ts` - API mock handlers
- `msw-server.ts` - MSW server instance
- `setup.ts` - Global test setup

**Usage**:
```typescript
import { render, screen, mockTemplate } from '@/test-utils';

test('displays template', () => {
  const template = mockTemplate({ name: 'Custom Name' });
  render(<TemplateCard template={template} />);
  expect(screen.getByText('Custom Name')).toBeInTheDocument();
});
```

### Testing Best Practices

**DO**:
- ✅ Test behavior, not implementation
- ✅ Use accessible queries (`getByRole`, `getByLabelText`)
- ✅ Test user interactions (clicks, form submissions)
- ✅ Test error states and edge cases
- ✅ Keep tests simple and focused
- ✅ Use MSW for API mocking (not fetch mocks)
- ✅ Test domain logic with Effect-based tests

**DON'T**:
- ❌ Test implementation details (internal state)
- ❌ Use snapshots excessively
- ❌ Test third-party libraries
- ❌ Make tests too complex
- ❌ Ignore accessibility in tests
- ❌ Mix frontend and backend test concerns

### Running All Tests

```bash
# Run everything (frontend + backend)
pnpm test

# Or run separately
pnpm test:frontend  # Only React/UI tests
pnpm test:backend   # Only domain/use case/repository tests
```

### CI/CD Integration

Both test suites should run in CI:
```yaml
# .github/workflows/test.yml
steps:
  - name: Test Frontend
    run: pnpm test:frontend
    
  - name: Test Backend
    run: pnpm test:backend
```

---

## Repository Pattern

### Object-Based Pattern (REQUIRED)

**Always use object-based repositories**, never classes:

```typescript
// ✅ CORRECT
export const PrismaXRepository: XRepository = {
  findById: (id) => Effect.tryPromise({...}),
  save: (entity) => Effect.tryPromise({...}),
};

// ❌ WRONG
export class PrismaXRepository implements XRepository {
  constructor(private prisma: PrismaClient) {}
  findById(id) { return Effect.tryPromise({...}); }
}
```

**Why object-based?**
- ✅ Works with Effect's `Layer.succeed()` for DI
- ✅ No constructor injection complexity
- ✅ Easier to test and mock
- ✅ Cleaner functional style

### Prisma Client Import

**Always import the singleton**:
```typescript
import { prisma } from './prisma-client';

// Use it directly
const cases = await prisma.case.findMany({...});
```

---

## SCD2 Temporal Pattern

**All entities with history use SCD Type 2** (Slowly Changing Dimension Type 2).

### Key Principles

1. **Never update existing records** - always create new versions
2. **Close current version** before creating new one
3. **Preserve original creation time** across versions
4. **Use transactions** for atomic updates

### Required Fields

Every temporal table MUST have:
```prisma
model Case {
  id            String    @id @default(cuid())
  businessKey   String    // Immutable business identifier
  version       Int       @default(1)
  validFrom     DateTime  @default(now())
  validTo       DateTime?
  isCurrent     Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  // ... business fields
}
```

### Implementation Pattern

```typescript
// ✅ CORRECT: SCD2 save implementation
save: (case_: Case) =>
  Effect.tryPromise({
    try: async () => {
      const now = new Date();
      
      if (case_.version === 1) {
        // New entity - simple insert
        await prisma.case.create({
          data: {
            ...toPrisma(case_),
            validFrom: now,
            isCurrent: true,
          }
        });
      } else {
        // Update - SCD2 transaction
        await prisma.$transaction(async (tx) => {
          // 1. Close current version
          await tx.case.updateMany({
            where: { businessKey: case_.businessKey, isCurrent: true },
            data: { validTo: now, isCurrent: false },
          });
          
          // 2. Insert new version
          await tx.case.create({
            data: {
              ...toPrisma(case_),
              version: case_.version + 1,  // Increment version
              validFrom: now,
              isCurrent: true,
              createdAt: case_.createdAt,  // Preserve original creation time
            }
          });
        });
      }
    },
    catch: (error) => new PersistenceError('Failed to save', error),
  }),
```

### Querying Temporal Data

```typescript
// Current version only
findById: (id: CaseId) =>
  prisma.case.findFirst({
    where: { businessKey: id, isCurrent: true }
  });

// Point-in-time query
findByIdAtTime: (businessKey: string, asOf: Date) =>
  prisma.case.findFirst({
    where: {
      businessKey,
      validFrom: { lte: asOf },
      OR: [
        { validTo: { gt: asOf } },
        { validTo: null }
      ]
    }
  });

// Full history
findHistory: (businessKey: string) =>
  prisma.case.findMany({
    where: { businessKey },
    orderBy: { version: 'asc' }
  });
```

---

## Error Handling

### Domain Errors

Define errors in domain layer:
```typescript
// ✅ CORRECT: Domain error
export class InvalidStateTransitionError extends Data.TaggedError('InvalidStateTransitionError')<{
  message: string;
  fromState: string;
  toState: string;
}> {}
```

### Error Types by Layer

| Layer | Error Types |
|-------|-------------|
| **Domain** | ValidationError, InvalidStateTransitionError, BusinessRuleViolationError |
| **Application** | NotFoundError, ConflictError |
| **Infrastructure** | PersistenceError, NetworkError |

### Error Construction

**Use object format**:
```typescript
// ✅ CORRECT
new NotFoundError({
  message: 'Case not found',
  entityType: 'Case',
  entityId: id
});

// ❌ WRONG
new NotFoundError('Case not found');  // No object wrapper
```

### Error Handling in Adapters

```typescript
// ✅ CORRECT: Proper error transformation
Effect.tryPromise({
  try: async () => {
    // ... database operation
  },
  catch: (error: any) => {
    // Check for specific Prisma errors
    if (error?.code === 'P2025') {
      return { _tag: 'NotFoundError', id } as unknown as NotFoundError;
    }
    // Generic persistence error
    return new PersistenceError('Operation failed', error);
  },
})
```

---

## Enforcement

### 1. TypeScript Strict Mode

Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. Import Boundaries

**Application layer MUST NOT import from**:
- `@prisma/client`
- `@dykstra/api`
- `@dykstra/infrastructure`

**Domain layer MUST NOT import from**:
- Any other layer (should have zero dependencies)

### 3. Naming Conventions

| Pattern | Example |
|---------|---------|
| Entities | PascalCase: `Case`, `Contract` |
| Repositories (Port) | `XRepository` interface |
| Repositories (Adapter) | `PrismaXRepository` const |
| Use cases | kebab-case files: `update-case-status.ts` |
| Use case functions | camelCase: `updateCaseStatus` |

### 4. File Structure Rules

```
✅ CORRECT Structure:
application/src/ports/case-repository.ts       → Interface definition
infrastructure/src/database/prisma-case-repository.ts → Implementation

❌ WRONG:
application/src/repositories/case-repository.ts → No implementations in application!
```

### 5. Code Review Checklist

- [ ] No Prisma in application or domain layers
- [ ] All repositories are object-based (not classes)
- [ ] SCD2 pattern used for temporal data
- [ ] Domain entities contain business rules
- [ ] Use cases are thin orchestrators
- [ ] API routers delegate to use cases
- [ ] Errors use object format
- [ ] All ports exported from application/src/ports/

---

## Code Examples

### Complete Flow Example

**1. Domain Entity** (`@dykstra/domain`):
```typescript
export class Contract extends Data.Class<{
  readonly id: ContractId;
  readonly status: ContractStatus;
  // ... fields
}> {
  transitionStatus(newStatus: ContractStatus): Effect.Effect<Contract, InvalidStateTransitionError> {
    const validTransitions = Contract.STATUS_TRANSITIONS[this.status];
    if (!validTransitions?.includes(newStatus)) {
      return Effect.fail(new InvalidStateTransitionError({...}));
    }
    return Effect.succeed(new Contract({ ...this, status: newStatus }));
  }
}
```

**2. Repository Port** (`@dykstra/application/ports`):
```typescript
export interface ContractRepository {
  readonly findByBusinessKey: (key: string) => Effect.Effect<Contract | null, PersistenceError>;
  readonly update: (contract: Contract) => Effect.Effect<Contract, PersistenceError>;
}

export const ContractRepository = Context.GenericTag<ContractRepository>('@dykstra/ContractRepository');
```

**3. Use Case** (`@dykstra/application/use-cases`):
```typescript
export const updateContractStatus = (command: UpdateContractStatusCommand) =>
  Effect.gen(function* () {
    const contractRepo = yield* ContractRepository;
    const contract = yield* contractRepo.findByBusinessKey(command.businessKey);
    
    if (!contract) {
      return yield* Effect.fail(new NotFoundError({...}));
    }
    
    // Domain method handles business logic
    const updatedContract = yield* contract.transitionStatus(command.status);
    
    // Repository handles persistence
    return yield* contractRepo.update(updatedContract);
  });
```

**4. Repository Adapter** (`@dykstra/infrastructure/database`):
```typescript
export const PrismaContractRepository: ContractRepository = {
  findByBusinessKey: (businessKey: string) =>
    Effect.tryPromise({
      try: async () => {
        const contract = await prisma.contract.findFirst({
          where: { businessKey, isCurrent: true }
        });
        return contract ? toDomain(contract) : null;
      },
      catch: (error) => new PersistenceError('Find failed', error),
    }),
    
  update: (contract: Contract) =>
    Effect.gen(function* () {
      yield* PrismaContractRepository.save(contract);  // Uses SCD2 save
      return contract;
    }),
};
```

**5. API Router** (`@dykstra/api`):
```typescript
export const contractRouter = router({
  updateStatus: staffProcedure
    .input(z.object({
      businessKey: z.string(),
      status: z.enum(['draft', 'pending_review', 'fully_signed']),
    }))
    .mutation(async ({ input }) => {
      return await runEffect(
        updateContractStatus({
          businessKey: input.businessKey,
          status: input.status,
        })
      );
    }),
});
```

---

## Quick Reference

### Decision Tree: Where Does This Code Go?

```
Is it a business rule? 
  → YES: Domain Layer (entity method)
  
Is it orchestrating multiple entities?
  → YES: Application Layer (use case)
  
Is it persisting data?
  → YES: Infrastructure Layer (repository adapter)
  
Is it HTTP routing?
  → YES: API Layer (tRPC router)
```

### Port vs Adapter Quick Check

| | Port | Adapter |
|---|------|---------|
| **Location** | `@dykstra/application/ports/` | `@dykstra/infrastructure/` |
| **Type** | TypeScript interface | Object implementing interface |
| **Exports** | Interface + Context.GenericTag | Const object |
| **Dependencies** | None (defines contract) | Prisma, external libraries |

---

---

## Go ERP Integration Architecture

### Overview

This project integrates with a **separate Go ERP backend** that provides production-grade financial, inventory, payroll, and procurement capabilities. The integration follows Clean Architecture principles with strict boundaries.

**Key Principles**:
- ✅ TypeScript frontend NEVER directly accesses Go infrastructure (TigerBeetle, EventStoreDB, PostgreSQL)
- ✅ Communication ONLY via HTTP/JSON through OpenAPI contracts
- ✅ BFF (Backend-for-Frontend) acts as boundary
- ✅ Separate PostgreSQL databases (TypeScript CRM + Go ERP)
- ✅ Unified Next.js UI for both TypeScript and Go domains

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js 15 Unified UI (Single Deployment)                       │
│ - Family Portal (TypeScript: memorials, CRM)                   │
│ - Staff Dashboard (TypeScript: CRM + Go: payroll, inventory)   │
│ - Command Palette, Real-time Collaboration, AI Features        │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┼───────┐
         │       │       │
┌────────┴──────┐  │  ┌──────┴────────────────────────────────┐
│ TypeScript  │  │  │ BFF Proxy (Next.js API Routes)  │
│ tRPC APIs   │  │  │ - Auth injection                │
│             │  │  │ - HTTP-only routing             │
│ - Leads     │  │  │ - OpenAPI client (generated)    │
│ - Contacts  │  │  └─────────┬────────────────────────────┘
│ - Campaigns │  │           │
│ - Memorials │  │           │ HTTP/JSON (OpenAPI)
└────────┬──────┘  │           │
         │          │  ┌─────────┴────────────────────────────┐
         │          │  │ Go ERP Backend (HTTP API)       │
         │          │  │ - Contracts, GL/AR/AP           │
         │          │  │ - Inventory, Payroll, P2P       │
         │          │  │ - HCM, Fixed Assets, Approvals  │
         │          │  └─────────┬────────────────────────────┘
         │          │           │
         │          │  ┌─────────┼────────────────────────────┐
         │          │  │         │                       │
         │          │  │  ┌──────┴───────┐  ┌─────────────┐
         │          │  │  │ EventStoreDB │  │ TigerBeetle │
         │          │  │  │ (Events)     │  │ (Accounting)│
         │          │  │  └──────┬───────┘  └─────────────┘
         │          │  │         │
         │          │  │  ┌──────┴─────────────────────────────┐
         │          │  │  │ PostgreSQL 2 (Go ERP)          │
         │          │  │  │ - contracts_hist               │
         │          │  │  │ - gl_accounts_hist             │
         │          │  │  │ - workers_hist (HCM)           │
         │          │  │  │ - inventory_items_hist         │
         │          │  │  │ (Managed by Go projectors)     │
         │          │  │  └─────────────────────────────────┘
         │          │  │
┌────────┴─────────────────────────────────┐  │
│ PostgreSQL 1 (TypeScript CRM)          │  │
│ - leads, contacts, campaigns            │  │
│ - memorials, interactions               │  │
│ - documents (SCD2)                      │  │
│ (Managed by Prisma migrations)          │  │
└───────────────────────────────────────────┘  │
                                              │
                                   ❌ NO DIRECT ACCESS
```

### Dual Backend Strategy

#### TypeScript Domain (This Codebase)
**Owns**: Family-facing, CRM, Marketing, Memorial capabilities

- ✅ Domain: Lead, Contact, Campaign, Memorial, Interaction, ReferralSource
- ✅ Application: CRM use cases (createLead, convertLeadToCase, sendCampaign)
- ✅ Infrastructure: PrismaCaseRepository, SendGridAdapter, StripeAdapter
- ✅ API: tRPC routers for TypeScript domain

**Database**: PostgreSQL 1 (funeral_home_crm)
- Managed by Prisma migrations
- SCD2 temporal pattern for all entities

#### Go ERP Domain (External Backend)
**Owns**: Transaction-heavy, compliance-heavy, financial capabilities

- ✅ 20 Go modules: Contracts, GL/AR/AP, Inventory, Payroll, P2P, HCM, Fixed Assets, etc.
- ✅ Event-sourced (EventStoreDB)
- ✅ TigerBeetle double-entry accounting
- ✅ Production-grade, battle-tested

**Database**: PostgreSQL 2 (funeral_home_erp)
- Managed by Go projectors
- SCD2 temporal pattern (Go implementation)

### Integration Patterns

#### 1. BFF Proxy Pattern

**Purpose**: TypeScript frontend communicates with Go backend ONLY via BFF.

```typescript
// app/api/go-proxy/[...path]/route.ts
// ✅ CORRECT: BFF acts as thin proxy

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const user = await getCurrentUser(req); // TypeScript auth
  
  // Proxy to Go backend
  const response = await fetch(
    `${process.env.GO_BACKEND_URL}/${params.path.join('/')}`,
    {
      headers: {
        'Authorization': `Bearer ${user.backendToken}`,
        'X-Tenant-Id': user.funeralHomeId
      }
    }
  );
  
  return Response.json(await response.json());
}
```

**❌ FORBIDDEN**:
```typescript
// ❌ WRONG: Never import Go packages or access Go infrastructure directly
import { TigerBeetleClient } from 'tigerbeetle-node'; // ❌ NO!
import { EventStoreDBClient } from '@eventstore/db-client'; // ❌ NO!
```

#### 2. OpenAPI Client Adapter Pattern

**Purpose**: Type-safe Go API access via infrastructure adapter.

```typescript
// infrastructure/adapters/go-backend/go-contract-adapter.ts
// ✅ CORRECT: Object-based adapter wrapping OpenAPI client

import createClient from 'openapi-fetch';
import type { paths } from '@/generated/go-api'; // Generated from Go OpenAPI
import type { ContractPort } from '@/application/ports';

export const goClient = createClient<paths>({ 
  baseUrl: '/api/go-proxy' 
});

// Object-based adapter (follows our repository pattern)
export const GoContractAdapter: ContractPort = {
  approveContract: (contractId: string) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts/{id}/approve', {
          params: { path: { id: contractId } }
        });
        if (res.error) throw new Error(res.error);
        return res.data;
      },
      catch: (error) => new NetworkError('Failed to approve contract', error)
    }),
    
  createContract: (data: CreateContractData) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/contracts', { body: data });
        if (res.error) throw new Error(res.error);
        return res.data;
      },
      catch: (error) => new NetworkError('Failed to create contract', error)
    })
};
```

#### 3. Cross-Domain Use Case Pattern

**Purpose**: Orchestrate TypeScript + Go domains in application layer.

```typescript
// application/use-cases/case-management/convert-lead-to-case.ts
// ✅ CORRECT: Use case orchestrates TypeScript + Go via ports

export const convertLeadToCase = (command: ConvertLeadToCaseCommand) =>
  Effect.gen(function* () {
    // 1. TypeScript domain: Load lead
    const leadRepo = yield* LeadRepository;
    const lead = yield* leadRepo.findByBusinessKey(command.leadId);
    
    if (!lead) {
      return yield* Effect.fail(new NotFoundError({...}));
    }
    
    // 2. TypeScript domain: Create case
    const caseRepo = yield* CaseRepository;
    const case_ = yield* caseRepo.create({
      decedentName: lead.decedentName,
      familyContactId: lead.contactId,
      type: 'at-need'
    });
    
    // 3. Go domain: Create contract (via port)
    const goContractAdapter = yield* GoContractAdapter;
    const contract = yield* goContractAdapter.createContract({
      caseId: case_.id,
      services: lead.requestedServices,
    });
    
    // 4. TypeScript domain: Link case to contract
    const updatedCase = yield* caseRepo.update({
      ...case_,
      goContractId: contract.id
    });
    
    // 5. TypeScript domain: Mark lead as converted
    yield* leadRepo.update({
      ...lead,
      status: 'converted',
      convertedToCaseId: case_.id
    });
    
    return { caseId: case_.id, contractId: contract.id };
  });
```

**Key Points**:
- ✅ Application layer orchestrates multiple domains via ports
- ✅ Go interaction happens through `GoContractAdapter` (infrastructure layer)
- ✅ No direct HTTP calls in use cases
- ✅ Clean separation of concerns

### Database Isolation

#### Why Two Separate PostgreSQL Databases?

**PostgreSQL 1 (funeral_home_crm)**:
- Owner: TypeScript application
- Schema: Managed by Prisma migrations
- Purpose: CRM, Marketing, Memorial data

**PostgreSQL 2 (funeral_home_erp)**:
- Owner: Go backend projectors
- Schema: Managed by Go DDL (projector-driven)
- Purpose: Read-models from Go event sourcing

**Benefits**:
1. ✅ **Schema isolation**: Prisma migrations never conflict with Go DDL
2. ✅ **Independent scaling**: Scale CRM DB separately from ERP read-models
3. ✅ **Blast radius containment**: Go projector bugs can't corrupt CRM data
4. ✅ **Clear ownership boundaries**: TypeScript owns CRM, Go owns ERP
5. ✅ **Deployment independence**: Deploy Go updates without TypeScript coordination

**❌ ANTI-PATTERN**: Sharing a single database
```prisma
// ❌ WRONG: DO NOT put Go and TypeScript tables in same database
model Case {  // TypeScript table
  id String @id
}

model contract_hist {  // Go table - ❌ CONFLICT!
  id String @id
}
```

### Unified UI Strategy

#### Single Next.js Application

**Goal**: One deployment serves both TypeScript and Go domains.

```
apps/funeral-home-portal/
  app/
    (family)/              # Family-facing (TypeScript domain)
      memorials/[id]/
      cases/[id]/
    (staff)/               # Staff-facing (TypeScript + Go domains)
      dashboard/
      crm/                 # TypeScript domain
        leads/
        campaigns/
      financial/           # Go domain (via BFF proxy)
        invoices/
        payments/
      payroll/             # Go domain (via BFF proxy)
      inventory/           # Go domain (via BFF proxy)
    api/
      trpc/[trpc]/         # TypeScript tRPC APIs
      go-proxy/[...path]/  # BFF proxy to Go
  lib/
    trpc.ts                # TypeScript API client
    go-client.ts           # Go OpenAPI client
```

**Benefits**:
- ✅ Single deployment (simpler ops)
- ✅ Shared design system (consistent UX)
- ✅ Single auth boundary (user logs in once)
- ✅ Cross-domain navigation (seamless UX)
- ✅ Unified command palette (search across all domains)

### Architectural Boundaries Enforcement

#### CI Validation

```yaml
# .github/workflows/arch-validation.yml
name: Architecture Validation
on: [pull_request]
jobs:
  enforce-boundaries:
    runs-on: ubuntu-latest
    steps:
      - name: Check no direct Go infrastructure access
        run: |
          # Fail if TypeScript imports TigerBeetle, EventStoreDB, or Go PG
          if grep -r "from 'tigerbeetle" packages/; then
            echo "ERROR: Direct TigerBeetle import in TypeScript!"
            exit 1
          fi
          if grep -r "from '@eventstore" packages/; then
            echo "ERROR: Direct EventStoreDB import in TypeScript!"
            exit 1
          fi
      
      - name: Check application layer doesn't import infrastructure
        run: |
          if grep -r "from '@prisma/client'" packages/application/; then
            echo "ERROR: Prisma import in application layer!"
            exit 1
          fi
```

#### Port Definition for Go Backend

```typescript
// application/ports/go-contract-port.ts
// ✅ CORRECT: Define port for Go backend integration

import { Effect } from 'effect';

export interface GoContractPort {
  readonly createContract: (data: CreateContractData) => 
    Effect.Effect<Contract, NetworkError>;
  readonly approveContract: (id: string) => 
    Effect.Effect<void, NetworkError>;
  readonly getContract: (id: string) => 
    Effect.Effect<Contract, NotFoundError | NetworkError>;
}

export const GoContractPort = Context.GenericTag<GoContractPort>(
  '@dykstra/GoContractPort'
);
```

### Integration Checklist

**When integrating with Go backend**:
- [ ] Define port interface in `application/ports/`
- [ ] Implement adapter in `infrastructure/adapters/go-backend/`
- [ ] Use object-based pattern (not class)
- [ ] Wrap OpenAPI-generated client
- [ ] Handle errors via Effect
- [ ] Proxy HTTP calls through BFF (`/api/go-proxy/*`)
- [ ] Never import Go packages directly
- [ ] Never access TigerBeetle, EventStoreDB, or Go PostgreSQL
- [ ] Test adapter with mocked Go API responses

### Summary

**The Go ERP integration**:
1. ✅ Maintains Clean Architecture (via ports/adapters)
2. ✅ Preserves hexagonal boundaries (BFF as boundary)
3. ✅ Uses separate databases (schema isolation)
4. ✅ Provides unified UI (single Next.js deployment)
5. ✅ Enables cross-domain workflows (via application layer orchestration)
6. ✅ Enforces boundaries via CI (automated validation)

**This architecture allows us to leverage production-grade Go ERP capabilities while maintaining TypeScript Clean Architecture principles.**

---

## Configuration Management Architecture

### Overview

Configuration (business rules, policies, parameters) and execution (operations that apply those rules) must be strictly separated. This ensures maintainability and auditability so business behavior changes do not require code deployments.

Core principle: Policies live in the TypeScript/PostgreSQL layer. The Go backend is an execution engine only (scheduling, financials, inventory, workflows) and must not persist or serve policy.

### Key definitions

- Configuration: per–funeral-home business rules such as On-Call Director policy (advance notice, rest period, consecutive weekends), Service Coverage staffing rules (roles per service type), overtime limits, holiday premiums, approval thresholds.
  - Characteristics: changes frequently; audited; per-home isolation; no dependency on Go; SCD2 versioning required.
  - Persistence: PostgreSQL via Prisma in the TypeScript layer.
- Execution: applying rules to create shifts, run scheduling algorithms, post payroll/financials, process inventory.
  - Characteristics: transaction-heavy; stateful; may be event-sourced; strong consistency; compliance-heavy.
  - Persistence: Go systems (EventStoreDB events, TigerBeetle accounts, Go-owned PostgreSQL projections).

### Separation-of-concerns pattern

1) Load policy locally (TypeScript/PostgreSQL) via a repository port.
2) Validate inputs against the policy in TypeScript (pure functions/domain helpers).
3) Call Go adapters for execution only (no policy retrieval from Go).

#### Correct (policy local, execution remote)

```ts path=null start=null
// application/use-cases/scheduling/assign-on-call-director.ts
export const assignOnCallDirector = (cmd: AssignOnCallDirectorCommand) =>
  Effect.gen(function* () {
    const policyRepo = yield* OnCallPolicyRepository;
    const policy = yield* policyRepo.findCurrentByFuneralHome(cmd.funeralHomeId);

    const err = validateOnCallAssignment({ startDate: cmd.startDate, endDate: cmd.endDate, policy });
    if (err) return yield* Effect.fail(err);

    const goScheduling = yield* GoSchedulingAdapter;
    return yield* goScheduling.createOnCallShift({
      directorId: cmd.directorId,
      startTime: cmd.startDate,
      endTime: cmd.endDate,
    });
  });
```

#### Anti-pattern (do not fetch policy from Go)

```ts path=null start=null
export const assignOnCallDirector = (cmd: AssignOnCallDirectorCommand) =>
  Effect.gen(function* () {
    // ❌ Wrong: coupling policy to Go
    const goScheduling = yield* GoSchedulingAdapter;
    const policy = yield* goScheduling.getOnCallPolicy(cmd.funeralHomeId);
    return yield* goScheduling.createOnCallShift({ /* ... */ });
  });
```

Problems with the anti-pattern:
- Duplicate configuration across systems → drift and audit gaps
- Network dependency for basic validation
- Hard to implement consistent SCD2 and per-home isolation

### Three operation categories

#### 1. Local-only operations (TypeScript/PostgreSQL, no Go)

Many CRM and funeral home operations are entirely contained in the TypeScript layer with no Go involvement:
- Lead management (create, convert, qualify)
- Contact/relationship management (individuals, families, organizations)
- Interaction tracking (calls, emails, visits, notes)
- Campaign management (create, schedule, send)
- Memorial pages (create, manage content, publish)
- Documents (upload, store, retrieve)
- User management (roles, permissions, preferences)
- Audit logs

**Rule**: Do not invoke Go for operations that are CRM-specific or funeral-home-scoped configuration. Keep these local.

#### 2. Configuration (TypeScript/PostgreSQL, Go-independent)

All policy and rule definitions are local, even if they ultimately drive Go operations:
- On-Call Director policy (advance notice, rest periods, consecutive weekends)
- Service Coverage staffing rules (staff roles per service type)
- Shift swap rules (advance notice, overtime limits)
- Overtime thresholds
- Holiday premiums
- Approval routing rules
- Time-off policies
- Pricing tiers and discounts

**Rule**: Configuration lives in TypeScript/PostgreSQL with SCD2 versioning. Go never retrieves or persists policy. Use cases load policy locally, validate locally, then call Go for execution.

#### 3. Execution that requires Go (Go backend)

Operations that are transaction-heavy, event-sourced, or require financial/inventory consistency:
- Schedule/shift creation (scheduling engine)
- Payroll calculation and posting
- General ledger, AR, AP transactions (TigerBeetle)
- Inventory transactions
- Contract lifecycle (Go-owned contracts)
- Event-sourced workflows
- Approval workflows (if Go-managed)

**Rule**: Use Go only for execution. Load policy from TypeScript, validate in TypeScript, pass validated data to Go.

### When to use the Go backend

Use Go (✅): scheduling/shift creation, financial transactions (TigerBeetle), payroll, inventory ops, event-sourced workflows, approvals, contract lifecycle. 
Do not use Go (❌): policy/rule definitions, per-home config storage, validation logic, configuration audit trails, CRM operations, anything that can be validated locally.

### Configuration storage pattern (SCD2)

- Define domain entity for the policy with SCD2 fields (version, validFrom, validTo, isCurrent, businessKey).
- Create Prisma migration in the TypeScript repo.
- Implement repository port in application layer and object-based Prisma adapter in infrastructure.
- Optionally add a thin service for common operations.
- Write policy-variation tests (strict vs flexible) and ensure use cases load policy once and reuse for all validations.

### Multi–funeral-home isolation

- All policy queries are scoped by funeralHomeId.
- No global constants for business rules; all values come from the current policy row.

---

## Refactoring Hardcoded Use Cases to Configurable Policies

### Overview

The funeral home system has 50+ use cases across 10+ domains (case management, payments, scheduling, payroll, financial, inventory, procurement, contracts, pre-planning, HR). Many contain hardcoded business rules (staffing ratios, time thresholds, approval limits, pricing tiers, payment flows, etc.). These must be refactored into configurable policies stored in PostgreSQL, allowing funeral home operators to modify behavior without code changes or deployments.

This section documents a **universal, domain-agnostic** systematic process that applies to any use case in any domain—whether you're refactoring an existing scenario or a new use case discovered during development.

### Scope: This Process Works For

✅ All 9 scheduling scenarios (on-call, service coverage, embalmer shifts, shift swaps, weekend rotation, pre-planning, driver coordination, holiday premiums, prep rooms)  
✅ All 49+ currently implemented use cases (financial, payroll, procurement, contracts, etc.)  
✅ Any new use case added in the future  
✅ Domain-agnostic: works for CRM operations, Go backend integrations, local-only operations  
✅ Hybrid scenarios: policies partially in TypeScript (local config) + execution in Go (transactions)

### Types of Policies (Identify Your Use Case Category)

Understanding your use case category helps determine what needs to be configurable:

#### Type A: Local-Only Operations (TypeScript/PostgreSQL only)
Examples: lead qualification, campaign management, memorial pages, document management, user preferences

**Configurable aspects**:
- Validation rules (field requirements, value ranges)
- Workflow stages (approval steps, stage names)
- Business thresholds (age limits, budget caps)
- Notification rules (who gets notified, when, conditions)

**Policy storage**: Always TypeScript/PostgreSQL  
**Go backend**: Not involved

#### Type B: Configuration-Driven Execution (TypeScript config + Go execution)
Examples: scheduling (on-call, service coverage, shifts), payroll (overtime rules, calculations), financial (month-end close steps)

**Configurable aspects**:
- Staffing requirements (roles, counts)
- Time thresholds (hours, days, durations)
- Validation rules before Go operations
- Execution parameters (which Go endpoints to call, order)
- Cost calculations (rates, multipliers, premiums)

**Policy storage**: TypeScript/PostgreSQL (rules, thresholds)  
**Go backend**: Execution only (shift creation, payroll posting, GL entries)

#### Type C: Go-Owned Workflows (Go backend owns both policy and execution)
Examples: approval routing, contract lifecycle states, event-sourced financial transactions

**Configurable aspects**:
- Go owns workflow rules, state machines
- TypeScript may have UI-level validation or presentation rules
- TypeScript loads policy from Go via OpenAPI when needed

**Policy storage**: Go backend (event-sourced, immutable events)  
**Go backend**: Both configuration and execution

**Important**: Even in Type C, TypeScript **does NOT store policy in PostgreSQL**. It reads from Go only when necessary, caches locally for performance.

### Universal Six-Phase Process

### Identifying Hardcoded Rules

#### Signs a use case needs refactoring

- Magic numbers in code (`8`, `3`, `60`)
- Hardcoded string arrays (`['director', 'staff']`)
- Decision logic based on fixed constants
- Comments like "tradition is...", "typically...", "standard for..."
- Different funeral homes require different rules but code is identical

#### Audit approach

```bash
# Search for common hardcoding patterns
grep -r "const.*=.*[0-9]" packages/application/src/use-cases/ | grep -v "'[a-z]'"
grep -r "\['" packages/application/src/use-cases/ | grep staffing
grep -r "funeralHomeId.*?funeralHomeId" packages/application/src/use-cases/
```

### Refactoring Process (6 phases)

#### Phase 1: Policy Entity Design (2–4 hours)

**Goal**: Define domain entity for the policy with all configurable parameters.

**Prerequisite**: Determine your use case type (A/B/C from above). If Type C (Go-owned), skip to Phase 4 (no local policy needed).

**Steps**:
1. Audit the use case file:
   - Search for magic numbers: `const X = 48`, `[1, 2, 3]`, hardcoded strings
   - Identify all conditional branches based on fixed values
   - Locate comments like "usually...", "typically...", "industry standard..."
   ```bash
   grep -n "const.*=.*[0-9]" packages/application/src/use-cases/{domain}/{use-case}.ts
   grep -n "if.*<.*[0-9]" packages/application/src/use-cases/{domain}/{use-case}.ts
   ```
2. Group hardcoded values by category (time, counts, flags, strings)
3. Create domain entity with descriptive names (not abbreviations):
   - ❌ `minHrs: 8` → ✅ `minRestHoursBetweenShifts: 8`
   - ❌ `maxStaff: 4` → ✅ `maxStaffPerServiceType: 4`
4. Use Data.Class for immutability (matches rest of codebase)
5. Include SCD2 fields: `version`, `validFrom`, `validTo`, `isCurrent`, `businessKey`, `funeralHomeId`
6. Document each field with JSDoc:
   - Valid range (min/max, allowed values)
   - Business meaning (why this matters)
   - Default/recommended values
   - Domain-specific notes (e.g., "in hours", "per service type", "per director")

**Example: From Any Domain**
```typescript
// Budget approval threshold policy (Financial domain)
export class BudgetApprovalPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;  // funeralHomeId
  readonly funeralHomeId: string;
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  
  // Domain-specific fields
  readonly singleApprovalLimit: number;      // Amounts ≤ this: single approver
  readonly doubleApprovalLimit: number;      // Amounts ≤ this: two approvers
  readonly requireVPApprovalAbove: number;   // Above this: VP approval required
  readonly requireCFOApprovalAbove: number;  // Above this: CFO approval required
  readonly autoApproveUnder: number;         // Below this: auto-approved
}> {}

// Campaign targeting policy (CRM domain)
export class CampaignTargetingPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;  // funeralHomeId
  readonly funeralHomeId: string;
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  
  readonly maxAgeYears: number;           // Don't target over this age
  readonly minDaysFromLoss: number;       // Don't target < this many days from loss
  readonly maxDaysFromLoss: number;       // Don't target > this many days from loss
  readonly requirePriorInteraction: boolean; // Only existing contacts?
  readonly excludeOptedOut: boolean;
}> {}

// Payment posting policy (Financial domain)
export class PaymentPostingPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string;
  readonly funeralHomeId: string;
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  
  readonly applyCreditsFirst: boolean;              // Unused credits → next invoice?
  readonly allowPartialPayments: boolean;          // Accept < full amount?
  readonly requireFullPaymentUnder: number;        // Below this: must be full
  readonly lateFeePercentage: number;              // Monthly late fee
  readonly daysBeforeLate: number;                 // Days overdue before charging fee
  readonly allowChargebackDispute: boolean;        // Accept chargeback disputes?
  readonly autoPostToNextCaseUnder: number;        // Auto-apply unapplied < this
}> {}
```

**Example**:
```typescript
// ✅ CORRECT: Domain entity with SCD2
export class OnCallPolicy extends Data.Class<{
  readonly id: string;
  readonly businessKey: string; // Policy identifier
  readonly version: number;
  readonly validFrom: Date;
  readonly validTo: Date | null;
  readonly isCurrent: boolean;
  readonly funeralHomeId: string; // Per-home isolation
  readonly minAdvanceNoticeHours: number; // 24-72 typical
  readonly maxAdvanceNoticeHours: number;
  readonly minShiftDurationHours: number; // 12-24 typical
  readonly maxShiftDurationHours: number; // 72-168 typical
  readonly maxConsecutiveWeekendsOn: number; // 1-3 typical
  readonly minRestHoursAfterShift: number; // 6-12 typical
  readonly enableFairRotation: boolean;
  readonly maxOnCallPerDirectorPerQuarter: number;
  // ... other fields
}> {}
```

**Anti-pattern**:
```typescript
// ❌ WRONG: Global constants (not per-funeral-home)
export const ON_CALL_MIN_ADVANCE_NOTICE = 48;
export const ON_CALL_MAX_CONSECUTIVE_WEEKENDS = 2;

// ❌ WRONG: Missing SCD2 fields
export interface OnCallPolicy {
  minAdvanceNotice: number; // No versioning, no audit trail
}
```

#### Phase 2: Database Schema & Migration (1–2 hours)

**Goal**: Create Prisma model with SCD2 temporal fields.

**Steps**:
1. Add model to `packages/infrastructure/prisma/schema.prisma`
2. Include ALL SCD2 fields
3. Add `@@unique` for `(businessKey, version)` 
4. Add `@@index` for common queries: `(businessKey, isCurrent)`, `(funeralHomeId, isCurrent)`
5. Create timestamped migration file
6. Run migration: `pnpm --filter @dykstra/infrastructure db:migrate`

**Example Prisma**:
```prisma
model OnCallPolicy {
  id                          String    @id @default(cuid())
  businessKey                 String
  version                     Int       @default(1)
  validFrom                   DateTime  @default(now())
  validTo                     DateTime?
  isCurrent                   Boolean   @default(true)
  funeralHomeId               String
  minAdvanceNoticeHours       Int
  maxAdvanceNoticeHours       Int
  minShiftDurationHours       Int
  maxShiftDurationHours       Int
  maxConsecutiveWeekendsOn    Int
  minRestHoursAfterShift      Int
  enableFairRotation          Boolean   @default(true)
  maxOnCallPerDirectorPerQuarter Int
  createdAt                   DateTime  @default(now())
  updatedAt                   DateTime  @updatedAt
  createdBy                   String
  updatedBy                   String?
  
  @@unique([businessKey, version])
  @@index([businessKey, isCurrent])
  @@index([funeralHomeId, isCurrent])
  @@map("on_call_policies")
}
```

**Anti-pattern**:
```prisma
// ❌ WRONG: Missing SCD2 fields (cannot version or audit)
model OnCallPolicy {
  id                        String @id
  minAdvanceNoticeHours     Int
  // No businessKey, version, validFrom, validTo, isCurrent
}

// ❌ WRONG: No indexes (poor query performance)
model ServiceCoveragePolicy {
  // ... fields
  // Missing @@index for (funeralHomeId, isCurrent)
}
```

#### Phase 3: Repository & Service Layer (2–3 hours)

**Goal**: Implement repository port and optional business service for policy access.

**Steps**:
1. Create repository port in `packages/application/src/ports/`
2. Define methods: `findCurrentByFuneralHome`, `getHistory`, `create`, `update`
3. Create object-based Prisma adapter in `packages/infrastructure/src/database/`
4. Optionally create thin service wrapper in `packages/application/src/services/` for Effect integration
5. Implement SCD2 save logic (close current, insert new version)

**Example Port**:
```typescript
// packages/application/src/ports/on-call-policy-repository.ts
export interface OnCallPolicyRepository {
  readonly findCurrentByFuneralHome: (funeralHomeId: string) => 
    Effect.Effect<OnCallPolicy, NotFoundError | PersistenceError>;
  readonly getHistory: (funeralHomeId: string) => 
    Effect.Effect<OnCallPolicy[], PersistenceError>;
  readonly save: (policy: OnCallPolicy) => 
    Effect.Effect<void, PersistenceError>;
}

export const OnCallPolicyRepository = Context.GenericTag<OnCallPolicyRepository>(
  '@dykstra/OnCallPolicyRepository'
);
```

**Example Adapter** (object-based):
```typescript
// packages/infrastructure/src/database/prisma-on-call-policy-repository.ts
export const PrismaOnCallPolicyRepository: OnCallPolicyRepository = {
  findCurrentByFuneralHome: (funeralHomeId: string) =>
    Effect.tryPromise({
      try: async () => {
        const row = await prisma.onCallPolicy.findFirst({
          where: { funeralHomeId, isCurrent: true }
        });
        if (!row) throw new NotFoundError({ entityType: 'OnCallPolicy', entityId: funeralHomeId });
        return toDomain(row);
      },
      catch: (error) => new PersistenceError('Failed to load policy', error)
    }),
    
  save: (policy: OnCallPolicy) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        await prisma.$transaction(async (tx) => {
          // Close current version
          await tx.onCallPolicy.updateMany({
            where: { businessKey: policy.businessKey, isCurrent: true },
            data: { validTo: now, isCurrent: false }
          });
          // Insert new version
          await tx.onCallPolicy.create({
            data: {
              ...toPrisma(policy),
              version: policy.version + 1,
              validFrom: now,
              isCurrent: true
            }
          });
        });
      },
      catch: (error) => new PersistenceError('Failed to save policy', error)
    })
};
```

**Anti-pattern**:
```typescript
// ❌ WRONG: Class-based repository
export class PrismaOnCallPolicyRepository implements OnCallPolicyRepository {
  constructor(private prisma: PrismaClient) {}
  findCurrentByFuneralHome(funeralHomeId: string) { /* ... */ }
}

// ❌ WRONG: No SCD2 logic in save
save: (policy) => Effect.tryPromise({
  try: async () => {
    await prisma.onCallPolicy.update({ data: toPrisma(policy) }); // Overwrites!
  }
})
```

#### Phase 4: Use Case Refactoring (2–4 hours)

**Goal**: Replace hardcoded rules with policy loaded from repository.

**Steps**:
1. Load policy from repository at start of use case
2. Extract all hardcoded values into variables from policy
3. Pass policy to helper functions instead of magic numbers
4. Ensure policy is loaded ONCE and reused (no repeated queries)
5. Add funeralHomeId to command if not present
6. Validate policy exists before proceeding

**Example Before**:
```typescript
// ❌ Hardcoded rules
export const assignOnCallDirector = (cmd: AssignOnCallDirectorCommand) =>
  Effect.gen(function* () {
    const start = new Date(cmd.startDate);
    const end = new Date(cmd.endDate);
    
    // Hardcoded validation rules
    const minNoticeHours = 48;
    const maxNoticeHours = 72;
    const minRestHours = 8;
    const maxConsecutiveWeekends = 2;
    
    const hoursUntilStart = (start.getTime() - Date.now()) / 3600000;
    if (hoursUntilStart < minNoticeHours) {
      return yield* Effect.fail(new ValidationError({ message: 'Not enough advance notice' }));
    }
    // ... more hardcoded validation
  });
```

**Example After**:
```typescript
// ✅ Policy-driven rules
export const assignOnCallDirector = (cmd: AssignOnCallDirectorCommand) =>
  Effect.gen(function* () {
    // 1. Load policy once
    const policyRepo = yield* OnCallPolicyRepository;
    const policy = yield* policyRepo.findCurrentByFuneralHome(cmd.funeralHomeId);
    
    // 2. Use policy values
    const start = new Date(cmd.startDate);
    const end = new Date(cmd.endDate);
    const hoursUntilStart = (start.getTime() - Date.now()) / 3600000;
    
    if (hoursUntilStart < policy.minAdvanceNoticeHours) {
      return yield* Effect.fail(new ValidationError({ 
        message: `Minimum ${policy.minAdvanceNoticeHours} hours advance notice required` 
      }));
    }
    
    // 3. Pass policy to helpers (don't query again)
    const validationErr = validateOnCallAssignment({
      startDate: cmd.startDate,
      endDate: cmd.endDate,
      policy  // Reuse loaded policy
    });
    if (validationErr) return yield* Effect.fail(validationErr);
    
    // 4. Call Go backend for execution (not policy)
    const goScheduling = yield* GoSchedulingAdapter;
    return yield* goScheduling.createOnCallShift({
      directorId: cmd.directorId,
      startTime: start,
      endTime: end
    });
  });

// Helper function receives policy
function validateOnCallAssignment({
  startDate,
  endDate,
  policy
}: {
  startDate: Date;
  endDate: Date;
  policy: OnCallPolicy;
}): ValidationError | null {
  const duration = (endDate.getTime() - startDate.getTime()) / 3600000;
  if (duration < policy.minShiftDurationHours) {
    return new ValidationError({ message: 'Shift too short' });
  }
  if (duration > policy.maxShiftDurationHours) {
    return new ValidationError({ message: 'Shift too long' });
  }
  return null;
}
```

**Anti-pattern**:
```typescript
// ❌ WRONG: Policy loaded inside loop (N queries)
for (const director of directors) {
  const policy = yield* policyRepo.findCurrentByFuneralHome(cmd.funeralHomeId); // BAD!
}

// ❌ WRONG: Still using hardcoded values alongside policy
const minNoticeHours = 48; // Override policy!
if (hoursUntilStart < minNoticeHours) { /* ... */ }

// ❌ WRONG: Fetching policy from Go backend
const policy = yield* goScheduling.getOnCallPolicy(cmd.funeralHomeId); // Don't do this!
```

#### Phase 5: Add Policy Variation Tests (2–3 hours)

**Goal**: Test use case with multiple policy configurations to ensure rules are actually applied.

**Steps**:
1. Create test policies: restrictive, flexible, edge cases
2. Test each policy variation with same input
3. Verify behavior changes based on policy
4. Test boundary conditions (exactly at limits)
5. Test per-funeral-home isolation (different homes, different policies)

**Example Tests**:
```typescript
// packages/application/src/use-cases/scheduling/__tests__/assign-on-call-director.test.ts

describe('assignOnCallDirector', () => {
  // Restrictive policy (48h notice, 2 consecutive weekends)
  const restrictivePolicy: OnCallPolicy = {
    minAdvanceNoticeHours: 48,
    maxAdvanceNoticeHours: 72,
    maxConsecutiveWeekendsOn: 2,
    minRestHoursAfterShift: 12,
    // ...
  };
  
  // Flexible policy (24h notice, 3 consecutive weekends)
  const flexiblePolicy: OnCallPolicy = {
    minAdvanceNoticeHours: 24,
    maxAdvanceNoticeHours: 120,
    maxConsecutiveWeekendsOn: 3,
    minRestHoursAfterShift: 6,
    // ...
  };
  
  it('rejects assignment with insufficient notice under restrictive policy', async () => {
    const result = await runEffect(
      assignOnCallDirector({
        directorId: 'dir-1',
        startDate: new Date(Date.now() + 24 * 3600000), // 24h from now
        funeralHomeId: 'home-1'
      }),
      Layer.succeed(OnCallPolicyRepository, {
        findCurrentByFuneralHome: () => Effect.succeed(restrictivePolicy)
      })
    );
    
    expect(result.isLeft()).toBe(true);
    expect(result.left.message).toContain('48 hours');
  });
  
  it('accepts assignment with sufficient notice under restrictive policy', async () => {
    const result = await runEffect(
      assignOnCallDirector({
        directorId: 'dir-1',
        startDate: new Date(Date.now() + 48 * 3600000), // 48h from now
        funeralHomeId: 'home-1'
      }),
      Layer.succeed(OnCallPolicyRepository, {
        findCurrentByFuneralHome: () => Effect.succeed(restrictivePolicy)
      })
    );
    
    expect(result.isRight()).toBe(true);
  });
  
  it('accepts assignment with 24h notice under flexible policy', async () => {
    const result = await runEffect(
      assignOnCallDirector({
        directorId: 'dir-1',
        startDate: new Date(Date.now() + 24 * 3600000), // 24h from now
        funeralHomeId: 'home-2'
      }),
      Layer.succeed(OnCallPolicyRepository, {
        findCurrentByFuneralHome: () => Effect.succeed(flexiblePolicy)
      })
    );
    
    expect(result.isRight()).toBe(true);
  });
  
  it('isolates policies by funeral home', async () => {
    // Home 1 with restrictive policy
    const result1 = await runEffect(
      assignOnCallDirector({
        directorId: 'dir-1',
        startDate: new Date(Date.now() + 24 * 3600000),
        funeralHomeId: 'home-1'
      }),
      Layer.succeed(OnCallPolicyRepository, {
        findCurrentByFuneralHome: (homeId) => 
          Effect.succeed(homeId === 'home-1' ? restrictivePolicy : flexiblePolicy)
      })
    );
    
    // Should fail under restrictive
    expect(result1.isLeft()).toBe(true);
    
    // Home 2 with flexible policy
    const result2 = await runEffect(
      assignOnCallDirector({
        directorId: 'dir-1',
        startDate: new Date(Date.now() + 24 * 3600000),
        funeralHomeId: 'home-2'
      }),
      Layer.succeed(OnCallPolicyRepository, {
        findCurrentByFuneralHome: (homeId) => 
          Effect.succeed(homeId === 'home-1' ? restrictivePolicy : flexiblePolicy)
      })
    );
    
    // Should succeed under flexible
    expect(result2.isRight()).toBe(true);
  });
});
```

**Anti-pattern**:
```typescript
// ❌ WRONG: Only testing with one policy (hardcoded behavior still)
it('accepts on-call assignment', () => {
  const result = assignOnCallDirector({ /* ... */ });
  expect(result.isRight()).toBe(true);
  // Doesn't prove the policy is actually being used!
});

// ❌ WRONG: Mock repository but don't test policy variations
mock(OnCallPolicyRepository, { 
  findCurrentByFuneralHome: () => Effect.succeed(somePolicy) 
}); // Always same policy
```

#### Phase 6: Post-Refactoring Validation (1–2 hours)

**Goal**: Ensure refactoring is complete, correct, and doesn't regress functionality.

**Validation Steps**:

1. **TypeScript Compilation**
   ```bash
   pnpm type-check
   ```
   - ✅ Must pass with zero errors
   - Check for any lingering hardcoded references

2. **Unit Tests**
   ```bash
   pnpm test -- packages/application/src/use-cases/scheduling/__tests__/assign-on-call-director.test.ts
   ```
   - ✅ Original tests still pass (backward compatibility)
   - ✅ New policy-variation tests pass (5–8 variations minimum)
   - ✅ 80%+ code coverage

3. **Lint & Code Quality**
   ```bash
   pnpm lint
   ```
   - ✅ No unused imports
   - ✅ No hardcoded magic numbers (rule: define named constants or use policy)
   - ✅ Proper naming conventions

4. **Effect-TS Layer Validation**
   ```bash
   pnpm check:layers
   ```
   - ✅ No `await import()` in Layer definitions
   - ✅ Repository port imported at top of file
   - ✅ All dependencies properly declared

5. **Circular Dependency Check**
   ```bash
   pnpm check:circular
   ```
   - ✅ No new circular dependencies introduced

6. **Architecture Boundary Check**
   - ✅ No Prisma imports in application or domain layers
   - ✅ No business logic in infrastructure adapters
   - ✅ Policy accessed via port only (not direct Prisma)

7. **Database Migration Validation**
   ```bash
   pnpm --filter @dykstra/infrastructure db:push
   ```
   - ✅ Migration applies cleanly
   - ✅ Schema matches Prisma model
   - ✅ Indexes created correctly

8. **SCD2 Pattern Verification**
   - ✅ Repository correctly closes old version before inserting new
   - ✅ `validFrom`, `validTo`, `isCurrent` fields set correctly
   - ✅ Query always filters `isCurrent: true` for current version

9. **Integration Tests** (if applicable)
   ```bash
   pnpm test -- integration/
   ```
   - ✅ End-to-end workflow still works
   - ✅ Go backend integration unchanged

10. **Manual Smoke Test**
    - [ ] Create/update policy via tRPC endpoint
    - [ ] Verify use case applies new policy
    - [ ] Verify SCD2 version history is retained
    - [ ] Test per-funeral-home isolation (different homes, different policies)

### Anti-Patterns to Avoid

#### 1. Global Constants Instead of Policies
```typescript
// ❌ WRONG
export const DEFAULT_MIN_REST_HOURS = 8;
export const SERVICE_TYPES = ['traditional', 'cremation'];

// ✅ CORRECT
// Load from policy repository, scoped to funeral home
```

#### 2. Policy in Go Backend
```typescript
// ❌ WRONG
const policy = yield* goScheduling.getOnCallPolicy(funeralHomeId);

// ✅ CORRECT
const policy = yield* policyRepository.findCurrentByFuneralHome(funeralHomeId);
```

#### 3. Missing SCD2 Fields
```typescript
// ❌ WRONG
model ServiceCoveragePolicy {
  id String @id
  minRestHours Int
  // Missing: businessKey, version, validFrom, validTo, isCurrent
}

// ✅ CORRECT
model ServiceCoveragePolicy {
  id String @id
  businessKey String
  version Int @default(1)
  validFrom DateTime @default(now())
  validTo DateTime?
  isCurrent Boolean @default(true)
  minRestHours Int
}
```

#### 4. Class-Based Repository
```typescript
// ❌ WRONG
export class PrismaPolicyRepository implements PolicyRepository {
  constructor(private prisma: PrismaClient) {}
}

// ✅ CORRECT
export const PrismaPolicyRepository: PolicyRepository = {
  findCurrentByFuneralHome: (homeId) => Effect.tryPromise(/* ... */)
};
```

#### 5. Policy Loaded Multiple Times
```typescript
// ❌ WRONG
for (const director of directors) {
  const policy = yield* repo.findCurrentByFuneralHome(homeId); // N queries!
  // use policy
}

// ✅ CORRECT
const policy = yield* repo.findCurrentByFuneralHome(homeId); // 1 query
for (const director of directors) {
  // use policy
}
```

#### 6. No Policy Variation Tests
```typescript
// ❌ WRONG
it('works correctly', () => {
  const result = useCase({ /* ... */ });
  expect(result.isRight()).toBe(true);
  // Doesn't test if policy is actually applied
});

// ✅ CORRECT
it('respects restrictive policy', () => { /* test with policy A */ });
it('respects flexible policy', () => { /* test with policy B */ });
it('isolates by funeral home', () => { /* test multi-home */ });
```

#### 7. Hardcoded Values in Helpers
```typescript
// ❌ WRONG
function validateShift(start, end) {
  const minHours = 12; // Hardcoded!
  if (duration < minHours) return error;
}

// ✅ CORRECT
function validateShift(start, end, policy: Policy) {
  if (duration < policy.minShiftDurationHours) return error;
}
```

#### 8. Missing Per-Funeral-Home Scoping
```typescript
// ❌ WRONG
const policies = await prisma.policy.findMany(); // All homes!

// ✅ CORRECT
const policy = await prisma.policy.findFirst({
  where: { funeralHomeId: cmd.funeralHomeId, isCurrent: true }
});
```

### Refactoring Checklist (Universal)

**Before starting**: Identify use case type (A/B/C). Skip phases 1-3 if Type C (Go-owned).

**For each hardcoded use case** in any domain:

- [ ] **Phase 1** (Type A/B only): Domain entity designed
  - [ ] All hardcoded values extracted
  - [ ] SCD2 fields included (version, validFrom, validTo, isCurrent, businessKey)
  - [ ] funeralHomeId for per-home isolation
  - [ ] JSDoc documentation on each field
  - [ ] Domain entity exported from `packages/domain/src/index.ts`
- [ ] **Phase 2** (Type A/B only): Database schema & migration
  - [ ] Prisma model added to `schema.prisma`
  - [ ] All SCD2 fields present
  - [ ] Indexes created: `(businessKey, isCurrent)`, `(funeralHomeId, isCurrent)`
  - [ ] Migration file created and timestamped
  - [ ] Migration runs cleanly: `pnpm --filter @dykstra/infrastructure db:push`
- [ ] **Phase 3** (Type A/B only): Repository & service layer
  - [ ] Port interface defined in `packages/application/src/ports/`
  - [ ] Methods: `findCurrentByFuneralHome`, `getHistory`, `save`
  - [ ] Object-based (NOT class-based) Prisma adapter in `packages/infrastructure/src/database/`
  - [ ] SCD2 save logic implemented (close old version, insert new)
  - [ ] Repository exported from `packages/application/src/index.ts`
- [ ] **Phase 4**: Use case refactored
  - [ ] Policy loaded from repository at start (NOT from Go or hardcoded)
  - [ ] All hardcoded values replaced with policy fields
  - [ ] Policy loaded ONCE and reused (no repeated queries)
  - [ ] Helper functions parameterized with policy (passed as argument)
  - [ ] funeralHomeId added to command input (if not present)
  - [ ] Per-funeral-home isolation enforced in all queries
- [ ] **Phase 5**: Policy variation tests (3–8 tests minimum)
  - [ ] Restrictive policy test (tight limits)
  - [ ] Flexible policy test (loose limits)
  - [ ] Edge case/boundary tests
  - [ ] Per-funeral-home isolation test (different homes, different policies)
  - [ ] All new tests passing
  - [ ] Original tests still passing (backward compatibility)
- [ ] **Phase 6**: Full validation suite
  - [ ] `pnpm type-check` ✅ (zero errors)
  - [ ] `pnpm test` ✅ (original + new tests, 80%+ coverage)
  - [ ] `pnpm lint` ✅ (no hardcoded numbers, proper naming)
  - [ ] `pnpm check:layers` ✅ (no await import in Layer definitions)
  - [ ] `pnpm check:circular` ✅ (no new circular deps)
  - [ ] Architecture boundaries ✅ (no Prisma in application/domain)
  - [ ] Database migration ✅ (applies cleanly, indexes exist)
  - [ ] SCD2 pattern ✅ (old version closed, new version created)
  - [ ] Per-funeral-home isolation ✅ (verified in tests)
  - [ ] Integration tests ✅ (if applicable)
- [ ] **Documentation**:
  - [ ] WARP.md updated with refactoring status
  - [ ] Policy fields documented with examples
  - [ ] Use case updated if behavior changed
  - [ ] JSDoc comments on new repository methods
  - [ ] Notes on per-funeral-home configuration requirements

### Success Criteria (Universal)

**Refactoring is complete when ALL of the following are true**:

1. ✅ **All hardcoded values replaced**
   - No magic numbers in use case logic
   - All thresholds, limits, rates, counts sourced from policy
   - Conditional branches driven by policy flags, not hardcoded values

2. ✅ **Policy storage correct for use case type**
   - Type A: Stored in TypeScript/PostgreSQL with SCD2 versioning
   - Type B: Stored in TypeScript/PostgreSQL with SCD2 versioning (execution in Go)
   - Type C: NOT stored in TypeScript; read from Go only when needed

3. ✅ **Policy loaded once, reused throughout**
   - Single repository query per use case invocation
   - Policy passed to helper functions (not re-queried)
   - No repeated `findCurrentByFuneralHome` calls

4. ✅ **Helper functions parameterized**
   - All validation functions receive policy as parameter
   - No hardcoded constants in helpers
   - Helpers are domain-pure (no repository access)

5. ✅ **Comprehensive policy variation tests**
   - Minimum 3-8 tests covering different policy configurations
   - Restrictive, flexible, and edge case scenarios
   - Per-funeral-home isolation proven (different homes, different behavior)
   - Original tests still pass (backward compatibility)

6. ✅ **Per-funeral-home isolation working**
   - All policy queries scoped by `funeralHomeId`
   - Different funeral homes can have different policies
   - No global defaults affecting other funeral homes
   - funeralHomeId included in command input

7. ✅ **Zero architecture errors**
   - `pnpm type-check`: Zero TypeScript errors
   - `pnpm lint`: No hardcoded numbers/magic values
   - `pnpm check:layers`: No forbidden imports (Prisma in domain/application)
   - `pnpm check:circular`: No new circular dependencies

8. ✅ **Database correct**
   - Migration applies cleanly
   - SCD2 fields present and functional
   - Indexes created for performance
   - Data types match domain entity

9. ✅ **SCD2 pattern verified**
   - Old versions closed (validTo set, isCurrent = false)
   - New versions created atomically (validFrom set, version incremented)
   - Queries always filter `isCurrent: true` for current version
   - History queries work correctly

10. ✅ **Integration unchanged (if applicable)**
    - Type B: Go backend still called for execution, unchanged
    - Go receives only validated data, never fetches policy from TypeScript
    - No new dependencies on Go for policy storage

11. ✅ **Documentation updated**
    - WARP.md lists refactored use case with completion date
    - Policy structure documented with example values
    - Per-funeral-home configuration documented
    - Link to relevant test file for reference

### Quick Decision Tree: When Is Refactoring Done?

```
Is the use case domain-agnostic?
  YES → Ask "Does this need configuration?"
  NO → Refactoring IS done

Does this need configuration?
  NO → Refactoring IS done
  YES → Ask "Who owns the rules?"

Who owns the rules?
  TypeScript (Type A/B) → Check all 11 success criteria above
  Go backend (Type C) → Check only: policy NOT in TS/PG, proper retrieval from Go, Type C validations
```

### Use Case Tagging & Inventory Best Practices

#### Overview

As you refactor 50+ use cases across 10+ domains, tracking which ones are HARDCODED, IN PROGRESS, or CONFIGURABLE becomes critical for project management and code review. This section documents a lightweight, automated tagging system that lives in code (not in external spreadsheets).

#### JSDoc Header Pattern (REQUIRED for all use cases)

Every use case file must include a JSDoc header with standardized fields. This is the single source of truth for use case metadata.

**Location**: Top of file, above the main export function.

**Required fields**:
- `Policy Type`: A, B, or C (or N/A if no policy needed)
- `Refactoring Status`: HARDCODED, IN PROGRESS, or CONFIGURABLE
- `Policy Entity`: Name of the policy class (e.g., OnCallPolicy) or N/A
- `Persisted In`: Where policy is stored (TypeScript/PostgreSQL, Go Backend, N/A)
- `Go Backend`: YES or NO (required for execution)
- `Per-Funeral-Home`: YES or NO (is behavior scoped per funeral home?)
- `Test Coverage`: Number of tests or percentage
- `Last Updated`: Date refactoring was completed (or N/A if hardcoded)

**Example: Already-Refactored Use Case (Type B, CONFIGURABLE)**

```typescript
/**
 * Assign an on-call director for death call coverage.
 *
 * Policy Type: Type B (Configuration-Driven Execution)
 * Refactoring Status: ✅ CONFIGURABLE
 * Policy Entity: OnCallPolicy
 * Persisted In: TypeScript/PostgreSQL (SCD2 versioning)
 * Go Backend: YES (shift creation only)
 * Per-Funeral-Home: YES
 * Test Coverage: 28 tests (20 original + 8 policy variations)
 * Last Updated: 2025-12-01
 *
 * @param command - Command with directorId, startDate, endDate, funeralHomeId
 * @returns Effect with shift creation result or validation error
 */
export const assignOnCallDirector = (cmd: AssignOnCallDirectorCommand) =>
  Effect.gen(function* () {
    // Implementation...
  });
```

**Example: Hardcoded Use Case (Needs Refactoring)**

```typescript
/**
 * Process a customer payment application.
 *
 * Policy Type: Type B (Configuration-Driven Execution)
 * Refactoring Status: 🔴 HARDCODED
 * Policy Entity: N/A (hardcoded rules)
 * Persisted In: N/A
 * Go Backend: YES (GL posting)
 * Per-Funeral-Home: YES
 * Test Coverage: 12 tests
 * Last Updated: N/A
 *
 * ⚠️  TODO: Extract hardcoded payment rules into PaymentPolicy entity
 *  - Apply credits first (hardcoded behavior)
 *  - Partial payment limit (currently $100 minimum)
 *  - Late fee calculation (currently 1.5% monthly)
 *  - Auto-post threshold (currently $50 unused)
 */
export const processPaymentApplication = (cmd: ProcessPaymentCommand) =>
  Effect.gen(function* () {
    // Implementation with hardcoded values...
  });
```

**Example: In-Progress Refactoring**

```typescript
/**
 * Create a purchase order when inventory falls below threshold.
 *
 * Policy Type: Type B (Configuration-Driven Execution)
 * Refactoring Status: 🟡 IN PROGRESS
 * Policy Entity: ProcurementPolicy (domain entity created, 80% of refactoring complete)
 * Persisted In: TypeScript/PostgreSQL (SCD2)
 * Go Backend: YES (PO creation)
 * Per-Funeral-Home: YES
 * Test Coverage: 18 tests (10 original + 8 new policy variation tests)
 * Last Updated: In progress (target 2025-12-08)
 *
 * Phase Status: 1✅ 2✅ 3✅ 4🟡 (use case refactoring 75% done) 5❌ 6❌
 */
export const createPurchaseOrder = (cmd: CreatePOCommand) =>
  Effect.gen(function* () {
    // Partial implementation...
  });
```

#### CI Validation Rules

**All use case files must have the JSDoc header.** CI will enforce these rules:

1. **Header presence**: Every file in `packages/application/src/use-cases/**/*.ts` (excluding `__tests__/`) must have a JSDoc header.
2. **Field presence**: All 8 required fields must be present.
3. **Valid values**:
   - `Policy Type`: A, B, C, or N/A
   - `Refactoring Status`: HARDCODED, IN PROGRESS, or CONFIGURABLE
   - `Go Backend`: YES or NO
   - `Per-Funeral-Home`: YES or NO
4. **Type-specific invariants**:
   - Type A: `Go Backend: NO`
   - Type B: `Go Backend: YES`, `Persisted In: TypeScript/PostgreSQL`
   - Type C: `Persisted In: Go Backend`
   - CONFIGURABLE: `Persisted In` must not be N/A
5. **Status coherence**:
   - HARDCODED: `Policy Entity: N/A`, `Persisted In: N/A`
   - CONFIGURABLE: `Policy Entity` must not be N/A, `Persisted In` must not be N/A
   - IN PROGRESS: `Policy Entity` should not be N/A

#### Auto-Inventory Script

A Bash script scans all use cases and generates a markdown report per domain, showing refactoring progress, policy types, and test coverage.

**Usage**:
```bash
./scripts/scan-use-case-status.sh                    # Print to stdout
./scripts/scan-use-case-status.sh > REFACTORING_STATUS.md  # Save to file
```

**Output**: Markdown table with columns:
- Use Case (file path)
- Policy Type
- Status
- Policy Entity
- Backend
- Per-Home
- Tests
- Last Updated

#### PR Template

When submitting PRs that refactor use cases, include these fields in the PR description:

```markdown
## Refactoring Details
- **Use Case(s)**: `packages/application/src/use-cases/scheduling/assign-on-call-director.ts`
- **Policy Type**: B (Configuration-Driven Execution)
- **Refactoring Phase**: 1 → 6 (Complete)
- **Policy Entity**: OnCallPolicy
- **Tests Added**: 8 policy variation tests
- **Link**: [OnCallPolicy entity](packages/domain/src/entities/scheduling/on-call-policy.ts)

## Validation Checklist
- [ ] JSDoc header updated with all fields
- [ ] Status set to CONFIGURABLE
- [ ] All 6 phases complete
- [ ] Policy variation tests passing
- [ ] `pnpm validate` passes
```

#### Tracking Progress

**Run the inventory script monthly** (or before major releases):

```bash
# Generate current status
./scripts/scan-use-case-status.sh > docs/USE_CASE_STATUS.md

# Compare to previous month
git diff docs/USE_CASE_STATUS.md
```

**Metrics to track**:
- Total use cases
- % CONFIGURABLE (goal: 100%)
- % IN PROGRESS
- % HARDCODED (goal: 0%)
- Average test coverage per use case
- Domains by completion % (e.g., Scheduling: 100%, Financial: 67%, CRM: 25%)

#### Example Status Report

```markdown
# Use Case Refactoring Status

Generated: 2025-12-15

## Overall Progress
- ✅ CONFIGURABLE: 26/52 (50%)
- 🟡 IN PROGRESS: 8/52 (15%)
- 🔴 HARDCODED: 18/52 (35%)

## By Domain

### Scheduling (9 use cases)
| Use Case | Type | Status | Tests |
|----------|------|--------|-------|
| assignOnCallDirector | B | ✅ | 28 |
| assignServiceCoverage | B | 🟡 | 18 |
| assignEmbalmerShift | B | 🟡 | 19 |
| checkDriverAvailability | B | ✅ | 12 |
| recordMileage | A | ✅ | 8 |
| ... | ... | ... | ... |

### Financial (14 use cases)
| Use Case | Type | Status | Tests |
|----------|------|--------|-------|
| processPayment | B | 🔴 | 12 |
| processRefund | A | 🔴 | 10 |
| monthEndClose | B | 🟡 | 15 |
| ... | ... | ... | ... |

### Payroll (6 use cases)
| Use Case | Type | Status | Tests |
|----------|------|--------|-------|
| createPayrollRun | B | 🟡 | 22 |
| ... | ... | ... | ... |
```

---

### Real-World Examples: Six-Phase Process Across Domains

These examples show how the same six-phase process applies to completely different use cases:

#### Example 1: Scheduling Domain (Type B: Config + Go Execution)
**Use case**: `assignOnCallDirector` (currently hardcoded)

- **Phase 1**: `OnCallPolicy` entity with minAdvanceNoticeHours, maxConsecutiveWeekendsOn, etc.
- **Phase 2**: `on_call_policies` table with SCD2 versioning
- **Phase 3**: `OnCallPolicyRepository` port + `PrismaOnCallPolicyRepository` adapter
- **Phase 4**: Load policy → validate locally → call Go scheduling endpoint
- **Phase 5**: Test restrictive (48h) vs flexible (24h) policies
- **Phase 6**: All tests pass, SCD2 working, per-home isolation verified

#### Example 2: Financial Domain (Type A: Local-Only)
**Use case**: `processRefund` (currently hardcoded "always refund to original method")

- **Phase 1**: `RefundPolicy` entity with allowRefundToCheck, allowRefundToCard, maxRefundAmount, requireApprovalAbove, etc.
- **Phase 2**: `refund_policies` table with SCD2 versioning
- **Phase 3**: `RefundPolicyRepository` port + adapter
- **Phase 4**: Load policy → use policy flags to decide refund method → post GL entry locally
- **Phase 5**: Test strict policy (only original method) vs flexible (any method)
- **Phase 6**: Zero type errors, all tests pass

#### Example 3: Payroll Domain (Type B: Config + Go Execution)
**Use case**: `createPayrollRun` (currently hardcoded overtime = 60h/week)

- **Phase 1**: `PayrollPolicy` entity with overtimeThresholdHours, overtimeMultiplier, taxWithholdingMethod, etc.
- **Phase 2**: `payroll_policies` table with SCD2 versioning
- **Phase 3**: `PayrollPolicyRepository` port + adapter
- **Phase 4**: Load policy → validate timesheets against policy limits → call Go payroll endpoint
- **Phase 5**: Test standard (60h) vs aggressive (48h) overtime policies
- **Phase 6**: All validations pass, SCD2 working

#### Example 4: CRM Domain (Type A: Local-Only)
**Use case**: `sendCampaign` (currently hardcoded "only to contacts in last 90 days")

- **Phase 1**: `CampaignTargetingPolicy` entity with minDaysFromLoss, maxDaysFromLoss, requirePriorInteraction, etc.
- **Phase 2**: `campaign_targeting_policies` table with SCD2 versioning
- **Phase 3**: `CampaignTargetingPolicyRepository` port + adapter
- **Phase 4**: Load policy → filter contacts by policy rules → send campaign locally
- **Phase 5**: Test aggressive targeting (30-120 days) vs conservative (60-365 days)
- **Phase 6**: No Go involvement, all local

#### Example 5: Procurement Domain (Type B: Config + Go Execution)
**Use case**: `createPurchaseOrder` (currently hardcoded "order when quantity < 10")

- **Phase 1**: `ProcurementPolicy` entity with reorderPoint, safetyStockDays, autoOrderQuantity, requireApprovalAbove, etc.
- **Phase 2**: `procurement_policies` table with SCD2 versioning
- **Phase 3**: `ProcurementPolicyRepository` port + adapter
- **Phase 4**: Load policy → calculate quantities using policy rules → call Go procurement endpoint
- **Phase 5**: Test JIT (reorderPoint=5) vs buffer stock (reorderPoint=30)
- **Phase 6**: Go backend unchanged, only TypeScript policy config added

**Key insight**: The six phases are identical regardless of domain. Only the policy fields change.

---

## Version History

- **v1.1** (2025-11-29): Go ERP integration documented
  - Dual backend strategy (TypeScript CRM + Go ERP)
  - Separate PostgreSQL databases (schema isolation)
  - BFF proxy pattern for Go integration
  - OpenAPI client adapter pattern
  - Cross-domain use case orchestration
  - Unified UI architecture
  - CI boundary enforcement

- **v1.0** (2025-11-26): Initial architecture documentation
  - Clean Architecture patterns established
  - SCD2 temporal pattern documented
  - Object-based repository pattern enforced
  - All 272 TypeScript errors resolved

---

## Questions?

When in doubt:
1. Check this document first
2. Look at existing implementations in the codebase
3. Prefer object-based over class-based
4. Keep business logic in domain entities
5. Keep layers strictly separated
6. **For Go integration**: Use ports/adapters, proxy via BFF, never access Go infrastructure directly

**Remember**: Architecture discipline prevents technical debt!
