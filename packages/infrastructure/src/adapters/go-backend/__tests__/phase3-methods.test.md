# Phase 3 Adapter Methods Unit Tests

This document serves as test documentation for the 6 new methods added in Phase 3 (Minor Gaps).

## GoReconciliationsAdapter Tests

### Test: `getReconciliationItems`
**Endpoint**: `GET /v1/reconciliations/{id}/items`

**Test Case 1: Successfully retrieves reconciliation items**
```typescript
// Given: A valid reconciliation ID
const reconciliationId = "recon-123";

// When: getReconciliationItems is called
const result = await Effect.runPromise(
  GoReconciliationsAdapter.getReconciliationItems(reconciliationId)
);

// Then: Returns array of GoReconciliationItem objects
expect(result).toEqual([
  {
    id: "item-1",
    reconciliationId: "recon-123",
    transactionDate: new Date("2025-01-15"),
    description: "Payment from Client A",
    amount: 1500.00,
    cleared: true,
    clearedDate: new Date("2025-01-16")
  },
  {
    id: "item-2",
    reconciliationId: "recon-123",
    transactionDate: new Date("2025-01-16"),
    description: "Service fee",
    amount: -50.00,
    cleared: false,
    clearedDate: undefined
  }
]);
```

**Test Case 2: Handles network error**
```typescript
// Given: Network failure
mockGoClient.GET.mockResolvedValue({ error: { message: "Network timeout" } });

// When: getReconciliationItems is called
// Then: Returns NetworkError
await expect(
  Effect.runPromise(GoReconciliationsAdapter.getReconciliationItems("recon-123"))
).rejects.toThrow(NetworkError);
```

---

### Test: `undoReconciliation`
**Endpoint**: `POST /v1/reconciliations/{id}/undo`

**Test Case 1: Successfully undoes reconciliation**
```typescript
// Given: A completed reconciliation
const reconciliationId = "recon-123";
const reason = "Incorrect statement balance";

// When: undoReconciliation is called
await Effect.runPromise(
  GoReconciliationsAdapter.undoReconciliation(reconciliationId, reason)
);

// Then: HTTP request sent with correct body
expect(mockGoClient.POST).toHaveBeenCalledWith('/v1/reconciliations/{id}/undo', {
  params: { path: { id: "recon-123" } },
  body: { reason: "Incorrect statement balance" }
});
```

**Test Case 2: Handles network error**
```typescript
// Given: Network failure
mockGoClient.POST.mockResolvedValue({ error: { message: "Service unavailable" } });

// When: undoReconciliation is called
// Then: Returns NetworkError
await expect(
  Effect.runPromise(GoReconciliationsAdapter.undoReconciliation("recon-123", "reason"))
).rejects.toThrow(NetworkError);
```

---

## GoHCMCommonAdapter Tests

### Test: `getEmployeeById`
**Endpoint**: `GET /v1/hcm/employees/{id}`

**Test Case 1: Successfully retrieves employee**
```typescript
// Given: A valid employee ID
const employeeId = "emp-456";

// When: getEmployeeById is called
const result = await Effect.runPromise(
  GoHCMCommonAdapter.getEmployeeById(employeeId)
);

// Then: Returns GoEmployee object
expect(result).toEqual({
  id: "emp-456",
  employeeNumber: "E-2025-001",
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@dykstra.com",
  hireDate: new Date("2024-03-01"),
  terminationDate: undefined,
  status: "active",
  positionId: "pos-789",
  positionTitle: "Funeral Director",
  department: "Operations"
});
```

**Test Case 2: Returns NotFoundError for non-existent employee**
```typescript
// Given: Non-existent employee ID
mockGoClient.GET.mockResolvedValue({ 
  error: { message: "Not found" },
  response: { status: 404 }
});

// When: getEmployeeById is called
// Then: Returns NotFoundError
await expect(
  Effect.runPromise(GoHCMCommonAdapter.getEmployeeById("emp-999"))
).rejects.toThrow(NotFoundError);
```

---

### Test: `updateEmployeeInfo`
**Endpoint**: `PATCH /v1/hcm/employees/{id}`

**Test Case 1: Successfully updates employee info**
```typescript
// Given: Valid employee ID and update command
const employeeId = "emp-456";
const command: UpdateEmployeeInfoCommand = {
  email: "jane.smith.new@dykstra.com",
  phone: "+1-616-555-0123",
  address: "456 Oak St, Grand Rapids, MI 49503",
  emergencyContact: "John Smith",
  emergencyPhone: "+1-616-555-0199"
};

// When: updateEmployeeInfo is called
await Effect.runPromise(
  GoHCMCommonAdapter.updateEmployeeInfo(employeeId, command)
);

// Then: HTTP request sent with correct body (snake_case)
expect(mockGoClient.PATCH).toHaveBeenCalledWith('/v1/hcm/employees/{id}', {
  params: { path: { id: "emp-456" } },
  body: {
    email: "jane.smith.new@dykstra.com",
    phone: "+1-616-555-0123",
    address: "456 Oak St, Grand Rapids, MI 49503",
    emergency_contact: "John Smith",
    emergency_phone: "+1-616-555-0199"
  }
});
```

**Test Case 2: Handles partial updates**
```typescript
// Given: Partial update command
const command: UpdateEmployeeInfoCommand = {
  email: "new.email@dykstra.com"
  // Other fields undefined
};

// When: updateEmployeeInfo is called
await Effect.runPromise(
  GoHCMCommonAdapter.updateEmployeeInfo("emp-456", command)
);

// Then: Only sends non-undefined fields
expect(mockGoClient.PATCH).toHaveBeenCalledWith('/v1/hcm/employees/{id}', {
  params: { path: { id: "emp-456" } },
  body: {
    email: "new.email@dykstra.com",
    phone: undefined,
    address: undefined,
    emergency_contact: undefined,
    emergency_phone: undefined
  }
});
```

---

### Test: `getOrgChart`
**Endpoint**: `GET /v1/hcm/org-chart`

**Test Case 1: Retrieves full org chart (no root specified)**
```typescript
// Given: No root employee ID specified
// When: getOrgChart is called
const result = await Effect.runPromise(
  GoHCMCommonAdapter.getOrgChart()
);

// Then: Returns nested GoOrgChartNode structure
expect(result).toEqual({
  employeeId: "emp-001",
  employeeName: "Robert Dykstra",
  positionTitle: "Owner",
  managerId: undefined,
  children: [
    {
      employeeId: "emp-002",
      employeeName: "Jane Smith",
      positionTitle: "Funeral Director",
      managerId: "emp-001",
      children: [
        {
          employeeId: "emp-003",
          employeeName: "Tom Johnson",
          positionTitle: "Assistant Director",
          managerId: "emp-002",
          children: []
        }
      ]
    }
  ]
});
```

**Test Case 2: Retrieves org chart from specific root**
```typescript
// Given: Specific root employee ID
const rootEmployeeId = "emp-002";

// When: getOrgChart is called
const result = await Effect.runPromise(
  GoHCMCommonAdapter.getOrgChart(rootEmployeeId)
);

// Then: HTTP request includes root_employee_id query param
expect(mockGoClient.GET).toHaveBeenCalledWith('/v1/hcm/org-chart', {
  params: { query: { root_employee_id: "emp-002" } }
});

// And: Returns subtree starting from that employee
expect(result.employeeId).toBe("emp-002");
```

**Test Case 3: Mapper function correctly recurses**
```typescript
// Given: Backend response with nested structure
const backendData = {
  employee_id: "emp-001",
  employee_name: "Robert Dykstra",
  position_title: "Owner",
  manager_id: undefined,
  children: [
    {
      employee_id: "emp-002",
      employee_name: "Jane Smith",
      position_title: "Funeral Director",
      manager_id: "emp-001",
      children: []
    }
  ]
};

// When: mapToGoOrgChartNode is called
const result = mapToGoOrgChartNode(backendData);

// Then: Correctly maps snake_case to camelCase recursively
expect(result.employeeId).toBe("emp-001");
expect(result.children[0].employeeId).toBe("emp-002");
expect(result.children[0].managerId).toBe("emp-001");
```

---

### Test: `getCompensationHistory`
**Endpoint**: `GET /v1/hcm/employees/{id}/compensation-history`

**Test Case 1: Successfully retrieves compensation history**
```typescript
// Given: Valid employee ID
const employeeId = "emp-456";

// When: getCompensationHistory is called
const result = await Effect.runPromise(
  GoHCMCommonAdapter.getCompensationHistory(employeeId)
);

// Then: Returns array of GoCompensationHistoryEntry objects in chronological order
expect(result).toEqual([
  {
    effectiveDate: new Date("2024-03-01"),
    compensationType: "salary",
    amount: 75000.00,
    reason: "Initial hire",
    approvedBy: "emp-001"
  },
  {
    effectiveDate: new Date("2024-09-01"),
    compensationType: "salary",
    amount: 80000.00,
    reason: "Performance review - promotion",
    approvedBy: "emp-001"
  },
  {
    effectiveDate: new Date("2024-12-15"),
    compensationType: "bonus",
    amount: 5000.00,
    reason: "Year-end performance bonus",
    approvedBy: "emp-001"
  }
]);
```

**Test Case 2: Handles employee with no compensation history**
```typescript
// Given: Employee with no compensation history
mockGoClient.GET.mockResolvedValue({ 
  data: { history: [] }
});

// When: getCompensationHistory is called
const result = await Effect.runPromise(
  GoHCMCommonAdapter.getCompensationHistory("emp-789")
);

// Then: Returns empty array
expect(result).toEqual([]);
```

**Test Case 3: Mapper handles optional fields**
```typescript
// Given: Backend response with some optional fields missing
const backendData = {
  effective_date: "2024-03-01T00:00:00Z",
  compensation_type: "commission",
  amount: 2500.00,
  reason: undefined,
  approved_by: undefined
};

// When: mapToGoCompensationHistoryEntry is called
const result = mapToGoCompensationHistoryEntry(backendData);

// Then: Optional fields are undefined
expect(result).toEqual({
  effectiveDate: new Date("2024-03-01"),
  compensationType: "commission",
  amount: 2500.00,
  reason: undefined,
  approvedBy: undefined
});
```

---

## Integration Tests

### Test: Reconciliation workflow with new methods
```typescript
test("Complete reconciliation workflow", async () => {
  // 1. Create reconciliation
  const recon = await Effect.runPromise(
    GoReconciliationsAdapter.createReconciliation("acc-123", new Date("2025-01"), 10000)
  );
  
  // 2. Get reconciliation items
  const items = await Effect.runPromise(
    GoReconciliationsAdapter.getReconciliationItems(recon.id)
  );
  expect(items.length).toBeGreaterThan(0);
  
  // 3. Mark items cleared
  for (const item of items) {
    await Effect.runPromise(
      GoReconciliationsAdapter.markItemCleared(recon.id, item.id)
    );
  }
  
  // 4. Complete reconciliation
  await Effect.runPromise(
    GoReconciliationsAdapter.completeReconciliation(recon.id, "emp-123")
  );
  
  // 5. Undo if needed
  await Effect.runPromise(
    GoReconciliationsAdapter.undoReconciliation(recon.id, "Found error")
  );
});
```

### Test: Employee lifecycle with new HCM methods
```typescript
test("Employee data management workflow", async () => {
  // 1. Get employee by ID
  const employee = await Effect.runPromise(
    GoHCMCommonAdapter.getEmployeeById("emp-456")
  );
  
  // 2. Update employee info
  await Effect.runPromise(
    GoHCMCommonAdapter.updateEmployeeInfo(employee.id, {
      email: "updated@dykstra.com",
      phone: "+1-616-555-9999"
    })
  );
  
  // 3. Get compensation history
  const history = await Effect.runPromise(
    GoHCMCommonAdapter.getCompensationHistory(employee.id)
  );
  expect(history.length).toBeGreaterThan(0);
  
  // 4. Get org chart to see reporting structure
  const orgChart = await Effect.runPromise(
    GoHCMCommonAdapter.getOrgChart(employee.id)
  );
  expect(orgChart.employeeId).toBe(employee.id);
});
```

---

## Test Setup Requirements

When setting up the test framework (Vitest recommended), include:

1. **Mock setup for goClient**:
```typescript
import { vi } from 'vitest';
import * as client from '../client';

vi.mock('../client', () => ({
  goClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PATCH: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn()
  },
  unwrapResponse: vi.fn((res) => res.data)
}));
```

2. **Effect-TS test utilities**:
```typescript
import { Effect } from 'effect';

async function runEffect<E, A>(effect: Effect.Effect<A, E>) {
  return Effect.runPromise(effect);
}
```

3. **Test data builders**:
```typescript
function buildGoReconciliationItem(overrides?: Partial<GoReconciliationItem>): GoReconciliationItem {
  return {
    id: "item-1",
    reconciliationId: "recon-1",
    transactionDate: new Date(),
    description: "Test transaction",
    amount: 100.00,
    cleared: false,
    clearedDate: undefined,
    ...overrides
  };
}
```

---

## Coverage Goals

- ✅ Unit tests: 100% coverage of new methods
- ✅ Error handling: NetworkError, NotFoundError
- ✅ Data mapping: snake_case → camelCase
- ✅ Edge cases: Empty arrays, missing optional fields, 404s
- ✅ Integration: Multi-step workflows

---

## Test Execution

Once test framework is configured:

```bash
# Run unit tests
pnpm --filter @dykstra/infrastructure test

# Run with coverage
pnpm --filter @dykstra/infrastructure test:coverage

# Run in watch mode during development
pnpm --filter @dykstra/infrastructure test:watch
```
