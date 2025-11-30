# Phase 6 Technical Debt: Missing Go Backend Port Methods

## Overview

During Phase 6 implementation (Use Cases 6.1-6.8), several use cases were simplified due to missing methods on the Go backend ports. This document tracks the gaps that need to be addressed when the full Go backend is implemented.

**Status**: Technical debt for future Go backend development
**Priority**: Medium (affects production-ready payment/refund workflows)
**Estimated Effort**: 2-3 weeks of Go backend development

---

## Missing Port Methods

### 1. GoFinancialPort - Payment Management

#### 1.1 `getPayment(paymentId: string)`
**Required by**: 
- Use Case 6.1: Insurance Claim Processing
- Use Case 6.2: Batch Payment Application  
- Use Case 6.3: Refund Processing

**Purpose**: Retrieve payment details by ID

**Expected Signature**:
```typescript
readonly getPayment: (
  paymentId: string
) => Effect.Effect<GoPayment, NotFoundError | NetworkError>;
```

**Go Backend Requirements**:
- Query payment by ID from payment aggregate
- Include payment status, amount, method, invoice ID
- Return NotFoundError if payment doesn't exist

**Current Workaround**: 
- Use Case 6.3 (Refund Processing): Skips payment validation, generates placeholder refund IDs
- Use Case 6.2 (Batch Payment): Assumes allocations are always valid

---

#### 1.2 `updatePaymentStatus(command: UpdatePaymentStatusCommand)`
**Required by**:
- Use Case 6.3: Refund Processing
- Use Case 6.2: Batch Payment Application

**Purpose**: Update payment status after refund or application

**Expected Signature**:
```typescript
readonly updatePaymentStatus: (
  command: {
    paymentId: string;
    status: 'pending' | 'cleared' | 'reversed' | 'failed';
    notes?: string;
  }
) => Effect.Effect<void, NetworkError>;
```

**Go Backend Requirements**:
- Update payment aggregate status
- Emit PaymentStatusChanged event
- Support SCD2 versioning for audit trail
- Allow notes/reason for status change

**Current Workaround**: 
- Use Case 6.3: Doesn't update original payment status (breaks audit trail)
- Refunds are recorded but original payment isn't marked as 'reversed'

---

#### 1.3 `listPaymentsByInvoice(invoiceId: string)`
**Potential Use**: Track multiple payments and refunds for an invoice

**Expected Signature**:
```typescript
readonly listPaymentsByInvoice: (
  invoiceId: string
) => Effect.Effect<readonly GoPayment[], NetworkError>;
```

**Go Backend Requirements**:
- Query all payments related to an invoice
- Include refunds (negative amounts)
- Useful for calculating net paid amount and refund history

---

### 2. GoFinancialPort - Procurement Integration (VERIFIED IN GO BACKEND)

**✅ AUDIT RESULT**: Go backend HAS extensive procurement functionality!

After auditing the Go backend codebase, I found:
- ✅ Complete PO module: `/cmd/api/register_po.go` with 8+ endpoints
- ✅ PO lifecycle: Create, Get, List, Approve, Issue, Receive, Return, Close
- ✅ Receipt tracking with quantity variances (`ReceivePOCommand`)
- ✅ 3-way match engine: `/internal/domain/apmatch/engine.go`
- ✅ Tolerance configuration (price BPS, qty%, date variance)
- ✅ E2E test coverage: `test/contract/e2e_purchase_3way_match_test.go`

**TypeScript Port Integration Status**:

#### 2.1 ❌ MISSING: `GoProcurementPort` for PO/Receipt queries

**Issue**: TypeScript has no port to query Go backend PO/receipt data.

**Go Backend Endpoints Available** (verified in `register_po.go`):
- `GET /po` - List POs
- `GET /po/{id}` - Get PO details (includes line items, receipts, status)
- `POST /po/receive` - Record receipt (already working!)

**Needed TypeScript Port**:
```typescript
export interface GoProcurementPortService {
  /**
   * Get purchase order by ID (with line items and receipts)
   */
  readonly getPurchaseOrder: (
    poId: string
  ) => Effect.Effect<GoPurchaseOrder, NotFoundError | NetworkError>;
  
  /**
   * List purchase orders with filters
   */
  readonly listPurchaseOrders: (
    filters?: {
      supplierId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ) => Effect.Effect<readonly GoPurchaseOrder[], NetworkError>;
}

interface GoPurchaseOrder {
  id: string;
  title: string;
  supplierID: string;
  status: 'draft' | 'pending' | 'approved' | 'issued' | 'receiving' | 'closed';
  createdAt: Date;
  approvedAt?: Date;
  issuedAt?: Date;
  lines: readonly {
    lineID: string;
    storeID: string;
    sku: string;
    qty: number;
    unitPriceCents: number;
    receivedQty: number; // For 3-way match!
  }[];
  receipts: readonly {
    lineID: string;
    qty: number;
    receivedAt: Date;
  }[];
}
```

**Action Required**:
1. Create `packages/application/src/ports/go-procurement-port.ts`
2. Create adapter `packages/infrastructure/src/adapters/go-backend/go-procurement-adapter.ts`
3. Wire up to existing Go backend `/po` endpoints
4. No Go backend changes needed - endpoints already exist!

---

#### 2.2 ✅ EXISTS: 3-Way Match Engine in Go Backend

**Location**: `/internal/domain/apmatch/engine.go`

**Features Already Implemented**:
- `MatchingTolerances` struct (price BPS, qty%, date variance)
- `APMatchingEngine` with configurable rules
- `ValidationRules` (exact SKU match, PO reference required, etc.)
- `ExceptionHandling` (auto-hold, escalation thresholds)

**TypeScript Integration**:
The `GoFinancialPort.getThreeWayMatchStatus()` method **already exists** and should work if properly connected. The Go backend has the matching engine; just needs TypeScript to call it.

**No additional Go backend work needed** - just ensure TypeScript adapter calls the correct endpoint.

---

#### 2.3 ⚠️ FUTURE: OCR Bill Scanning

**Status**: Not yet implemented in Go backend (placeholder only)

**TypeScript Port Method**: `uploadAndScanBill()` exists in port definition but adapter not functional.

**Go Backend Work Required** (future enhancement):
- Azure Form Recognizer / AWS Textract integration
- Document storage (S3/Azure Blob)
- OCR extraction pipeline
- Draft bill creation with confidence scores

**Current Workaround**: 
- Use Case 6.4: `processOCRBill()` returns empty placeholder
- Manual bill entry required

**Priority**: Low (OCR is nice-to-have, not critical for Phase 6)

---

### 3. GoFinancialPort - Invoice Query Extensions

#### 3.1 `listInvoices()` - Status Filter Enhancement
**Required by**: Use Case 6.2: Batch Payment Application

**Current Status**: ✅ Method exists but may need status filter validation

**Issue**: Current implementation accepts `status: 'unpaid'` but Go backend uses different enum values (`'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'`)

**Fix Needed**: 
- Update TypeScript types to match Go backend invoice status enum
- Or add `status: 'unpaid'` as a computed filter (sent + partial + overdue)

---

### 3. CreateJournalEntryCommand - Missing `reference` Field

**Required by**: Use Case 6.3: Refund Processing

**Current Interface**:
```typescript
export interface CreateJournalEntryCommand {
  entryDate: Date;
  description: string;
  lines: readonly Omit<GoJournalEntryLine, 'id' | 'accountNumber' | 'accountName'>[];
}
```

**Needed Enhancement**:
```typescript
export interface CreateJournalEntryCommand {
  entryDate: Date;
  description: string;
  reference?: string; // NEW: External reference (e.g., REFUND-PMT-001)
  lines: readonly Omit<GoJournalEntryLine, 'id' | 'accountNumber' | 'accountName'>[];
}
```

**Go Backend Requirements**:
- Add optional `reference` field to journal entry aggregate
- Useful for tracking refunds, adjustments, and linking to external systems

**Current Workaround**: Reference information embedded in `description` field

---

## Impact Analysis

### High Impact (Production Blockers)

1. **Refund Processing**: Cannot properly track refund status without `updatePaymentStatus()`
   - **Risk**: Refunded payments not marked as 'reversed', could lead to double refunds
   - **Mitigation**: Manual database updates or separate refund tracking table

2. **Payment Validation**: Cannot validate payment exists before processing refund
   - **Risk**: Refund processing on non-existent payments
   - **Mitigation**: Front-end validation only (not ideal)

### Medium Impact (Workflow Limitations)

3. **Procurement Port Integration**: TypeScript cannot query Go backend PO/receipt data
   - **Risk**: Cannot perform 3-way match validation (PO vs Receipt vs Bill)
   - **Impact**: Use Case 6.4 simplified without actual validation
   - **Root Cause**: Missing `GoProcurementPort` in TypeScript (Go backend ready!)
   - **Mitigation**: Create TypeScript port to existing Go `/po` endpoints

4. **Batch Payment Audit Trail**: Cannot track which payments were applied to which invoices
   - **Risk**: Difficult to audit multi-invoice payment allocations
   - **Mitigation**: Rely on journal entries for audit trail

5. **Insurance Claim Payment Tracking**: Cannot verify claim payment was received
   - **Risk**: Claim marked as paid without actual payment validation
   - **Mitigation**: Manual reconciliation

### Low Impact (Convenience Features)

6. **OCR Bill Scanning**: Cannot automatically extract bill data from PDF/images
   - **Risk**: Manual data entry required, increased errors
   - **Mitigation**: Manual bill entry only
   - **Affected Use Case**: 6.4 (Vendor Bill Processing)

7. **Journal Entry References**: Harder to trace refunds back to original payments
   - **Risk**: Reduced traceability in GL
   - **Mitigation**: Use description field

---

## Recommended Implementation Order

### Phase 1: Critical Payment Methods (1 week)
Priority: **HIGH** - Blocks production refund workflow

1. Implement `GoFinancialPort.getPayment()`
   - Go backend: Add payment query endpoint
   - TypeScript: Update port interface
   - Test: Integration tests for payment retrieval

2. Implement `GoFinancialPort.updatePaymentStatus()`
   - Go backend: Add payment status update endpoint with SCD2 versioning
   - TypeScript: Update port interface
   - Test: Verify status transitions and audit trail

### Phase 2: Procurement Port Integration (3-4 days)
Priority: **MEDIUM** - Enables full AP workflow (Go backend already has this!)

3. Create `GoProcurementPort` TypeScript interface
   - Define `getPurchaseOrder()` method
   - Define `listPurchaseOrders()` method
   - Map Go PO types to TypeScript (2 hours)

4. Create `GoProcurementAdapter` implementation
   - Connect to existing Go `/po` endpoints
   - No Go backend changes needed!
   - Test: Query PO by ID, verify receipt data (4 hours)

5. Wire up to Use Case 6.4 (Vendor Bill Processing)
   - Refactor `validate3WayMatch()` to call real Go backend
   - Use `getPurchaseOrder()` to fetch PO line items
   - Compare bill vs PO vs receipts
   - Test: 3-way match scenarios with variances (4 hours)

### Phase 3: Enhanced Features (1 week)
Priority: **LOW** - Nice-to-have improvements

6. Add `reference` field to `CreateJournalEntryCommand`
   - Go backend: Extend journal entry aggregate
   - TypeScript: Update command interface
   - Test: Verify reference field persisted

7. Implement `GoFinancialPort.listPaymentsByInvoice()`
   - Go backend: Add payment query by invoice
   - TypeScript: Update port interface
   - Test: Query multiple payments for invoice

8. Implement `GoFinancialPort.uploadAndScanBill()` (OCR)
   - Go backend: Azure Form Recognizer integration
   - TypeScript: Already defined in port
   - Test: Upload PDF, verify extracted fields

### Phase 4: Refactor Use Cases (5-7 days)
Priority: **MEDIUM** - Technical debt cleanup

9. Refactor Use Case 6.3 (Refund Processing)
   - Remove simplified implementation
   - Add full payment validation via `getPayment()`
   - Update payment status via `updatePaymentStatus()`
   - Add integration tests for full workflow

10. Refactor Use Case 6.4 (Vendor Bill Processing)
   - Implement actual 3-way match validation
   - Call `getPurchaseOrder()` and `listReceiptsByPO()`
   - Calculate variances and apply ±5% tolerance
   - Implement OCR bill processing via `uploadAndScanBill()`
   - Add integration tests for 3-way match scenarios

11. Enhance Use Case 6.2 (Batch Payment Application)
   - Add payment status validation
   - Track payment application in database
   - Add tests for payment status updates

12. Enhance Use Case 6.1 (Insurance Claim Processing)
   - Add actual claim payment recording (not simulated)
   - Link to payment repository
   - Add tests for claim-to-payment linkage

---

## Code Changes Required

### Go Backend (Estimated 40 hours)

#### 1. Payment Query Endpoint
```go
// In cmd/api/handlers/payment.go
func (h *PaymentHandler) GetPayment(c *gin.Context) {
    paymentID := c.Param("id")
    
    // Query payment aggregate from event store
    payment, err := h.paymentService.GetByID(paymentID)
    if err != nil {
        c.JSON(404, gin.H{"error": "Payment not found"})
        return
    }
    
    c.JSON(200, payment)
}
```

#### 2. Payment Status Update Endpoint
```go
// In internal/payment/service.go
func (s *PaymentService) UpdateStatus(cmd UpdateStatusCommand) error {
    payment, err := s.repo.GetByID(cmd.PaymentID)
    if err != nil {
        return err
    }
    
    // Emit PaymentStatusChanged event
    event := PaymentStatusChanged{
        PaymentID: cmd.PaymentID,
        OldStatus: payment.Status,
        NewStatus: cmd.Status,
        Reason: cmd.Notes,
        ChangedAt: time.Now(),
        ChangedBy: cmd.ActorID,
    }
    
    // Persist event to EventStoreDB
    return s.eventStore.AppendToStream(payment.StreamID, event)
}
```

#### 3. Journal Entry Reference Field
```go
// In internal/financial/aggregate/journal_entry.go
type JournalEntry struct {
    ID          string
    EntryNumber string
    EntryDate   time.Time
    Description string
    Reference   string // NEW: External reference field
    Lines       []JournalEntryLine
    Status      string
}
```

### TypeScript Changes (Estimated 8 hours)

#### 1. Update GoFinancialPort Interface
```typescript
// In packages/application/src/ports/go-financial-port.ts
export interface GoFinancialPortService {
  // ... existing methods
  
  /**
   * Get payment by ID
   */
  readonly getPayment: (
    id: string
  ) => Effect.Effect<GoPayment, NotFoundError | NetworkError>;
  
  /**
   * Update payment status (for refunds, failures, etc.)
   */
  readonly updatePaymentStatus: (
    command: {
      paymentId: string;
      status: GoPayment['status'];
      notes?: string;
    }
  ) => Effect.Effect<void, NetworkError>;
  
  /**
   * List all payments for an invoice (including refunds)
   */
  readonly listPaymentsByInvoice: (
    invoiceId: string
  ) => Effect.Effect<readonly GoPayment[], NetworkError>;
}
```

#### 2. Update CreateJournalEntryCommand
```typescript
// In packages/application/src/ports/go-financial-port.ts
export interface CreateJournalEntryCommand {
  readonly entryDate: Date;
  readonly description: string;
  readonly reference?: string; // NEW: Optional external reference
  readonly lines: readonly Omit<GoJournalEntryLine, 'id' | 'accountNumber' | 'accountName'>[];
}
```

#### 3. Refactor Refund Processing Use Case
```typescript
// In packages/application/src/use-cases/financial/refund-processing.ts

// BEFORE (simplified):
const refundPaymentId = `refund-${Date.now()}-${Math.random().toString(36).substring(7)}`;

// AFTER (full implementation):
const originalPayment = yield* financialPort.getPayment(command.paymentId);

// Validate payment is refundable
if (originalPayment.status === 'reversed' || originalPayment.status === 'failed') {
  return yield* Effect.fail(
    new ValidationError({ message: 'Payment cannot be refunded' })
  );
}

// Create refund payment record
const refundPayment = yield* financialPort.recordPayment({
  invoiceId: originalPayment.invoiceId,
  amount: -command.refundAmount,
  paymentDate: refundDate,
  paymentMethod: originalPayment.paymentMethod,
  referenceNumber: `REFUND-${originalPayment.paymentNumber}`,
});

// Update original payment status
yield* financialPort.updatePaymentStatus({
  paymentId: command.paymentId,
  status: command.refundAmount === originalPayment.amount ? 'reversed' : 'pending',
  notes: `Refund processed: $${command.refundAmount}`,
});
```

---

## Testing Requirements

### Go Backend Tests
1. **Unit Tests**: Payment service methods (GetByID, UpdateStatus)
2. **Integration Tests**: Payment query endpoints with EventStoreDB
3. **Contract Tests**: Verify TypeScript port matches Go API spec

### TypeScript Tests
1. **Update Existing**: Refund processing tests to use real payment methods
2. **New Tests**: Payment status update workflows
3. **Integration Tests**: End-to-end refund with payment status tracking

---

## Success Criteria

### Definition of Done
- [ ] All 4 missing methods implemented in Go backend
- [ ] OpenAPI spec updated with new endpoints
- [ ] TypeScript ports updated with proper signatures
- [ ] Use Cases 6.1, 6.2, 6.3 refactored to use new methods
- [ ] Integration tests pass for refund workflow
- [ ] Contract validation passes (Phase 1-4 from validation system)
- [ ] Zero TypeScript compilation errors
- [ ] Documentation updated

### Verification
```bash
# 1. Run contract validation
pnpm validate:contracts

# 2. Run integration tests
pnpm --filter @dykstra/application test

# 3. Run E2E refund workflow test
pnpm test:e2e refund-processing

# 4. Verify OpenAPI spec matches TypeScript
pnpm validate:contracts:openapi
```

---

## Related Documentation

- **Backend Contract Validation**: [docs/BACKEND_CONTRACT_VALIDATION_COMPLETE.md](./BACKEND_CONTRACT_VALIDATION_COMPLETE.md)
- **Phase 6 Implementation Plan**: [docs/IMPLEMENTATION_PLAN_REMAINING_20_USE_CASES.md](./IMPLEMENTATION_PLAN_REMAINING_20_USE_CASES.md)
- **Clean Architecture Guidelines**: [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Go Backend Repository**: `../go-erp/` (when available)

---

## Notes

- **Backward Compatibility**: Ensure new methods don't break existing use cases (Phases 1-5)
- **SCD2 Pattern**: All payment status updates must create new versions for audit trail
- **Event Sourcing**: Payment updates should emit events to EventStoreDB
- **TigerBeetle Integration**: Refund GL entries must post to TigerBeetle for double-entry bookkeeping

---

**Last Updated**: 2025-11-30
**Author**: AI Development Agent
**Reviewers**: [To be assigned]
