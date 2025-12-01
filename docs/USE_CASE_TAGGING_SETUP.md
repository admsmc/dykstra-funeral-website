# Use Case Tagging & Inventory System Setup

## Overview

This document summarizes the complete use case tagging and inventory system implemented to track refactoring status across 50+ use cases.

## What Was Added

### 1. ARCHITECTURE.md Section: "Use Case Tagging & Inventory Best Practices"

**Location**: `ARCHITECTURE.md` lines 2030–2308

**Contains**:
- JSDoc header pattern (required for all use cases)
- 8 required fields for every use case file
- 3 example use case headers (refactored, hardcoded, in-progress)
- CI validation rules (5 rule categories)
- Auto-inventory script documentation
- PR template for refactoring PRs
- Progress tracking guidelines
- Example status report format

**Key benefit**: Standardized, machine-readable metadata in code for every use case.

### 2. Auto-Inventory Bash Script

**Location**: `scripts/scan-use-case-status.sh` (executable)

**What it does**:
- Scans all use case files for JSDoc headers
- Extracts metadata (Policy Type, Status, Entity, Backend, etc.)
- Generates markdown report grouped by domain
- Calculates summary statistics (total, % CONFIGURABLE, % IN PROGRESS, % HARDCODED)
- Outputs per-domain completion percentages and test coverage

**Usage**:
```bash
./scripts/scan-use-case-status.sh                          # Print to stdout
./scripts/scan-use-case-status.sh > docs/USE_CASE_STATUS.md # Save report
```

**Output**: Markdown file with:
- Overall progress summary (counts + percentages)
- Per-domain breakdown with use case tables
- Test coverage per use case
- Last updated dates

### 3. GitHub Actions CI Workflow

**Location**: `.github/workflows/validate-use-case-tags.yml`

**What it does**:
- Validates all use case JSDoc headers on every PR and push
- Enforces 5 rule categories:
  1. Header presence (all files must have JSDoc)
  2. Field presence (all 8 fields required)
  3. Valid values (Policy Type, Status, etc.)
  4. Type-specific invariants (Type A/B/C rules)
  5. Status coherence (HARDCODED/CONFIGURABLE rules)
- Generates status summary report
- Comments on failed PRs with helpful guidance

**When it runs**:
- On every PR that modifies use case files
- On every push to main/develop branches

**Failure handling**: 
- Blocks PR merge if any use case file is missing tags or has invalid values
- Posts automated comment with specific errors and links to documentation

## How to Use

### When Refactoring a Use Case

1. **Before starting**: Open the use case file and add/update the JSDoc header:
   ```typescript
   /**
    * Use case description...
    *
    * Policy Type: Type B
    * Refactoring Status: IN PROGRESS
    * Policy Entity: MyPolicy (entity created, 80% done)
    * Persisted In: TypeScript/PostgreSQL (SCD2)
    * Go Backend: YES
    * Per-Funeral-Home: YES
    * Test Coverage: 15 tests
    * Last Updated: 2025-12-08
    */
   ```

2. **After completing refactoring**:
   - Update status to `CONFIGURABLE`
   - Update `Last Updated` to completion date
   - Commit with PR template fields (see ARCHITECTURE.md)

3. **CI will validate**:
   - GitHub Actions runs validation checks
   - Blocks PR if tags are invalid
   - Posts comment with specific error messages

### Tracking Progress

**Monthly** (or before releases):
```bash
./scripts/scan-use-case-status.sh > docs/USE_CASE_STATUS.md
git add docs/USE_CASE_STATUS.md
git commit -m "docs: Update use case refactoring status report"
```

**Review metrics**:
- Total use cases
- % CONFIGURABLE (goal: 100%)
- % HARDCODED (goal: 0%)
- Per-domain completion rates
- Test coverage trends

### Viewing Status

**Current status**:
```bash
./scripts/scan-use-case-status.sh | head -50
```

**Full report**:
```bash
cat docs/USE_CASE_STATUS.md
```

**By domain** (from full report):
- Scheduling (9 use cases)
- Financial (14 use cases)
- Payroll (6 use cases)
- Procurement (5 use cases)
- Contracts (3 use cases)
- Pre-Planning (6 use cases)
- Payments (6 use cases)
- Tasks (3 use cases)
- Interactions (1 use case)
- Case Management (4 use cases)
- Other domains...

## JSDoc Field Reference

| Field | Type | Required | Values | Example |
|-------|------|----------|--------|---------|
| Policy Type | enum | YES | A, B, C, N/A | Type B |
| Refactoring Status | enum | YES | HARDCODED, IN PROGRESS, CONFIGURABLE | ✅ CONFIGURABLE |
| Policy Entity | string | YES | Class name or N/A | OnCallPolicy |
| Persisted In | string | YES | TypeScript/PostgreSQL, Go Backend, N/A | TypeScript/PostgreSQL (SCD2) |
| Go Backend | enum | YES | YES, NO | YES (execution only) |
| Per-Funeral-Home | enum | YES | YES, NO | YES |
| Test Coverage | string | YES | Number or count | 28 tests |
| Last Updated | string | YES | Date (YYYY-MM-DD) or N/A | 2025-12-01 |

## CI Validation Rules

### Rule 1: Header Presence
Every `.ts` file in `packages/application/src/use-cases/` (excluding `__tests__/` and `index.ts`) must have a JSDoc header.

### Rule 2: Field Presence
All 8 required fields must be present in the header.

### Rule 3: Valid Values
- Policy Type: A | B | C | N/A
- Status: HARDCODED | IN PROGRESS | CONFIGURABLE
- Go Backend: YES | NO
- Per-Funeral-Home: YES | NO

### Rule 4: Type-Specific Invariants
- Type A: Go Backend must be NO
- Type B: Go Backend must be YES + Persisted In must be "TypeScript/PostgreSQL"
- Type C: Persisted In must be "Go Backend"
- CONFIGURABLE: Persisted In must not be N/A

### Rule 5: Status Coherence
- HARDCODED: Policy Entity = N/A AND Persisted In = N/A
- CONFIGURABLE: Policy Entity ≠ N/A AND Persisted In ≠ N/A
- IN PROGRESS: Policy Entity should not be N/A

## Fixing Validation Errors

If CI fails on your PR:

1. **Missing fields**: Add all 8 fields to the JSDoc header
2. **Invalid values**: Use only allowed values for each field
3. **Type violation**: Check type-specific invariants (see Rule 4 above)
4. **Status error**: Match status to Policy Entity/Persisted In settings

**Example fix**:
```diff
 /**
  * Assign service coverage.
  *
-  * Policy Type: B
-  * Refactoring Status: CONFIGURABLE
-  * Policy Entity: N/A
-  * Persisted In: N/A
-  * Go Backend: YES
+  * Policy Type: Type B
+  * Refactoring Status: ✅ CONFIGURABLE
+  * Policy Entity: ServiceCoveragePolicy
+  * Persisted In: TypeScript/PostgreSQL (SCD2)
+  * Go Backend: YES (execution only)
   * Per-Funeral-Home: YES
   * Test Coverage: 18 tests
   * Last Updated: 2025-12-01
  */
```

## Integration with Refactoring Process

This tagging system works with the 6-phase refactoring process documented in ARCHITECTURE.md:

| Phase | Status | JSDoc State |
|-------|--------|-------------|
| Discovery | HARDCODED | Policy Entity: N/A, Persisted In: N/A |
| 1–3: Design & DB | IN PROGRESS | Policy Entity: ✅, Persisted In: Partial |
| 4–5: Use Case & Tests | IN PROGRESS | Partial completion noted |
| 6: Validation | CONFIGURABLE | All fields complete, Last Updated: date |

## FAQ

**Q: Do I need to tag use cases that don't require configuration?**
A: Yes. Set `Policy Type: N/A`, `Policy Entity: N/A`, `Persisted In: N/A`, but fill in all other fields (Status, Backend, Per-Funeral-Home, Tests, Updated).

**Q: What if a use case is partially configurable?**
A: Use `Refactoring Status: IN PROGRESS` and include a TODO comment documenting remaining work. Update phase status (1✅ 2✅ 3🟡 4❌ 5❌ 6❌).

**Q: How often should I run the inventory script?**
A: Monthly or before releases. Store result in `docs/USE_CASE_STATUS.md` and commit to track progress over time.

**Q: Can I have multiple policies per use case?**
A: Set `Policy Entity: MultiplePolicy` and document in comments. Most use cases have one entity; if not, explain in JSDoc.

**Q: What if CI rejects my PR for tagging?**
A: Check the error message. Fix the specific field(s) flagged, ensure values match allowed list, verify type/status coherence.

## Files Modified

1. ✅ `ARCHITECTURE.md` (lines 2030–2308)
   - Added "Use Case Tagging & Inventory Best Practices" section
   - 280+ lines of guidance, examples, validation rules

2. ✅ `scripts/scan-use-case-status.sh` (145 lines)
   - Executable bash script for generating reports
   - Scans JSDoc headers and generates markdown output

3. ✅ `.github/workflows/validate-use-case-tags.yml` (160 lines)
   - GitHub Actions workflow
   - Runs on every PR and push to main/develop
   - Validates tags and blocks invalid PRs

## Next Steps

1. **Start tagging**: Add JSDoc headers to existing use case files
2. **Run locally**: `./scripts/scan-use-case-status.sh` to verify setup
3. **Begin refactoring**: Follow 6-phase process with status updates
4. **Track progress**: Run inventory script monthly
5. **Monitor CI**: Watch GitHub Actions feedback on PRs

---

See [ARCHITECTURE.md > Use Case Tagging & Inventory Best Practices](../ARCHITECTURE.md#use-case-tagging--inventory-best-practices) for complete documentation.
