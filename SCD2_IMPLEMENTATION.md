# SCD Type 2 Temporal Persistence Implementation

## Overview

The Dykstra Funeral Home Family Portal now uses **Slowly Changing Dimension Type 2 (SCD2)** for persistence instead of traditional CRUD operations. This provides complete audit trails, point-in-time queries, and immutable history for legal compliance.

## Why SCD Type 2?

### Legal & Compliance Requirements
- **ESIGN Act Compliance**: Signed contracts must be immutable
- **Audit Trails**: Complete history of all changes for legal disputes
- **Payment Records**: Immutable financial records for accounting/audit
- **Regulatory Compliance**: Funeral home industry regulations require historical accuracy

### Business Benefits
- **Dispute Resolution**: "What did the contract say when it was signed?"
- **Historical Accuracy**: "How much had been paid as of June 15th?"
- **Change Tracking**: "Who changed what and when?"
- **Non-Destructive**: Never lose data - all versions preserved

## Architecture

### Key Concepts

#### 1. Business Key
An **immutable identifier** that remains constant across all versions of an entity.

```typescript
// Traditional CRUD: ID changes mean new entity
const case1 = { id: "abc123", status: "inquiry" }
const case2 = { id: "def456", status: "active" } // Different entity!

// SCD2: Business key stays constant
const version1 = { id: "row1", businessKey: "case_abc", version: 1, status: "inquiry" }
const version2 = { id: "row2", businessKey: "case_abc", version: 2, status: "active" }
// Same case, different versions
```

#### 2. Temporal Fields

| Field | Type | Purpose |
|-------|------|---------|
| `businessKey` | string | Immutable business identifier |
| `version` | number | Version number (1, 2, 3...) |
| `validFrom` | DateTime | When this version became effective |
| `validTo` | DateTime? | When superseded (null = current) |
| `isCurrent` | boolean | Fast current version lookup |

#### 3. Save Operation (Not Update!)

**Traditional CRUD:**
```sql
UPDATE cases SET status = 'active' WHERE id = 'abc123';
-- Data is lost forever!
```

**SCD2:**
```sql
-- Step 1: Close current version
UPDATE cases 
SET validTo = NOW(), isCurrent = false 
WHERE businessKey = 'case_abc' AND isCurrent = true;

-- Step 2: Insert new version
INSERT INTO cases (
  id, businessKey, version, validFrom, validTo, isCurrent,
  status, -- other fields
) VALUES (
  'new_row_id', 'case_abc', 2, NOW(), NULL, true,
  'active', -- other fields
);
```

## Database Schema

### Case Table (Example)

```prisma
model Case {
  // Technical key (row ID)
  id              String    @id @default(cuid())
  
  // SCD2 fields
  businessKey     String                              // Immutable
  version         Int       @default(1)               // Increments
  validFrom       DateTime  @default(now())           // Effective date
  validTo         DateTime?                           // Superseded date (null = current)
  isCurrent       Boolean   @default(true)            // Fast lookup
  
  // Business fields
  funeralHomeId   String
  decedentName    String
  status          CaseStatus
  // ... other fields
  
  // Constraints
  @@unique([businessKey, version])           // Each version unique
  @@index([businessKey, isCurrent])          // Fast current lookup
  @@index([validFrom, validTo])              // Temporal queries
}
```

### Tables with SCD2

1. **Case** - Complete history of case changes
2. **Contract** - Immutable once signed (legal requirement)
3. **Signature** - Immutable by law (ESIGN Act)
4. **Payment** - Audit trail for accounting

## Code Implementation

### Domain Layer

```typescript
// packages/domain/src/entities/case.ts
export class Case {
  readonly businessKey: string;  // Immutable
  readonly version: number;       // Auto-incremented
  
  transitionStatus(newStatus: CaseStatus) {
    return new Case({
      ...this,
      version: this.version + 1,  // Increment on change
      status: newStatus,
    });
  }
}
```

### Repository Layer

```typescript
// packages/infrastructure/src/database/prisma-case-repository.ts

save: (case_: Case) => {
  if (case_.version === 1) {
    // New case - simple insert
    await prisma.case.create({ data });
  } else {
    // Update - SCD2 transaction
    await prisma.$transaction(async (tx) => {
      // 1. Close current version
      await tx.case.updateMany({
        where: { businessKey: case_.businessKey, isCurrent: true },
        data: { validTo: now, isCurrent: false }
      });
      
      // 2. Insert new version
      await tx.case.create({ data });
    });
  }
}
```

### Temporal Queries

```typescript
// Find current version (most common)
findById(businessKey: string)

// Find as it existed on a date
findByIdAtTime(businessKey: string, asOf: Date)

// Get complete history
findHistory(businessKey: string)

// Get changes in date range
findChangesBetween(businessKey: string, from: Date, to: Date)
```

## API Endpoints

### Standard Endpoints (Current Version)

```typescript
// GET /api/case/:id - Returns current version
case.getDetails({ caseId: "case_abc" })

// POST /api/case - Creates version 1
case.create({ decedentName: "John Doe", ... })

// All list endpoints return only current versions
case.listAll()
case.listMyCases()
```

### Temporal Endpoints (Staff Only)

```typescript
// Get complete audit trail
case.getHistory({ businessKey: "case_abc" })
// Returns: [v1, v2, v3, ...]

// Get state at specific time
case.getAtTime({ 
  businessKey: "case_abc",
  asOf: new Date("2024-06-15")
})

// Get changes in date range
case.getChangesBetween({
  businessKey: "case_abc",
  from: new Date("2024-06-01"),
  to: new Date("2024-06-30")
})
```

## Migration Guide

### Running the Migration

```bash
# From infrastructure package
cd packages/infrastructure

# Apply migration
npm run db:migrate

# Or manually with PostgreSQL
psql -d dykstra_portal -f prisma/migrations/20250126000000_add_scd2_temporal_tracking/migration.sql
```

### Migration Details

The migration:
1. Adds SCD2 fields to Cases, Contracts, Signatures, Payments
2. Populates `businessKey` with existing IDs (backward compatible)
3. Sets all existing records to version 1, isCurrent=true
4. Creates indexes for performance
5. Renames Contract.version → Contract.contractVersion (to avoid conflict)

### Data Safety

- **Non-destructive**: No data deleted
- **Backward compatible**: Existing IDs become business keys
- **Zero downtime**: All existing queries work (ID → businessKey lookup)

## Performance Considerations

### Indexes

```sql
-- Fast current version lookup
CREATE INDEX cases_business_key_is_current_idx 
ON cases(business_key, is_current);

-- Temporal queries
CREATE INDEX cases_valid_from_valid_to_idx 
ON cases(valid_from, valid_to);

-- Unique constraint
CREATE UNIQUE INDEX cases_business_key_version_key
ON cases(business_key, version);
```

### Query Patterns

**Good:**
```sql
-- Uses index (business_key, is_current)
SELECT * FROM cases WHERE business_key = 'X' AND is_current = true;
```

**Bad:**
```sql
-- Full table scan
SELECT * FROM cases WHERE is_current = true;  -- No business_key filter!
```

### Storage Impact

- Each update creates a new row (not replacing)
- Storage grows linearly with changes
- Typically 2-5 versions per case (minimal impact)
- Can archive old versions if needed (rarely necessary)

## Legal Compliance

### ESIGN Act Requirements

✅ **Immutable Signatures**: Signatures never modified (always version 1)  
✅ **Consent Tracking**: Exact consent text preserved  
✅ **Timestamp Accuracy**: validFrom = legal signature time  
✅ **IP Address**: Stored with signature  
✅ **User Agent**: Stored for non-repudiation  

### Audit Trail

```typescript
// Legal query: "What did the contract say when signed?"
const signedContract = await caseRepo.findByIdAtTime(
  contractBusinessKey,
  signature.signedAt
);
// Returns exact contract version at signature time
```

### Payment Records

✅ **Immutable amounts**: Once created, payment amounts never change  
✅ **Status history**: Track pending→succeeded→refunded transitions  
✅ **Accounting audit**: "How much was paid as of month-end?"  

## Best Practices

### DO ✅

- Use `businessKey` for all queries (not technical ID)
- Filter by `isCurrent = true` for current versions
- Use transactions when saving (close + insert atomic)
- Add temporal queries for compliance reports
- Document why versions changed (add `changeReason` field if needed)

### DON'T ❌

- Never UPDATE existing versions (always INSERT new)
- Never DELETE versions (soft delete with validTo)
- Don't expose temporal complexity to end users
- Don't forget to increment version numbers
- Don't skip transaction boundaries (close + insert must be atomic)

## Troubleshooting

### Issue: Multiple Current Versions

```sql
-- Find duplicates
SELECT business_key, COUNT(*) 
FROM cases 
WHERE is_current = true 
GROUP BY business_key 
HAVING COUNT(*) > 1;

-- Fix: Close all but latest
UPDATE cases SET is_current = false, valid_to = NOW()
WHERE id IN (
  SELECT id FROM cases 
  WHERE business_key = 'X' AND is_current = true
  ORDER BY version DESC OFFSET 1
);
```

### Issue: Missing Version History

```sql
-- Check for gaps
SELECT business_key, version
FROM cases
WHERE business_key = 'X'
ORDER BY version;
-- Should be: 1, 2, 3 (no gaps)
```

### Issue: Performance Degradation

```sql
-- Verify indexes exist
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename = 'cases';

-- Check query plan
EXPLAIN ANALYZE 
SELECT * FROM cases 
WHERE business_key = 'X' AND is_current = true;
```

## Testing Strategy

### Unit Tests

```typescript
describe('SCD2 Case Repository', () => {
  it('should create version 1 on first save', async () => {
    const case_ = Case.create({ ... });
    await repo.save(case_);
    
    expect(case_.version).toBe(1);
    expect(case_.businessKey).toBeTruthy();
  });
  
  it('should increment version on update', async () => {
    const v1 = await createCase();
    const v2 = v1.transitionStatus('active');
    await repo.save(v2);
    
    expect(v2.version).toBe(2);
    
    const history = await repo.findHistory(v1.businessKey);
    expect(history).toHaveLength(2);
  });
  
  it('should preserve old versions', async () => {
    const v1 = await createCase({ status: 'inquiry' });
    const v2 = v1.transitionStatus('active');
    await repo.save(v2);
    
    // v1 should still exist (not deleted)
    const history = await repo.findHistory(v1.businessKey);
    const oldVersion = history.find(c => c.version === 1);
    
    expect(oldVersion.status).toBe('inquiry');
    expect(oldVersion.isCurrent).toBe(false);
  });
});
```

### Integration Tests

```typescript
it('should support point-in-time queries', async () => {
  const now = new Date();
  
  const v1 = await createCase({ status: 'inquiry' });
  await delay(1000);
  
  const timestamp = new Date();
  await delay(1000);
  
  const v2 = v1.transitionStatus('active');
  await repo.save(v2);
  
  // Query at timestamp should return v1
  const historical = await repo.findByIdAtTime(v1.businessKey, timestamp);
  expect(historical.status).toBe('inquiry');
  expect(historical.version).toBe(1);
});
```

## Future Enhancements

### Planned Features

1. **Change Reason Tracking**: Add `changeReason` field to explain why
2. **Automated Archival**: Archive versions older than 7 years
3. **Diff Views**: UI to show what changed between versions
4. **Rollback Support**: Revert to previous version
5. **Audit Reports**: Compliance reports for regulators

### Extension Points

```typescript
// Add to domain entity
export class Case {
  readonly changeReason?: string;  // Why this version?
  readonly changedBy: string;      // Who made the change?
}

// Add to repository
interface CaseRepository {
  findDiff(businessKey: string, fromVersion: number, toVersion: number): Diff;
  rollback(businessKey: string, toVersion: number): Effect<Case>;
}
```

## References

- [Kimball Group: SCD Types](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/)
- [ESIGN Act Requirements](https://www.fdic.gov/regulations/compliance/manual/10/x-3.1.pdf)
- [Temporal Data Modeling](https://www.postgresql.org/docs/current/rangetypes.html)

## Support

For questions about this implementation:
- Check migration SQL: `packages/infrastructure/prisma/migrations/*/migration.sql`
- Review repository code: `packages/infrastructure/src/database/prisma-case-repository.ts`
- Read Prisma schema: `packages/infrastructure/prisma/schema.prisma`

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete  
**Database Impact**: Non-destructive, backward compatible
