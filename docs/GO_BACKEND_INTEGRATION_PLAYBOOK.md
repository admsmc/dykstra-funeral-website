# Go Backend Integration Playbook

**Purpose**: A systematic, repeatable process for integrating Go platform backend functionality into the Dykstra Funeral Home monorepo.

**Last Updated**: December 1, 2024  
**Version**: 1.0

---

## Overview

This playbook documents the methodical approach for bringing functionality from the Go backend platform (`tigerbeetle-trial-app-1`) into the funeral home monorepo while maintaining architectural integrity and clean separation of concerns.

## When to Use This Playbook

Use this process when you need to:
- Add new funeral home management features that exist in the Go backend
- Integrate additional Go ERP modules (HR, Payroll, Inventory, etc.)
- Expand existing functionality with more backend capabilities
- Connect new use cases to proven backend services

---

## The 7-Step Integration Process

### Step 1: Identify Business Need & Use Cases

**Goal**: Clearly define what funeral home use cases you want to support.

**Actions**:
1. **Document the business need**
   - What problem are you solving?
   - Who are the users? (staff, families, administrators)
   - What workflows are involved?

2. **List specific use cases**
   - Be concrete and specific
   - Example: "Assign on-call funeral director for weekend coverage"
   - Example: "Track shift differentials for night and holiday shifts"

3. **Prioritize use cases**
   - Critical vs. nice-to-have
   - Dependencies between use cases

**Example from Scheduling Integration**:
```
Business Need: Staff roster management for 24/7 funeral home operations

Use Cases:
1. Staff Roster Management - Assign directors, embalmers, drivers to shifts
2. 24/7 On-Call Rotation - Coverage for after-hours death calls
3. Service Coverage Planning - Adequate staffing for scheduled services
4. Shift Swap Workflow - Staff request trades with manager approval
5. Rotating Schedules - Fair distribution of night/weekend shifts
```

**Checklist**:
- [ ] Business need documented
- [ ] 3-5 specific use cases identified
- [ ] Use cases prioritized
- [ ] User roles identified

---

### Step 2: Check Monorepo for Existing Functionality

**Goal**: Avoid duplication by verifying what already exists.

**Actions**:
1. **Search for relevant use cases**
   ```bash
   # Search use cases directory
   grep -r "schedule\|roster\|shift" packages/application/src/use-cases/
   
   # Search ports for related functionality
   grep -r "schedule\|roster\|shift" packages/application/src/ports/
   ```

2. **Check existing ports**
   ```bash
   # List all Go backend ports
   ls packages/application/src/ports/go-*-port.ts
   
   # Count existing methods
   grep -c "readonly" packages/application/src/ports/go-timesheet-port.ts
   ```

3. **Review related adapters**
   ```bash
   # List all Go backend adapters
   ls packages/infrastructure/src/adapters/go-backend/go-*-adapter.ts
   ```

4. **Document findings**
   - What exists and works
   - What's stubbed or incomplete
   - What's missing entirely

**Example from Scheduling Integration**:
```
Found:
- ✅ go-timesheet-port.ts - Time tracking (15 methods)
- ✅ calendar-sync-port.ts - Calendar integration (stub)

Missing:
- ❌ No dedicated staff scheduling/roster port
- ❌ No shift template management
- ❌ No shift swap workflow
- ❌ No on-call rotation management
```

**Checklist**:
- [ ] Searched use cases directory
- [ ] Searched ports directory
- [ ] Checked existing adapters
- [ ] Documented what exists vs. what's needed

---

### Step 3: Discover Go Backend Functionality

**Goal**: Find and analyze relevant functionality in the Go backend platform.

**Actions**:
1. **Search Go backend codebase**
   ```bash
   # Search for domain models
   grep -r "schedule\|roster\|shift" /path/to/tigerbeetle-trial-app-1/internal/domain/
   
   # Search for services
   grep -r "schedule\|roster\|shift" /path/to/tigerbeetle-trial-app-1/internal/service/
   ```

2. **Examine domain models**
   - Read `internal/domain/scheduling_builders.go`
   - Understand data structures
   - Note business rules and validations

3. **Review service layer**
   - Read `internal/service/scheduling_service.go`
   - Understand operations and workflows
   - Note dependencies (TigerBeetle, PostgreSQL, EventStore)

4. **Check API handlers**
   - Look for existing HTTP endpoints in `cmd/api/` or `internal/apiapp/`
   - Note endpoint patterns and request/response structures

5. **Document capabilities**
   - List all features available
   - Note any special integrations (TigerBeetle, event sourcing, etc.)
   - Identify limitations or gaps

**Example from Scheduling Integration**:
```
Found in Go Backend:
- Domain model: internal/domain/scheduling_builders.go (200+ lines)
  - ShiftTypes: regular, night, weekend, oncall, holiday, overtime
  - Shift differentials (pay premiums)
  - Shift templates and assignments
  - Shift swap workflow
  - On-call management
  - Coverage rules

- Service layer: internal/service/scheduling_service.go (200+ lines)
  - AssignShift, CompleteShift, CancelShift
  - RequestShiftSwap, ApproveShiftSwap, RejectShiftSwap
  - AssignOnCall, ActivateOnCall
  - TigerBeetle integration for transactional scheduling

Key Features:
- ✅ Event sourcing (ShiftAssigned, ShiftCompleted, etc.)
- ✅ Conflict detection
- ✅ Coverage validation
- ✅ Rotating schedule patterns
```

**Checklist**:
- [ ] Located relevant domain models
- [ ] Reviewed service layer implementations
- [ ] Checked for existing API endpoints
- [ ] Documented all available features
- [ ] Noted special integrations (TigerBeetle, EventStore, etc.)

---

### Step 4: Design the Port Interface

**Goal**: Define a TypeScript interface for the functionality you need.

**Actions**:
1. **Create port file**
   ```
   Location: packages/application/src/ports/go-{module}-port.ts
   Pattern: go-scheduling-port.ts, go-inventory-port.ts, etc.
   ```

2. **Define domain types (DTOs)**
   - Map Go structs to TypeScript interfaces
   - Use `readonly` for all properties (immutability)
   - Convert snake_case to camelCase
   - Add proper TypeScript types (Date, number, string, enums)

3. **Define port interface**
   - Name: `Go{Module}PortService`
   - Use Effect-TS return types: `Effect.Effect<T, E>`
   - Define proper error types (NetworkError, NotFoundError, ValidationError)
   - Group methods logically (CRUD, workflows, queries)

4. **Create Context tag**
   ```typescript
   export const Go{Module}Port = Context.GenericTag<Go{Module}PortService>(
     '@dykstra/Go{Module}Port'
   );
   ```

5. **Document each method**
   - Purpose
   - Backend operations performed
   - Business rules enforced
   - Side effects (events emitted, state changes)

**Port Design Checklist**:
- [ ] File named correctly: `go-{module}-port.ts`
- [ ] All DTOs defined with `readonly` properties
- [ ] Interface named with `Service` suffix (e.g., `GoSchedulingPortService`)
- [ ] All methods return `Effect.Effect<T, E>`
- [ ] Proper error types declared (`NetworkError | NotFoundError`)
- [ ] Context tag created (without `Service` suffix)
- [ ] Command vs. Query separation clear
- [ ] Each method documented with JSDoc

**Example Pattern**:
```typescript
// Domain types (DTOs)
export interface GoShiftTemplate {
  readonly id: string;
  readonly name: string;
  readonly shiftType: ShiftType;
  readonly startTime: string;  // HH:MM
  readonly endTime: string;
  readonly durationMinutes: number;
}

// Port interface
export interface GoSchedulingPortService {
  /**
   * Create a shift template
   * 
   * Backend operation:
   * 1. Validates shift times and duration
   * 2. Creates shift template aggregate
   * 3. Emits ShiftTemplateCreated event
   */
  readonly createShiftTemplate: (
    command: CreateShiftTemplateCommand
  ) => Effect.Effect<GoShiftTemplate, NetworkError>;
  
  readonly getShiftTemplate: (
    id: string
  ) => Effect.Effect<GoShiftTemplate, NotFoundError | NetworkError>;
}

// Context tag
export const GoSchedulingPort = Context.GenericTag<GoSchedulingPortService>(
  '@dykstra/GoSchedulingPort'
);
```

**Checklist**:
- [ ] Port file created
- [ ] Domain types defined
- [ ] Port interface defined
- [ ] Context tag exported
- [ ] All methods documented
- [ ] No implementation details in port

---

### Step 5: Implement the Adapter

**Goal**: Create an object-based adapter that implements the port interface.

**Actions**:
1. **Create adapter file**
   ```
   Location: packages/infrastructure/src/adapters/go-backend/go-{module}-adapter.ts
   Pattern: Must match port name (go-scheduling-adapter.ts)
   ```

2. **Implement mapping functions**
   - Convert Go API responses (snake_case) to TypeScript (camelCase)
   - Handle optional fields gracefully
   - Convert date strings to Date objects
   - Map nested structures recursively

3. **Implement adapter object**
   ```typescript
   export const Go{Module}Adapter: Go{Module}PortService = {
     method1: (params) => Effect.tryPromise({
       try: async () => { /* API call */ },
       catch: (error) => new NetworkError(...)
     }),
     // ... all other methods
   };
   ```

4. **Use Effect-TS patterns**
   - `Effect.tryPromise()` for async operations
   - Proper error catching and wrapping
   - Type-safe error handling

5. **Handle HTTP details**
   - Map commands to POST/PUT/DELETE endpoints
   - Map queries to GET endpoints
   - Convert TypeScript to snake_case for request bodies
   - Parse snake_case responses to camelCase

6. **Add error handling**
   - Check for HTTP errors (404, 500, etc.)
   - Convert to appropriate error types (NotFoundError, NetworkError)
   - Provide helpful error messages

**Adapter Design Checklist**:
- [ ] File named correctly: `go-{module}-adapter.ts`
- [ ] Mapping functions for all DTOs
- [ ] Object-based implementation (NOT class-based)
- [ ] All methods use `Effect.tryPromise()`
- [ ] Proper error handling and wrapping
- [ ] HTTP client properly imported (`goClient`)
- [ ] Request bodies use snake_case
- [ ] Response parsing to camelCase
- [ ] No business logic in adapter (only API calls and mapping)

**Example Pattern**:
```typescript
// Mapping function
function mapToGoShiftTemplate(data: any): GoShiftTemplate {
  return {
    id: data.id || data.template_id,
    name: data.name,
    shiftType: data.shift_type,
    startTime: data.start_time,
    endTime: data.end_time,
    durationMinutes: data.duration_minutes || data.duration_mins,
  };
}

// Adapter implementation
export const GoSchedulingAdapter: GoSchedulingPortService = {
  createShiftTemplate: (command) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.POST('/v1/scheduling/templates', {
          body: {
            name: command.name,
            shift_type: command.shiftType,
            start_time: command.startTime,
            end_time: command.endTime,
            duration_minutes: command.durationMinutes,
          },
        });

        if (res.error) {
          throw new Error(res.error.message || 'Failed to create template');
        }

        return mapToGoShiftTemplate(res.data);
      },
      catch: (error) => 
        new Error(`Network error: ${error}`) as NetworkError,
    }),

  getShiftTemplate: (id) =>
    Effect.tryPromise({
      try: async () => {
        const res = await goClient.GET('/v1/scheduling/templates/{id}', {
          params: { path: { id } },
        });

        if (res.error) {
          if (res.response.status === 404) {
            throw new Error(`Template ${id} not found`) as NotFoundError;
          }
          throw new Error(res.error.message || 'Failed to get template');
        }

        return mapToGoShiftTemplate(res.data);
      },
      catch: (error) =>
        error instanceof Error && error.message.includes('not found')
          ? (error as NotFoundError)
          : (new Error(`Network error: ${error}`) as NetworkError),
    }),
};
```

**Checklist**:
- [ ] Adapter file created
- [ ] Mapping functions implemented
- [ ] Adapter object implements port interface
- [ ] All methods use Effect.tryPromise
- [ ] Error handling implemented
- [ ] No business logic present
- [ ] Compiles without errors

---

### Step 6: Verify Architecture Compliance

**Goal**: Ensure the new code follows all architectural rules.

**Actions**:
1. **Check layer boundaries**
   - Port in `packages/application/src/ports/` ✓
   - Adapter in `packages/infrastructure/src/adapters/go-backend/` ✓
   - No cross-layer violations

2. **Verify dependency rule**
   - Adapter imports port types from `@dykstra/application` ✓
   - Port imports domain errors from `@dykstra/domain` ✓
   - No circular dependencies

3. **Verify object-based pattern**
   - Adapter is object, NOT class ✓
   - No constructor, no `this` keyword
   - Singleton `goClient` imported directly

4. **Verify Effect-TS patterns**
   - Interface named with `Service` suffix ✓
   - Context tag named WITHOUT `Service` suffix ✓
   - All methods return `Effect.Effect<T, E>` ✓

5. **Verify naming conventions**
   - Port: `go-{module}-port.ts`, interface `Go{Module}PortService`
   - Adapter: `go-{module}-adapter.ts`, const `Go{Module}Adapter`
   - 1:1 mapping between port and adapter

6. **Run type check**
   ```bash
   pnpm type-check
   ```

7. **Check against ARCHITECTURE.md**
   - No Prisma in application layer
   - No business logic in infrastructure layer
   - Proper error types by layer

**Architecture Compliance Checklist**:
- [ ] Files in correct directories
- [ ] No dependency rule violations
- [ ] Object-based pattern (not class-based)
- [ ] Effect-TS patterns correct
- [ ] Naming conventions followed
- [ ] TypeScript compilation passes
- [ ] No violations in ARCHITECTURE.md
- [ ] Follows existing patterns (21 other Go ports)

**Reference Documents**:
- `ARCHITECTURE.md` - Clean Architecture guidelines
- `WARP.md` - Project-specific rules
- Existing Go ports for patterns

---

### Step 7: Document the Integration

**Goal**: Create comprehensive documentation for future reference.

**Actions**:
1. **Create integration summary document**
   ```
   Location: docs/GO_{MODULE}_INTEGRATION_SUMMARY.md
   Example: docs/GO_SCHEDULING_INTEGRATION_SUMMARY.md
   ```

2. **Document what was created**
   - Port file (location, methods, lines)
   - Adapter file (location, implementation, lines)
   - Domain types defined
   - API endpoints mapped

3. **Document Go backend functionality leveraged**
   - Source files in tigerbeetle-trial-app
   - Key features used
   - Special integrations (TigerBeetle, EventStore, etc.)

4. **Document funeral home use cases enabled**
   - List each use case
   - Describe how it works
   - Note which port methods support it

5. **Document next steps**
   - Use case implementation plan
   - Infrastructure layer registration
   - API layer (tRPC router) creation
   - Testing strategy

6. **Include usage examples**
   ```typescript
   // Example code showing how to use the new port
   ```

7. **Document success metrics**
   - Business outcomes expected
   - Technical metrics to track

**Documentation Checklist**:
- [ ] Integration summary created
- [ ] All files documented
- [ ] Go backend functionality described
- [ ] Use cases documented
- [ ] Next steps outlined
- [ ] Usage examples provided
- [ ] Success metrics defined

**Example from Scheduling Integration**:
```markdown
# Go Scheduling Integration Summary

## What Was Created
- Port: go-scheduling-port.ts (463 lines, 25 methods)
- Adapter: go-scheduling-adapter.ts (637 lines, 22 endpoints)
- 8 domain type interfaces
- 2 enums (ShiftType, RecurrencePattern)

## Go Backend Functionality
- Source: internal/domain/scheduling_builders.go
- TigerBeetle transactional scheduling
- Event sourcing for all operations
- Conflict detection and coverage validation

## Use Cases Enabled
1. Staff Roster Management
2. 24/7 On-Call Rotation
3. Service Coverage Planning
4. Shift Swap Workflow
5. Rotating Schedules

## Next Steps
- Week 1-2: Create funeral home use cases
- Week 3: Wire into infrastructure layer
- Week 4: Create tRPC router
- Week 5: Comprehensive testing
```

---

## Complete Checklist for Each Integration

Use this master checklist for each new integration:

### Step 1: Identify Business Need
- [ ] Business need documented
- [ ] 3-5 specific use cases identified
- [ ] Use cases prioritized
- [ ] User roles identified

### Step 2: Check Existing Functionality
- [ ] Searched use cases directory
- [ ] Searched ports directory
- [ ] Checked existing adapters
- [ ] Documented what exists vs. needed

### Step 3: Discover Go Backend
- [ ] Located domain models
- [ ] Reviewed service layer
- [ ] Checked API handlers
- [ ] Documented features
- [ ] Noted special integrations

### Step 4: Design Port
- [ ] Port file created with correct naming
- [ ] Domain types (DTOs) defined
- [ ] Port interface defined with `Service` suffix
- [ ] Context tag created without `Service` suffix
- [ ] All methods documented
- [ ] Effect.Effect return types
- [ ] Proper error types

### Step 5: Implement Adapter
- [ ] Adapter file created with correct naming
- [ ] Mapping functions implemented
- [ ] Object-based implementation (NOT class)
- [ ] Effect.tryPromise patterns
- [ ] Error handling
- [ ] No business logic

### Step 6: Verify Compliance
- [ ] Files in correct directories
- [ ] No dependency violations
- [ ] Object-based pattern verified
- [ ] Effect-TS patterns correct
- [ ] Naming conventions followed
- [ ] Type check passes
- [ ] ARCHITECTURE.md compliance
- [ ] Follows existing patterns

### Step 7: Document Integration
- [ ] Integration summary created
- [ ] All files documented
- [ ] Go backend functionality described
- [ ] Use cases documented
- [ ] Next steps outlined
- [ ] Usage examples provided
- [ ] Success metrics defined

---

## Common Patterns & Best Practices

### Naming Conventions
- **Port**: `go-{module}-port.ts`, interface `Go{Module}PortService`
- **Adapter**: `go-{module}-adapter.ts`, const `Go{Module}Adapter`
- **Context Tag**: `Go{Module}Port` (no `Service` suffix)

### Port Design Patterns
- Always use `readonly` on all properties
- Always return `Effect.Effect<T, E>`
- Group related methods (CRUD, workflows, queries)
- Document backend operations in JSDoc
- Separate commands from queries

### Adapter Implementation Patterns
- Object-based, never class-based
- Import `goClient` singleton
- Use `Effect.tryPromise()` for async operations
- Create mapping functions for each DTO
- Handle 404s as NotFoundError
- Handle other errors as NetworkError
- Convert snake_case ↔ camelCase

### Error Handling Patterns
```typescript
// Query with NotFoundError
Effect.tryPromise({
  try: async () => {
    const res = await goClient.GET('/v1/resource/{id}', { params: { path: { id } } });
    if (res.error) {
      if (res.response.status === 404) {
        throw new Error(`Resource ${id} not found`) as NotFoundError;
      }
      throw new Error(res.error.message || 'Failed to get resource');
    }
    return mapToResource(res.data);
  },
  catch: (error) =>
    error instanceof Error && error.message.includes('not found')
      ? (error as NotFoundError)
      : (new Error(`Network error: ${error}`) as NetworkError),
})

// Command with NetworkError only
Effect.tryPromise({
  try: async () => {
    const res = await goClient.POST('/v1/resource', { body: { /* ... */ } });
    if (res.error) {
      throw new Error(res.error.message || 'Failed to create resource');
    }
    return mapToResource(res.data);
  },
  catch: (error) => new Error(`Network error: ${error}`) as NetworkError,
})
```

---

## Troubleshooting

### Issue: TypeScript compilation errors
**Solution**: Check that:
- Interface has `Service` suffix
- Context tag does NOT have `Service` suffix
- All imports are from correct packages
- All methods return `Effect.Effect<T, E>`

### Issue: Circular dependency errors
**Solution**: Check that:
- Port only imports from `@dykstra/domain`
- Adapter only imports from `@dykstra/application`
- No imports from infrastructure in application layer

### Issue: Effect-TS patterns not working
**Solution**: Verify:
- Using `Effect.tryPromise()` correctly
- Proper error catching and wrapping
- Context tag created with `Context.GenericTag`

### Issue: API calls failing
**Solution**: Check:
- Endpoint paths match Go backend
- Request body fields use snake_case
- Response parsing handles snake_case
- Error handling for all HTTP error codes

---

## Examples of Successful Integrations

### 1. Go Scheduling Integration
- **Use Cases**: Staff roster, on-call rotation, shift swaps
- **Port**: 463 lines, 25 methods
- **Adapter**: 637 lines, 22 endpoints
- **Special Features**: TigerBeetle transactions, event sourcing
- **Documentation**: `docs/GO_SCHEDULING_INTEGRATION_SUMMARY.md`

### 2. Go Timesheet Integration (Existing)
- **Use Cases**: Time tracking, timesheet approval, payroll integration
- **Port**: `go-timesheet-port.ts`, 15 methods
- **Adapter**: `go-timesheet-adapter.ts`
- **Special Features**: SCD2 temporal tracking, event sourcing

### 3. Go Inventory Integration (Existing)
- **Use Cases**: Inventory tracking, transactions, multi-location
- **Port**: `go-inventory-port.ts`, 17 methods
- **Adapter**: `go-inventory-adapter.ts`
- **Special Features**: WAC costing, TigerBeetle integration

---

## Quick Reference Card

**When starting a new integration:**

1. ✅ Identify business need & use cases
2. ✅ Check monorepo for existing functionality
3. ✅ Discover Go backend functionality
4. ✅ Design port interface (with `Service` suffix)
5. ✅ Implement adapter (object-based, NOT class)
6. ✅ Verify architecture compliance
7. ✅ Document integration

**File locations:**
- Port: `packages/application/src/ports/go-{module}-port.ts`
- Adapter: `packages/infrastructure/src/adapters/go-backend/go-{module}-adapter.ts`
- Docs: `docs/GO_{MODULE}_INTEGRATION_SUMMARY.md`

**Key patterns:**
- Interface: `Go{Module}PortService`
- Context: `Go{Module}Port`
- Adapter: `Go{Module}Adapter`
- Methods: `Effect.Effect<T, E>`
- Errors: `NetworkError | NotFoundError`

---

## Related Documentation

- **Architecture**: `ARCHITECTURE.md` - Clean Architecture principles
- **Project Rules**: `WARP.md` - Project-specific conventions
- **Backend Contracts**: `docs/BACKEND_CONTRACT_VALIDATION_COMPLETE.md`
- **Implementation Plans**: `docs/Implementation Plan_ Remaining 20 Critical Use Cases.md`

---

## Version History

- **v1.0** (Dec 1, 2024) - Initial playbook based on Go Scheduling integration
