# Pre-Implementation Checklist: Verify Before Assuming Technical Debt

## Purpose

Prevent false assumptions about "missing" Go backend methods by systematically verifying what actually exists before claiming technical debt.

**Lesson Learned**: During Use Case 6.4 (Vendor Bill Processing), we initially documented extensive "missing" methods for procurement and 3-way match. After auditing the Go backend, we discovered **ALL methods already existed** since Week 1, fully tested with E2E coverage. The only missing piece was TypeScript integration.

---

## ✅ Pre-Implementation Verification Checklist

### Step 1: Check TypeScript Ports First

**Before assuming a method is missing, check if the port already exists:**

```bash
# Search for the port interface in TypeScript
grep -r "interface Go.*PortService" packages/application/src/ports/

# Search for specific method name
grep -r "readonly methodName" packages/application/src/ports/
```

**Example**:
```bash
# Check if getPurchaseOrder exists
grep -r "getPurchaseOrder" packages/application/src/ports/

# Result: Found in go-procurement-port.ts!
```

**✅ Action**: If port exists in TypeScript, move to Step 2.
**❌ Action**: If port doesn't exist, move to Step 3 to check Go backend.

---

### Step 2: Check TypeScript Adapters

**If the port exists, verify the adapter implementation:**

```bash
# Check if adapter exists for this port
ls packages/infrastructure/src/adapters/go-backend/ | grep -i procurement

# Check adapter implementation
grep -A 20 "getPurchaseOrder:" packages/infrastructure/src/adapters/go-backend/go-*-adapter.ts
```

**✅ Action**: If adapter exists and looks complete, you're ready to use it!
**⚠️ Action**: If adapter exists but incomplete, add the missing method to adapter.
**❌ Action**: If no adapter exists, create one (but first verify Go backend in Step 3).

---

### Step 3: Audit Go Backend Codebase

**Before claiming "missing Go backend method", systematically search the actual Go codebase:**

#### 3.1 Search for HTTP Endpoints

```bash
# Search Go backend for HTTP route registrations
cd /path/to/go-backend
grep -r "router\\.GET\\|router\\.POST" cmd/api/ internal/app/

# Search for specific endpoint patterns
grep -r "/po\|/procurement\|/contracts" cmd/api/register*.go
```

**Example from our audit**:
```bash
# Found extensive PO module
$ grep -r "register.*[Pp]" cmd/api/
cmd/api/register_po.go:func registerPO(d runtime.Deps)
cmd/api/register_procurement.go:func registerProcurementWithDeps(...)
```

#### 3.2 Search for Service Methods

```bash
# Search for service layer methods
grep -r "func.*GetPurchaseOrder\|func.*Get.*PO" internal/application/commands/

# Search for domain types
grep -r "type PurchaseOrder struct" internal/domain/
```

#### 3.3 Check E2E Tests

**E2E tests are proof the endpoint exists and works:**

```bash
# Search for E2E tests that exercise the functionality
grep -r "TestE2E.*Purchase\|TestE2E.*Procurement" test/contract/ internal/app/

# Example: Found in our audit
test/contract/e2e_purchase_3way_match_test.go - Full 3-way match test!
```

**✅ If E2E tests exist**: The Go backend is production-ready. You just need TypeScript integration.

#### 3.4 Check Go Type Definitions

```bash
# Verify the Go types match what you need
grep -A 30 "type PO struct\|type PurchaseOrder struct" internal/application/commands/po/types.go
```

---

### Step 4: Cross-Reference Implementation Plan

**Check your implementation plan documents for verified ports:**

```bash
# Search your implementation plan for port verification
grep -r "verified exists\|✅.*Port" docs/*.md
```

**From our Implementation Plan**:
```markdown
✅ Procurement port has 80+ endpoints
✅ GoProcurementPort (verified exists with 24 methods)
✅ 3-way match engine: /internal/domain/apmatch/engine.go
```

---

### Step 5: Document Findings in Verification Matrix

**Create a verification matrix BEFORE implementation:**

| Feature | TypeScript Port | TypeScript Adapter | Go Backend Endpoint | Go E2E Tests | Status |
|---------|----------------|-------------------|-------------------|--------------|--------|
| Get PO | ✅ go-procurement-port.ts | ✅ go-procurement-adapter.ts | ✅ GET /po/{id} | ✅ e2e_purchase_3way_match_test.go | **READY** |
| Get Receipts | ✅ go-procurement-port.ts | ✅ go-procurement-adapter.ts | ✅ GET /receipts | ✅ e2e_purchase_3way_match_test.go | **READY** |
| 3-Way Match | ✅ GoThreeWayMatchStatus type | ❌ Not wired up | ✅ /internal/domain/apmatch/ | ✅ Full test coverage | **NEEDS WIRING** |

**Conclusion from Matrix**: No Go backend work needed, just wire up TypeScript!

---

## 🚫 Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: "Simplified Implementation" Without Verification

**Bad**:
```typescript
// ⚠️ TECHNICAL DEBT: Simplified implementation
// Missing Go backend methods: getPurchaseOrder()
// In production, would fetch PO from backend...
return { isValid: true }; // Placeholder
```

**Problem**: Never checked if `getPurchaseOrder()` actually exists!

**Good**:
```typescript
// ✅ Step 1: Verify port exists
grep -r "getPurchaseOrder" packages/application/src/ports/
// Found: go-procurement-port.ts line 255

// ✅ Step 2: Use actual implementation
const po = yield* procurementPort.getPurchaseOrder(poId);
return validate3WayMatch(po, receipts, bill);
```

---

### ❌ Anti-Pattern 2: Creating Technical Debt Docs Without Verification

**Bad**:
```markdown
## Missing Go Backend Methods

1. getPurchaseOrder() - DOES NOT EXIST
2. listReceipts() - DOES NOT EXIST
3. perform3WayMatch() - DOES NOT EXIST

Estimated: 2-3 weeks Go backend development
```

**Problem**: Created 3 weeks of fake work because we didn't audit the Go backend first!

**Good**:
```markdown
## Pre-Implementation Audit Results

✅ Verified Go Backend:
- GET /po/{id} exists (cmd/api/register_po.go:114)
- GET /receipts exists (cmd/api/register_po.go:179)
- 3-way match engine exists (internal/domain/apmatch/engine.go)

❌ Actually Missing:
- None! TypeScript just needs to call existing endpoints.

Action: Create TypeScript adapter (4 hours, not 3 weeks!)
```

---

## 📋 Template: Pre-Implementation Verification Report

Use this template before starting ANY use case:

```markdown
# Pre-Implementation Verification: Use Case X.X

## Use Case Name
[Name of use case]

## Required Operations
1. Operation 1 (e.g., "Get Purchase Order")
2. Operation 2 (e.g., "Validate 3-way match")
3. Operation 3 (e.g., "Create vendor bill")

## Verification Results

### Operation 1: Get Purchase Order
- [ ] TypeScript port exists? Path: _____
- [ ] TypeScript adapter exists? Path: _____
- [ ] Go backend endpoint exists? Endpoint: _____
- [ ] Go backend tests exist? Test file: _____
- **Status**: [READY | NEEDS ADAPTER | NEEDS GO BACKEND]

### Operation 2: Validate 3-way match
- [ ] TypeScript port exists? Path: _____
- [ ] TypeScript adapter exists? Path: _____
- [ ] Go backend endpoint exists? Endpoint: _____
- [ ] Go backend tests exist? Test file: _____
- **Status**: [READY | NEEDS ADAPTER | NEEDS GO BACKEND]

### Operation 3: Create vendor bill
- [ ] TypeScript port exists? Path: _____
- [ ] TypeScript adapter exists? Path: _____
- [ ] Go backend endpoint exists? Endpoint: _____
- [ ] Go backend tests exist? Test file: _____
- **Status**: [READY | NEEDS ADAPTER | NEEDS GO BACKEND]

## Summary
- ✅ Ready to implement: X operations
- ⚠️ Need TypeScript adapter: Y operations (estimate: Z hours)
- ❌ Need Go backend work: 0 operations (YAY!)

## Estimated Effort
- TypeScript implementation: X hours
- TypeScript adapter work: Y hours
- Go backend work: 0 hours (all exists!)
- **Total**: X+Y hours (not weeks!)
```

---

## 🔍 Verification Commands Cheat Sheet

### Quick Port Check
```bash
# Check if port exists
ls packages/application/src/ports/ | grep -i [keyword]

# Check if method exists in port
grep -r "readonly methodName" packages/application/src/ports/
```

### Quick Adapter Check
```bash
# Check if adapter exists
ls packages/infrastructure/src/adapters/go-backend/ | grep -i [keyword]

# Check adapter implementation
grep -A 10 "methodName:" packages/infrastructure/src/adapters/go-backend/*.ts
```

### Quick Go Backend Check
```bash
# Check endpoints (adjust path to your Go backend)
cd /path/to/go-backend
grep -r "GET\|POST\|PUT\|DELETE" cmd/api/register*.go | grep -i [keyword]

# Check E2E tests
grep -r "TestE2E" test/contract/ internal/app/ | grep -i [keyword]

# Check domain logic
grep -r "type.*struct\|func" internal/domain/ | grep -i [keyword]
```

---

## 🎯 Success Criteria

Before claiming "technical debt" or "missing Go backend method":

✅ **Verified TypeScript Port**: Searched all `packages/application/src/ports/*.ts`
✅ **Verified TypeScript Adapter**: Searched all `packages/infrastructure/src/adapters/go-backend/*.ts`
✅ **Verified Go Backend**: Searched actual Go codebase for endpoints and types
✅ **Verified E2E Tests**: Found E2E tests proving the feature works
✅ **Created Verification Matrix**: Documented findings in table format
✅ **Estimated Accurately**: Distinguished between "needs wiring" (hours) vs "needs building" (weeks)

---

## 📚 Reference: Where to Look

### TypeScript Side
```
packages/application/src/ports/          - Port interfaces
packages/infrastructure/src/adapters/    - Adapter implementations
packages/application/src/use-cases/      - Use case implementations
```

### Go Backend Side (adjust paths)
```
cmd/api/register*.go                     - HTTP route registration
internal/application/commands/           - Service layer commands
internal/domain/                         - Domain logic and types
test/contract/                           - E2E tests (proof it works!)
internal/app/e2e_*_test.go              - More E2E tests
```

### Documentation
```
docs/BACKEND_REALITY_CHECK.md            - Your Go backend verification doc
docs/PHASE_6_TECHNICAL_DEBT.md           - Technical debt tracking
Implementation Plan notebooks             - Verified port lists
```

---

## 🚀 Process Integration

### Add to Development Workflow

1. **Before Starting Use Case**:
   - Run Pre-Implementation Verification Checklist
   - Fill out Verification Report template
   - Share findings with team

2. **During Implementation**:
   - Reference Verification Report
   - Only mark as "technical debt" if Go backend truly missing
   - Distinguish "needs wiring" from "needs building"

3. **After Implementation**:
   - Update verification matrix with actual status
   - Document any surprises or false assumptions
   - Share lessons learned

---

## 📝 Example: Use Case 6.4 Correct Process

### What We Should Have Done

**Step 1**: Pre-Implementation Verification
```bash
# Check TypeScript
$ grep -r "GoProcurementPort" packages/application/src/ports/
✅ Found: go-procurement-port.ts (425 lines, 24 methods)

# Check Go Backend
$ grep -r "GET /po" tigerbeetle-trial-app-1/cmd/api/
✅ Found: register_po.go with 8+ endpoints

# Check E2E Tests
$ grep -r "TestE2E.*Purchase" tigerbeetle-trial-app-1/test/
✅ Found: e2e_purchase_3way_match_test.go (full test coverage!)
```

**Step 2**: Verification Report
```markdown
## Verification Results
- ✅ TypeScript port exists: go-procurement-port.ts
- ✅ TypeScript adapter exists: go-procurement-adapter.ts
- ✅ Go backend ready: 8+ endpoints, E2E tested
- ❌ Missing: Nothing! Just need to use it.

## Estimated Effort
- TypeScript implementation: 4 hours
- Go backend work: 0 hours
- **Total**: 4 hours (not 3 weeks!)
```

**Step 3**: Implement
```typescript
// Use actual methods that exist
const po = yield* procurementPort.getPurchaseOrder(poId);
const receipts = yield* procurementPort.getReceiptsByPurchaseOrder(poId);
return validate3WayMatch(po, receipts, billLineItems);
```

**Result**: Production-ready implementation in 4 hours instead of incorrectly documenting 3 weeks of "missing" work!

---

## ✨ Final Checklist Before ANY Use Case

```markdown
[ ] I have searched TypeScript ports for required methods
[ ] I have searched TypeScript adapters for implementations
[ ] I have searched Go backend codebase for endpoints
[ ] I have searched Go backend E2E tests for proof
[ ] I have filled out the Verification Report template
[ ] I have confirmed what's ACTUALLY missing vs what exists
[ ] I have estimated effort based on reality (hours vs weeks)
[ ] I am ready to implement using existing infrastructure!
```

---

**Remember**: Always verify FIRST, assume NEVER! The Go backend is more complete than you think. 🚀
