# ADR 003: Effect-TS for Business Logic

**Status**: Accepted  
**Date**: November 2025 (Prior to Phase 2)  
**Deciders**: Architecture Team  
**Context**: Clean Architecture Implementation

## Context and Problem Statement

Business logic layer needed:
- Type-safe error handling (not try/catch)
- Dependency injection without classes
- Composable async operations
- Testable side effects
- Domain-driven design patterns

Traditional approaches (Redux, MobX, classes) didn't align with functional Clean Architecture principles.

## Decision Drivers

- **Type Safety**: Errors as part of function signatures
- **Composability**: Combine async operations declaratively
- **Testability**: Mock dependencies without DI containers
- **Functional Purity**: No side effects in domain layer
- **Performance**: Lazy evaluation and efficient composition

## Considered Options

1. **Effect-TS** (Selected)
2. fp-ts (functional programming primitives)
3. Traditional Promises with error handling
4. Redux Toolkit + RTK Query

## Decision Outcome

**Chosen**: Effect-TS for application and domain layers

Effect-TS provides:
- `Effect<Success, Error, Dependencies>` for typed async operations
- `Context` for dependency injection (zero runtime overhead)
- `Layer` for service composition
- `Schema` for runtime validation (Zod-like)
- Railway-oriented programming patterns

### Implementation Pattern

**Domain Layer** (Pure business logic):
```typescript
// Pure function - zero dependencies
export const calculateContractTotal = (
  services: ServiceItem[],
  discount: number
): number => {
  const subtotal = services.reduce((sum, s) => sum + s.price, 0);
  return subtotal * (1 - discount);
};
```

**Application Layer** (Use cases with ports):
```typescript
import { Effect, Context } from 'effect';

// Port interface (dependency)
export interface ContractPort {
  readonly save: (contract: Contract) => Effect.Effect<
    Contract,
    DatabaseError,
    never
  >;
}

export const ContractPort = Context.GenericTag<ContractPort>('@dykstra/ContractPort');

// Use case (depends on port)
export const createContract = (data: ContractData) =>
  Effect.gen(function* (_) {
    const contractPort = yield* _(ContractPort);
    const total = calculateContractTotal(data.services, data.discount);
    
    const contract: Contract = { ...data, total };
    
    return yield* _(contractPort.save(contract));
  });
```

**Infrastructure Layer** (Adapters):
```typescript
// Adapter implements port
export const PrismaContractAdapter: ContractPort = {
  save: (contract) =>
    Effect.tryPromise({
      try: async () => await prisma.contract.create({ data: contract }),
      catch: (error) => new DatabaseError('Failed to save contract', error)
    })
};

// Layer wires port to adapter
export const ContractPortLayer = Layer.succeed(ContractPort, PrismaContractAdapter);
```

### Results

**Phases 3-7 Implementation**:
- **280 tests** using Effect-TS patterns (all passing)
- **26/47 critical use cases** complete (55% progress)
- **21 Go backend ports** with Effect-based adapters
- **142 port methods** with typed error handling
- **Zero try/catch blocks** in domain/application layers

### Positive Consequences

- **Type-Safe Errors**: `Effect<Data, NetworkError | ValidationError>` (compiler-enforced handling)
- **Testable**: Mock ports via `Layer.succeed(Port, mockImplementation)`
- **Composable**: Chain operations with `pipe()` and `Effect.gen()`
- **Performance**: Lazy evaluation prevents unnecessary work
- **Clean Architecture**: Perfect alignment with domain/application/infrastructure layers

### Negative Consequences

- **Learning Curve**: Effect-TS concepts (Effect, Context, Layer) unfamiliar to React developers
- **Bundle Size**: Effect-TS runtime (~50KB minified+gzipped)
- **Ecosystem**: Smaller community vs. Redux/MobX
- **Debugging**: Stack traces less intuitive than Promises

## Validation

**Production Usage** (Phases 3-7):
- ✅ 4/4 Payroll use cases (biweekly calculation, direct deposit, journal entries, W-2)
- ✅ 4/4 Time & Attendance use cases (time entry, approval, PTO, overtime)
- ✅ 7/7 Procurement use cases (PO creation, receipts, returns, adjustments)
- ✅ 7/8 Accounts Payable use cases (insurance claims, payments, refunds, vendor bills)
- ✅ 4/12 Staff Scheduling use cases (on-call rotation, service coverage, embalmer shifts, swaps)

**Test Coverage**:
- 280 tests passing (zero failures)
- Effect-based mocking in all test suites
- Validation, business rules, error handling, edge cases

**Developer Feedback**:
- Clean separation between layers (domain never imports Effect)
- Dependency injection without classes (object-based adapters)
- Consistent error handling patterns across 21 Go backend ports

## Migration Path

**For New Features**:
1. Domain layer: Pure functions (no Effect)
2. Application layer: Effect-based use cases with ports
3. Infrastructure layer: Effect-based adapters
4. UI layer: `runPromise()` to integrate with React hooks

**For Existing Code**:
- Phase 2 (Presentation Layer): No Effect-TS needed (ViewModels are pure functions)
- Phase 4 (Forms): Will integrate Effect-TS for validation
- Phase 5 (State Management): Will use Effect for async state

## Related Decisions

- [ADR 001: ViewModel Pattern](./001-viewmodel-pattern.md) - Presentation layer (no Effect-TS)
- [ADR 002: Feature Module Structure](./002-feature-module-structure.md) - How to organize Effect-based code

## References

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Clean Architecture guidelines
- [Go Backend Integration Playbook](../GO_BACKEND_INTEGRATION_PLAYBOOK.md) - Effect-TS with Go adapters
- [Implementation Plan](../Implementation%20Plan_%20Remaining%2020%20Critical%20Use%20Cases.md)
- [Effect-TS Documentation](https://effect.website)
