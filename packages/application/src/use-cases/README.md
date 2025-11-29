# Use Cases

This directory contains **application use cases** that orchestrate domain logic and infrastructure adapters following Clean Architecture principles.

## Architecture Pattern

Use cases are the **entry points** for application operations. They:

1. **Orchestrate** multiple domain operations and port calls
2. **Validate** business rules and preconditions
3. **Coordinate** across bounded contexts (TypeScript CRM + Go ERP)
4. **Handle errors** with Effect-TS error unions
5. **Return results** with explicit success/failure types

## Effect-TS Pattern

All use cases use **Effect.gen** for sequential async orchestration:

```typescript
export const myUseCase = (command: Command): Effect.Effect<Result, Error, Dependencies> =>
  Effect.gen(function* () {
    // 1. Access dependencies
    const repo = yield* Repository;
    const port = yield* Port;
    
    // 2. Load data
    const entity = yield* repo.findById(command.id);
    
    // 3. Validate
    if (!entity) {
      return yield* Effect.fail(new NotFoundError({...}));
    }
    
    // 4. Execute domain logic
    const result = yield* entity.doSomething();
    
    // 5. Call external services via ports
    const externalResult = yield* port.callApi(result);
    
    // 6. Persist changes
    yield* repo.save(entity);
    
    // 7. Return result
    return { entity, externalResult };
  });
```

## Cross-Domain Orchestration

### Pattern: TypeScript → Go Integration

Many use cases orchestrate between:
- **TypeScript Domain** (CRM: leads, contacts, cases)
- **Go Domain** (ERP: contracts, financials, inventory, payroll)

**Example**: Convert lead to case with contract

```typescript
export const convertLeadToCaseWithContract = (command): Effect =>
  Effect.gen(function* () {
    // TypeScript Domain
    const leadRepo = yield* LeadRepository;
    const caseRepo = yield* CaseRepository;
    
    // Load lead (TypeScript)
    const lead = yield* leadRepo.findByBusinessKey(command.leadBusinessKey);
    
    // Create case (TypeScript)
    const case_ = yield* caseRepo.save(newCase);
    
    // Go Domain via Port
    const goContractPort = yield* GoContractPort;
    
    // Create contract (Go)
    const contract = yield* goContractPort.createContract({
      caseId: case_.businessKey,
      services: command.services,
      products: command.products,
    });
    
    // Link TypeScript ↔ Go
    const caseWithContract = {
      ...case_,
      metadata: { goContractId: contract.id },
    };
    
    yield* caseRepo.update(caseWithContract);
    
    return { lead, case: caseWithContract, contract };
  });
```

### Key Principles

1. **Port Abstraction**: Go backend always accessed via ports (never direct HTTP)
2. **Linking**: Store foreign keys in metadata (e.g., `goContractId` in TypeScript case)
3. **Error Handling**: Use Effect error unions (`NotFoundError | NetworkError | ValidationError`)
4. **Sequential Operations**: Use `yield*` for operations that depend on previous results
5. **Batch Operations**: Can parallelize independent operations with `Effect.all`

## Common Patterns

### 1. Load-Validate-Execute-Persist

```typescript
Effect.gen(function* () {
  // Load
  const entity = yield* repo.findById(id);
  
  // Validate
  if (!entity) return yield* Effect.fail(new NotFoundError({...}));
  if (entity.status !== 'active') return yield* Effect.fail(new ValidationError({...}));
  
  // Execute
  const result = yield* entity.performAction();
  
  // Persist
  yield* repo.save(entity);
  
  return result;
});
```

### 2. Multi-Step Orchestration

```typescript
Effect.gen(function* () {
  // Step 1: TypeScript domain
  const case_ = yield* caseRepo.findByBusinessKey(caseId);
  
  // Step 2: Go inventory
  const reservation = yield* goInventoryPort.reserveInventory({...});
  
  // Step 3: Go financial
  const payment = yield* goFinancialPort.recordPayment({...});
  
  // Step 4: Link all together
  const updatedCase = {
    ...case_,
    metadata: {
      reservationId: reservation.id,
      paymentId: payment.id,
    },
  };
  
  yield* caseRepo.update(updatedCase);
  
  return { case: updatedCase, reservation, payment };
});
```

### 3. Parallel Operations (Independent)

```typescript
Effect.gen(function* () {
  // Execute in parallel (no dependencies)
  const [contract, inventory, notification] = yield* Effect.all([
    goContractPort.getContract(contractId),
    goInventoryPort.checkAvailability(itemId),
    emailPort.send(email),
  ]);
  
  return { contract, inventory, notification };
});
```

### 4. Conditional Branching

```typescript
Effect.gen(function* () {
  const case_ = yield* caseRepo.findById(id);
  
  if (case_.type === 'at_need') {
    // Immediate processing
    const contract = yield* goContractPort.createContract({...});
    return { type: 'immediate', contract };
  } else {
    // Pre-need processing
    const subscription = yield* goSubscriptionPort.create({...});
    return { type: 'preneed', subscription };
  }
});
```

## Error Handling

### Error Union Types

Use cases declare all possible errors in their Effect signature:

```typescript
export const myUseCase = (command: Command): Effect.Effect<
  Result,
  NotFoundError | ValidationError | NetworkError | PersistenceError,  // ← Error union
  Dependencies
> => ...
```

### Throwing Errors

Use `Effect.fail` to return errors:

```typescript
if (!entity) {
  return yield* Effect.fail(
    new NotFoundError({
      message: 'Entity not found',
      entityType: 'Case',
      entityId: command.id,
    })
  );
}
```

### Error Recovery

Use `Effect.catchTag` for recovery:

```typescript
const result = yield* goContractPort.getContract(id).pipe(
  Effect.catchTag('NotFoundError', () => 
    Effect.succeed({ id, status: 'not_found' })
  )
);
```

## Testing Use Cases

### Unit Testing with Mocked Dependencies

```typescript
import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { convertLeadToCaseWithContract } from './convert-lead-to-case-with-contract';

describe('convertLeadToCaseWithContract', () => {
  it('should convert lead to case and create contract', async () => {
    // Mock layers
    const mockLeadRepo = Layer.succeed(LeadRepository, {
      findByBusinessKey: (key) => Effect.succeed(mockLead),
      update: (lead) => Effect.succeed(lead),
    });
    
    const mockCaseRepo = Layer.succeed(CaseRepository, {
      save: (case_) => Effect.succeed(case_),
      update: (case_) => Effect.succeed(case_),
    });
    
    const mockGoContractPort = Layer.succeed(GoContractPort, {
      createContract: (cmd) => Effect.succeed(mockContract),
    });
    
    const testLayer = Layer.mergeAll(
      mockLeadRepo,
      mockCaseRepo,
      mockGoContractPort
    );
    
    const result = await Effect.runPromise(
      convertLeadToCaseWithContract(command).pipe(
        Effect.provide(testLayer)
      )
    );
    
    expect(result.lead.status).toBe('converted');
    expect(result.contract.id).toBeDefined();
  });
});
```

### Integration Testing

```typescript
// Use real infrastructure layer for integration tests
const result = await Effect.runPromise(
  convertLeadToCaseWithContract(command).pipe(
    Effect.provide(InfrastructureLayer)
  )
);
```

## Directory Structure

```
use-cases/
├── README.md (this file)
│
├── case-management/
│   ├── convert-lead-to-case.ts                    # TypeScript only
│   ├── convert-lead-to-case-with-contract.ts     # TypeScript + Go
│   ├── update-case-status.ts
│   ├── get-financial-summary.ts
│   └── get-audit-log.ts
│
├── financial/
│   ├── process-case-payment.ts                    # TypeScript + Go AR
│   └── get-case-balance.ts                        # Query: TS + Go
│
├── inventory/
│   ├── reserve-inventory-for-case.ts              # Go Inventory
│   └── release-inventory-for-case.ts
│
├── contracts/
│   ├── catalog-queries.ts
│   ├── contract-operations.ts
│   └── template-operations.ts
│
├── leads/
│   ├── create-lead.ts
│   └── convert-lead-to-case.ts
│
├── contacts/
│   ├── find-duplicates.ts
│   └── merge-contacts.ts
│
├── payments/
│   ├── record-manual-payment.ts
│   ├── process-refund.ts
│   ├── get-payment-stats.ts
│   └── get-ar-aging-report.ts                     # Go Financial query
│
└── payroll/
    └── (future: create-payroll-from-timesheets.ts)
```

## Use Case Categories

### 1. CRM Operations (TypeScript Only)
- `create-lead.ts`
- `find-duplicates.ts`
- `log-interaction.ts`

### 2. Cross-Domain Orchestration (TypeScript + Go)
- `convert-lead-to-case-with-contract.ts` - Lead → Case → Contract
- `reserve-inventory-for-case.ts` - Case → Inventory
- `process-case-payment.ts` - Payment → AR
- `finalize-case-with-gl-posting.ts` - Case → GL

### 3. Query Use Cases
- `get-case-balance.ts` - Aggregates TS + Go data
- `get-ar-aging-report.ts` - Delegates to Go
- `get-dashboard-stats.ts` - Aggregates multiple sources

### 4. Async/Event-Driven
- `sync-user-emails.ts` - Email sync
- `send-campaign.ts` - Campaign orchestration

## Best Practices

### ✅ DO

1. **Validate early** - Check preconditions before executing operations
2. **Use ports** - Never import infrastructure adapters directly
3. **Type results** - Define explicit command and result types
4. **Document** - Include JSDoc with use case description and examples
5. **Link domains** - Store foreign keys when orchestrating across boundaries
6. **Handle errors** - Use Effect error unions for exhaustive error handling

### ❌ DON'T

1. **Don't bypass ports** - Never call Go backend directly via HTTP
2. **Don't mix concerns** - Keep domain logic in entities, not use cases
3. **Don't ignore errors** - Always handle all possible error cases
4. **Don't use exceptions** - Use Effect.fail instead of throw
5. **Don't leak infrastructure** - Use cases should be infrastructure-agnostic

## Examples

### Simple Use Case (TypeScript Only)

```typescript
// use-cases/leads/create-lead.ts
export const createLead = (command: CreateLeadCommand): Effect =>
  Effect.gen(function* () {
    const leadRepo = yield* LeadRepository;
    
    const lead = yield* Lead.create({
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phone: command.phone,
    });
    
    yield* leadRepo.save(lead);
    
    return lead;
  });
```

### Complex Cross-Domain Use Case

```typescript
// use-cases/case-management/convert-lead-to-case-with-contract.ts
export const convertLeadToCaseWithContract = (command): Effect =>
  Effect.gen(function* () {
    // 1. TypeScript: Load lead
    const leadRepo = yield* LeadRepository;
    const lead = yield* leadRepo.findByBusinessKey(command.leadBusinessKey);
    
    if (!lead) {
      return yield* Effect.fail(new NotFoundError({...}));
    }
    
    // 2. TypeScript: Create case
    const caseRepo = yield* CaseRepository;
    const case_ = yield* Case.create({...});
    yield* caseRepo.save(case_);
    
    // 3. Go: Create contract
    const goContractPort = yield* GoContractPort;
    const contract = yield* goContractPort.createContract({
      caseId: case_.businessKey,
      services: command.services,
      products: command.products,
    });
    
    // 4. TypeScript: Link case ↔ contract
    const caseWithContract = {
      ...case_,
      metadata: { goContractId: contract.id },
    };
    yield* caseRepo.update(caseWithContract);
    
    // 5. TypeScript: Mark lead converted
    const convertedLead = yield* lead.convertToCase(case_.id);
    yield* leadRepo.update(convertedLead);
    
    return { lead: convertedLead, case: caseWithContract, contract };
  });
```

## Migration Guide

### From Old Pattern (Class-Based)

```typescript
// ❌ OLD: Class-based service
class CaseService {
  constructor(private repo: CaseRepository) {}
  
  async updateStatus(id: string, status: string) {
    const case_ = await this.repo.findById(id);
    case_.status = status;
    await this.repo.save(case_);
  }
}
```

```typescript
// ✅ NEW: Effect-based use case
export const updateCaseStatus = (command: UpdateCaseStatusCommand): Effect =>
  Effect.gen(function* () {
    const repo = yield* CaseRepository;
    
    const case_ = yield* repo.findById(command.id);
    
    if (!case_) {
      return yield* Effect.fail(new NotFoundError({...}));
    }
    
    const updatedCase = yield* case_.updateStatus(command.status);
    
    yield* repo.save(updatedCase);
    
    return updatedCase;
  });
```

## Related Documentation

- [ARCHITECTURE.md](../../../ARCHITECTURE.md) - Clean Architecture patterns
- [Ports README](../ports/README.md) - Port abstraction patterns
- [Effect-TS Docs](https://effect.website/) - Effect-TS framework

---

**Last Updated**: 2025-11-29  
**Phase**: Phase 4 - Cross-Domain Use Cases
