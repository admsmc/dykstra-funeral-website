# Test Coverage Plan: 100% Use Case Coverage

## Executive Summary
**Current State**: 33/76 use cases tested (43% coverage)  
**Target State**: 76/76 use cases tested (100% coverage)  
**Remaining Work**: 43 use cases need test coverage  
**Estimated Effort**: 3-4 weeks (1 developer, 5-8 tests per day)

---

## Current Coverage Breakdown

| Category | Total | Tested | Untested | Coverage % |
|----------|-------|--------|----------|------------|
| Critical Business Ops | 30 | 24 | 6 | 80% |
| Supporting Features | 20 | 9 | 11 | 45% |
| CRUD Operations | 26 | 0 | 26 | 0% |
| **Overall** | **76** | **33** | **43** | **43%** |

---

## Strategy: Phased Approach by Priority

### Phase 1: High-Value Business Logic (6 use cases - Week 1)
**Goal**: Test remaining critical business operations with complex logic  
**Effort**: 6 use cases × 8 tests avg = 48 tests  
**Timeline**: 5 days (1 week)

#### Priority 1.1: Service Arrangement Recommendations (Day 1-2)
**File**: `contract/__tests__/service-arrangement-recommendations.test.ts`  
**Implementation**: `contract/service-arrangement-recommendations.ts` (576 lines)  
**Complexity**: High - Multi-repository orchestration, recommendation engine

**Test Coverage**:
1. ✅ Should generate primary arrangement for traditional burial service
2. ✅ Should include alternative arrangements based on budget
3. ✅ Should apply family preferences (flowers, memorial cards)
4. ✅ Should filter products by budget range (max constraint)
5. ✅ Should calculate accurate cost estimates (required + recommended + products)
6. ✅ Should handle simple arrangement preference (minimal services only)
7. ❌ Should fail when service type is invalid
8. ❌ Should fail when budget max < budget min
9. ❌ Should handle network error from ServiceCatalogRepository
10. ❌ Should handle network error from ProductCatalogRepository

**Estimated Time**: 12 hours (implementation: 8h, review: 4h)

#### Priority 1.2: Contact Duplicate Detection (Day 2)
**File**: `contacts/__tests__/find-duplicates.test.ts`  
**Implementation**: `contacts/find-duplicates.ts` (304 lines)  
**Complexity**: High - Fuzzy matching algorithms, scoring logic

**Test Coverage**:
1. ✅ Should detect exact name matches
2. ✅ Should detect phonetic name matches (soundex/metaphone)
3. ✅ Should detect email matches
4. ✅ Should detect phone number matches (normalized)
5. ✅ Should detect address matches (normalized)
6. ✅ Should calculate confidence scores correctly (0-100)
7. ✅ Should sort results by confidence score descending
8. ❌ Should handle empty contact database
9. ❌ Should fail when contact ID is invalid
10. ❌ Should handle network error from ContactRepository

**Estimated Time**: 6 hours

#### Priority 1.3: Process Case Payment (Day 3)
**File**: `financial/__tests__/process-case-payment.test.ts`  
**Implementation**: `financial/process-case-payment.ts` (250 lines)  
**Complexity**: Medium-High - Payment allocation, balance updates

**Test Coverage**:
1. ✅ Should process full payment and update case balance
2. ✅ Should process partial payment and track remaining balance
3. ✅ Should allocate payment to oldest invoice first (FIFO)
4. ✅ Should handle overpayment (create credit balance)
5. ✅ Should post journal entry to AR and Cash accounts
6. ✅ Should update case status to 'paid' when fully paid
7. ❌ Should fail when payment amount is negative
8. ❌ Should fail when case is already paid in full
9. ❌ Should handle network error from GoFinancialPort
10. ❌ Should handle network error from CaseRepository

**Estimated Time**: 6 hours

#### Priority 1.4: Reserve Inventory for Case (Day 4)
**File**: `inventory/__tests__/reserve-inventory-for-case.test.ts`  
**Implementation**: `inventory/reserve-inventory-for-case.ts` (204 lines)  
**Complexity**: Medium - Inventory allocation, availability checks

**Test Coverage**:
1. ✅ Should reserve inventory items for case
2. ✅ Should check available quantities before reserving
3. ✅ Should fail when insufficient inventory available
4. ✅ Should reserve from specific location
5. ✅ Should handle multi-location inventory allocation
6. ✅ Should update case inventory metadata
7. ❌ Should fail when item ID is invalid
8. ❌ Should fail when case already has reservations for same item
9. ❌ Should handle network error from GoInventoryPort
10. ❌ Should handle network error from CaseRepository

**Estimated Time**: 5 hours

#### Priority 1.5: Email Entity Matching (Day 4-5)
**File**: `email-sync/__tests__/match-email-to-entity.test.ts`  
**Implementation**: `email-sync/match-email-to-entity.ts` (190 lines)  
**Complexity**: Medium-High - Pattern matching, NLP heuristics

**Test Coverage**:
1. ✅ Should match email to case by reference number in subject
2. ✅ Should match email to contact by email address
3. ✅ Should match email to contract by contract number
4. ✅ Should match email to task by task ID
5. ✅ Should calculate confidence scores for matches
6. ✅ Should return multiple potential matches sorted by confidence
7. ✅ Should handle no matches found
8. ❌ Should fail when email ID is invalid
9. ❌ Should handle network error from repositories
10. ❌ Should handle malformed email content

**Estimated Time**: 5 hours

#### Priority 1.6: Contact Merge (Day 5)
**File**: `contacts/__tests__/merge-contacts.test.ts`  
**Implementation**: `contacts/merge-contacts.ts` (52 lines)  
**Complexity**: Medium - Data consolidation, reference updates

**Test Coverage**:
1. ✅ Should merge two contacts and preserve all data
2. ✅ Should update case references from source to target
3. ✅ Should update note references from source to target
4. ✅ Should deactivate source contact after merge
5. ✅ Should preserve audit trail of merge operation
6. ❌ Should fail when source and target are the same
7. ❌ Should fail when target contact not found
8. ❌ Should handle network error from ContactRepository

**Estimated Time**: 4 hours

---

### Phase 2: Supporting Business Features (11 use cases - Week 2)
**Goal**: Test remaining supporting features with moderate complexity  
**Effort**: 11 use cases × 6 tests avg = 66 tests  
**Timeline**: 5 days (1 week)

#### Day 6: Contract Management (3 use cases)
1. **Catalog Queries** - `contracts/__tests__/catalog-queries.test.ts` (2h)
2. **Contract Operations** - `contracts/__tests__/contract-operations.test.ts` (3h)
3. **Template Operations** - `contracts/__tests__/template-operations.test.ts` (3h)

#### Day 7: Case Management (4 use cases)
1. **Convert Lead to Case with Contract** - `case-management/__tests__/convert-lead-to-case-with-contract.test.ts` (3h)
2. **Get Audit Log** - `case-management/__tests__/get-audit-log.test.ts` (1.5h)
3. **Get Financial Summary** - `case-management/__tests__/get-financial-summary.test.ts` (1.5h)
4. **Update Case Status** - `case-management/__tests__/update-case-status.test.ts` (2h)

#### Day 8: Staff Management (4 use cases)
1. **Get Analytics** - `staff/__tests__/get-analytics.test.ts` (2h)
2. **Get Dashboard Stats** - `staff/__tests__/get-dashboard-stats.test.ts` (2h)
3. **Get Task Dashboard** - `staff/__tests__/get-task-dashboard.test.ts` (2h)
4. **List Staff Members** - `staff/__tests__/list-staff-members.test.ts` (1h)

---

### Phase 3: Query & Payment Operations (6 use cases - Week 3, Days 9-10)
**Goal**: Test payment query operations and lead management  
**Effort**: 6 use cases × 5 tests avg = 30 tests  
**Timeline**: 2 days

#### Day 9: Payment Operations (4 use cases)
1. **Get Payment By ID** - `payments/__tests__/get-payment-by-id.test.ts` (1.5h)
2. **Get Payment Stats** - `payments/__tests__/get-payment-stats.test.ts` (2h)
3. **List Payments** - `payments/__tests__/list-payments.test.ts` (2h)
4. **Record Manual Payment** - `payments/__tests__/record-manual-payment.test.ts` (2.5h)

**Note**: `payments/get-ar-aging-report.ts` and `payments/process-refund.ts` may be duplicates of financial operations already tested.

#### Day 10: Lead Management (2 use cases)
1. **Convert Lead to Case** - `leads/__tests__/convert-lead-to-case.test.ts` (2h)
2. **Create Lead** - `leads/__tests__/create-lead.test.ts` (2h)

---

### Phase 4: CRUD Operations - Batch 1 (13 use cases - Week 3, Days 11-13)
**Goal**: Test notes, tasks, and invitations CRUD  
**Effort**: 13 use cases × 4 tests avg = 52 tests  
**Timeline**: 3 days

#### Day 11: Notes CRUD (5 use cases)
1. **Create Note** - `notes/__tests__/create-note.test.ts` (1.5h)
2. **Update Note** - `notes/__tests__/update-note.test.ts` (1.5h)
3. **Delete Note** - `notes/__tests__/delete-note.test.ts` (1h)
4. **List Notes** - `notes/__tests__/list-notes.test.ts` (1.5h)
5. **Get Note History** - `notes/__tests__/get-note-history.test.ts` (1.5h)

#### Day 12: Invitations CRUD (5 use cases)
1. **Create Invitation** - `invitations/__tests__/create-invitation.test.ts` (2h)
2. **List Invitations** - `invitations/__tests__/list-invitations.test.ts` (1h)
3. **Resend Invitation** - `invitations/__tests__/resend-invitation.test.ts` (1.5h)
4. **Revoke Invitation** - `invitations/__tests__/revoke-invitation.ts` (1.5h)
5. **Get Invitation History** - `invitations/__tests__/get-invitation-history.test.ts` (1h)

#### Day 13: Tasks CRUD (3 use cases)
1. **Create Task** - `tasks/__tests__/create-task.test.ts` (2h)
2. **List Tasks** - `tasks/__tests__/list-tasks.test.ts` (1.5h)
3. **Update Task Status** - `tasks/__tests__/update-task-status.test.ts` (1.5h)

---

### Phase 5: CRUD Operations - Batch 2 & Integrations (7 use cases - Week 4, Days 14-16)
**Goal**: Complete remaining CRUD and integration operations  
**Effort**: 7 use cases × 4 tests avg = 28 tests  
**Timeline**: 3 days

#### Day 14: User Management (2 use cases)
1. **Get User Profile** - `user/__tests__/get-user-profile.test.ts` (2h)
2. **Update User Profile** - `user/__tests__/update-user-profile.test.ts` (2.5h)

#### Day 15: Calendar Sync (3 use cases)
1. **Get Staff Availability** - `calendar-sync/__tests__/get-staff-availability.test.ts` (2h)
2. **Suggest Meeting Times** - `calendar-sync/__tests__/suggest-meeting-times.test.ts` (2h)
3. **Sync Interaction to Calendar** - `calendar-sync/__tests__/sync-interaction-to-calendar.test.ts` (2h)

#### Day 16: Email & Marketing (2 use cases)
1. **Sync User Emails** - `email-sync/__tests__/sync-user-emails.test.ts` (2.5h)
2. **Send Campaign** - `campaigns/__tests__/send-campaign.test.ts` (2.5h)
3. **Log Interaction** - `interactions/__tests__/log-interaction.test.ts` (1.5h)

---

## Testing Standards & Patterns

### Test Structure Template
```typescript
import { describe, it, expect } from 'vitest';
import { Effect, Layer } from 'effect';
import { ValidationError } from '@dykstra/domain';
import { useCase } from '../use-case-file';
import { Port, type PortService, NetworkError } from '../../../ports/port';

describe('Use Case X.Y: [Use Case Name]', () => {
  describe('Happy Paths', () => {
    it('should [primary success scenario]', async () => {
      // Arrange: Create mock port
      const mockPort: PortService = {
        method: () => Effect.succeed(mockData),
        // ... other methods with Effect.fail(new NetworkError('Not implemented'))
      };

      // Act: Execute use case
      const result = await Effect.runPromise(
        useCase(command).pipe(
          Effect.provide(Layer.succeed(Port, mockPort))
        )
      );

      // Assert: Verify result and port calls
      expect(result.someProperty).toBe(expectedValue);
      expect(mockPort.method).toHaveBeenCalledWith(expectedArgs);
    });

    it('should [secondary success scenario]', async () => {
      // Additional happy path test
    });
  });

  describe('Validation Errors', () => {
    it('should fail when [required field] is missing', async () => {
      const invalidCommand = { ...baseCommand, field: '' };
      
      const result = Effect.runPromise(
        useCase(invalidCommand).pipe(
          Effect.provide(Layer.succeed(Port, mockPort))
        )
      );

      await expect(result).rejects.toThrow('[Field] is required');
    });
  });

  describe('Edge Cases', () => {
    it('should handle [edge case scenario]', async () => {
      // Edge case test
    });
  });

  describe('Network Errors', () => {
    it('should handle network error from [PortName]', async () => {
      const mockPort: PortService = {
        method: () => Effect.fail(new NetworkError('Connection timeout')),
      };

      const result = Effect.runPromise(
        useCase(command).pipe(
          Effect.provide(Layer.succeed(Port, mockPort))
        )
      );

      await expect(result).rejects.toThrow('Connection timeout');
    });
  });
});
```

### Test Coverage Requirements Per Use Case
- **Minimum**: 4 tests (1 happy path, 1 validation error, 1 edge case, 1 network error)
- **Standard**: 6-8 tests (2-3 happy paths, 2-3 validation errors, 1-2 edge cases, 1 network error)
- **Complex**: 10-20 tests (multiple happy paths, comprehensive validation, business rule edge cases)

### Test Categories
1. **Happy Paths**: Test successful execution with valid inputs
2. **Validation Errors**: Test command validation (required fields, format, constraints)
3. **Business Rule Violations**: Test domain rules (insufficient inventory, duplicate entries, etc.)
4. **Edge Cases**: Test boundary conditions (empty lists, zero amounts, null optionals)
5. **Network Errors**: Test port failure handling (Effect.fail propagation)

---

## Success Metrics

### Quantitative Goals
- ✅ 100% use case coverage (76/76 use cases tested)
- ✅ Minimum 4 tests per use case (304+ total tests, target: 350-400)
- ✅ All tests passing (green build)
- ✅ Zero TypeScript compilation errors
- ✅ No test timeouts or flaky tests

### Qualitative Goals
- ✅ Consistent test patterns across all use cases
- ✅ Clear test descriptions (should statements)
- ✅ Comprehensive mock coverage (all port methods stubbed)
- ✅ Proper error message assertions
- ✅ Documentation of complex test scenarios

---

## Risk Assessment & Mitigation

### Risk 1: Test Implementation Complexity for High-Value Use Cases
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**:
- Allocate extra time for complex use cases (Phase 1)
- Pair programming for fuzzy matching and recommendation logic
- Reference existing complex test patterns (inventory transfer, vendor bill processing)

### Risk 2: Mock Data Maintenance Overhead
**Likelihood**: High  
**Impact**: Medium  
**Mitigation**:
- Create shared test fixtures for common entities (cases, contracts, contacts)
- Use factory functions for mock data generation
- Document mock data patterns in test README

### Risk 3: Test Suite Performance (300+ tests)
**Likelihood**: Medium  
**Impact**: Low  
**Mitigation**:
- Use Vitest's parallel execution (default)
- Avoid unnecessary async delays in tests
- Monitor test suite execution time (target: <10 seconds total)

### Risk 4: Duplicate Coverage (Some Use Cases May Be Tested Indirectly)
**Likelihood**: Low  
**Impact**: Low  
**Mitigation**:
- Audit `payments/get-ar-aging-report.ts` vs `financial/ar-aging-report.ts` (likely duplicate)
- Audit `payments/process-refund.ts` vs `financial/refund-processing.ts` (likely duplicate)
- Consolidate if true duplicates found

---

## Timeline Summary

| Phase | Days | Use Cases | Tests | Completion Date |
|-------|------|-----------|-------|-----------------|
| Phase 1: High-Value Business Logic | 5 | 6 | 48 | End of Week 1 |
| Phase 2: Supporting Features | 5 | 11 | 66 | End of Week 2 |
| Phase 3: Query & Payment Ops | 2 | 6 | 30 | Week 3 (Days 9-10) |
| Phase 4: CRUD Batch 1 | 3 | 13 | 52 | Week 3 (Days 11-13) |
| Phase 5: CRUD Batch 2 & Integrations | 3 | 7 | 28 | Week 4 (Days 14-16) |
| **Total** | **18 days** | **43** | **224** | **End of Week 4** |

**Buffer**: 2 days for bug fixes and test refinement  
**Total Project Duration**: 20 days (4 weeks)

---

## Deliverables Checklist

### Week 1 Deliverables
- [ ] 6 new test files for high-value business logic
- [ ] 48+ tests passing (all green)
- [ ] Code review completed for complex test logic
- [ ] Documentation of test patterns for recommendation engine

### Week 2 Deliverables
- [ ] 11 new test files for supporting features
- [ ] 66+ tests passing (cumulative: 114+ tests)
- [ ] Update test coverage report in README
- [ ] Identify and document any duplicate use cases

### Week 3 Deliverables
- [ ] 19 new test files (query ops + CRUD batch 1)
- [ ] 82+ tests passing (cumulative: 196+ tests)
- [ ] Test fixture library created for common entities
- [ ] Mid-project retrospective (adjust timeline if needed)

### Week 4 Deliverables
- [ ] 7 new test files (CRUD batch 2 + integrations)
- [ ] 28+ tests passing (cumulative: 224+ tests)
- [ ] 100% use case coverage achieved (76/76)
- [ ] Final test suite performance benchmark (<10s total)
- [ ] Update documentation with final coverage stats

---

## Post-Implementation Tasks

### 1. Test Suite Optimization
- [ ] Profile test execution times
- [ ] Identify and optimize slow tests (>1s)
- [ ] Add test groups for selective execution
- [ ] Document test suite performance baseline

### 2. Documentation Updates
- [ ] Update main README with 100% coverage badge
- [ ] Create test coverage dashboard
- [ ] Document testing patterns and best practices
- [ ] Add test examples to contributor guide

### 3. CI/CD Integration
- [ ] Ensure all tests run in CI pipeline
- [ ] Configure test failure notifications
- [ ] Add coverage threshold enforcement (100%)
- [ ] Set up automatic coverage reports

### 4. Maintenance Plan
- [ ] Define test maintenance ownership
- [ ] Create process for updating tests when use cases change
- [ ] Schedule quarterly test suite review
- [ ] Track and resolve flaky tests

---

## Appendix A: Use Case Testing Checklist

Use this checklist to track progress:

### Phase 1: High-Value Business Logic
- [ ] `contract/service-arrangement-recommendations.test.ts`
- [ ] `contacts/find-duplicates.test.ts`
- [ ] `financial/process-case-payment.test.ts`
- [ ] `inventory/reserve-inventory-for-case.test.ts`
- [ ] `email-sync/match-email-to-entity.test.ts`
- [ ] `contacts/merge-contacts.test.ts`

### Phase 2: Supporting Features
- [ ] `contracts/catalog-queries.test.ts`
- [ ] `contracts/contract-operations.test.ts`
- [ ] `contracts/template-operations.test.ts`
- [ ] `case-management/convert-lead-to-case-with-contract.test.ts`
- [ ] `case-management/get-audit-log.test.ts`
- [ ] `case-management/get-financial-summary.test.ts`
- [ ] `case-management/update-case-status.test.ts`
- [ ] `staff/get-analytics.test.ts`
- [ ] `staff/get-dashboard-stats.test.ts`
- [ ] `staff/get-task-dashboard.test.ts`
- [ ] `staff/list-staff-members.test.ts`

### Phase 3: Query & Payment Operations
- [ ] `payments/get-payment-by-id.test.ts`
- [ ] `payments/get-payment-stats.test.ts`
- [ ] `payments/list-payments.test.ts`
- [ ] `payments/record-manual-payment.test.ts`
- [ ] `leads/convert-lead-to-case.test.ts`
- [ ] `leads/create-lead.test.ts`

### Phase 4: CRUD Batch 1
- [ ] `notes/create-note.test.ts`
- [ ] `notes/update-note.test.ts`
- [ ] `notes/delete-note.test.ts`
- [ ] `notes/list-notes.test.ts`
- [ ] `notes/get-note-history.test.ts`
- [ ] `invitations/create-invitation.test.ts`
- [ ] `invitations/list-invitations.test.ts`
- [ ] `invitations/resend-invitation.test.ts`
- [ ] `invitations/revoke-invitation.test.ts`
- [ ] `invitations/get-invitation-history.test.ts`
- [ ] `tasks/create-task.test.ts`
- [ ] `tasks/list-tasks.test.ts`
- [ ] `tasks/update-task-status.test.ts`

### Phase 5: CRUD Batch 2 & Integrations
- [ ] `user/get-user-profile.test.ts`
- [ ] `user/update-user-profile.test.ts`
- [ ] `calendar-sync/get-staff-availability.test.ts`
- [ ] `calendar-sync/suggest-meeting-times.test.ts`
- [ ] `calendar-sync/sync-interaction-to-calendar.test.ts`
- [ ] `email-sync/sync-user-emails.test.ts`
- [ ] `campaigns/send-campaign.test.ts`
- [ ] `interactions/log-interaction.test.ts`

---

## Appendix B: Test Fixture Examples

### Example: Case Fixture
```typescript
export const createMockCase = (overrides?: Partial<Case>): Case => ({
  id: 'case-001',
  caseNumber: 'CASE-2025-001',
  familyName: 'Smith',
  decedentName: 'John Smith',
  status: 'active',
  totalAmount: 8500,
  amountPaid: 0,
  balance: 8500,
  createdAt: new Date('2025-01-15'),
  ...overrides,
});
```

### Example: Contract Fixture
```typescript
export const createMockContract = (overrides?: Partial<GoContract>): GoContract => ({
  id: 'contract-001',
  contractNumber: 'CN-2025-001',
  contractDate: new Date('2025-01-15'),
  contractType: 'at-need',
  totalAmount: 8500,
  status: 'active',
  ...overrides,
});
```

### Example: Payment Fixture
```typescript
export const createMockPayment = (overrides?: Partial<Payment>): Payment => ({
  id: 'payment-001',
  caseId: 'case-001',
  amount: 5000,
  paymentDate: new Date('2025-01-20'),
  paymentMethod: 'credit_card',
  status: 'completed',
  ...overrides,
});
```

---

## Success Criteria

The test coverage plan will be considered complete when:

1. ✅ All 76 use cases have dedicated test files (or are covered by consolidated test files)
2. ✅ All test files follow the established pattern (happy paths, validation, edge cases, network errors)
3. ✅ Minimum 300 total tests across all use cases (current: 208, need: 92+)
4. ✅ 100% of tests passing (green build)
5. ✅ Zero TypeScript compilation errors
6. ✅ Test suite execution time <10 seconds
7. ✅ Documentation updated with final coverage statistics
8. ✅ All deliverables reviewed and approved

---

## Conclusion

This plan provides a structured approach to achieving 100% test coverage across all 76 use cases in the Dykstra Funeral Home ERP. By prioritizing high-value business logic first and batching CRUD operations, we can efficiently build comprehensive test coverage while maintaining quality and consistency.

The 4-week timeline is realistic and includes buffer time for unexpected complexity. Regular checkpoint reviews at the end of each week will ensure we stay on track and can adjust the plan as needed.

**Next Step**: Review and approve this plan, then begin Phase 1 (High-Value Business Logic) implementation.
