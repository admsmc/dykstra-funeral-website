# Clean Architecture Guidelines

> **Critical**: This document defines the architectural standards for this codebase. All developers and AI agents MUST follow these patterns.

## Table of Contents
- [Overview](#overview)
- [Layer Boundaries](#layer-boundaries)
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

## Version History

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

**Remember**: Architecture discipline prevents technical debt!
