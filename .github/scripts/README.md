# CI Verification Scripts

This directory contains automated verification scripts that run in CI/CD to prevent false technical debt claims.

## Overview

The verification system prevents a common mistake: documenting methods as "missing" when they actually exist in the codebase. This happened in Use Case 6.4 where we initially assumed extensive Go backend functionality was missing, when in reality only TypeScript wiring was needed (4 hours vs 3 weeks of estimated work).

## Scripts

### `verify-technical-debt.sh`

**Purpose**: Detects false "missing method" claims in PR code and documentation.

**What it checks**:
1. **TECHNICAL DEBT comments** in TypeScript files with "missing" claims
2. **Documentation files** (`docs/**/*.md`) with "missing" or "not implemented" statements
3. **Simplified implementations** without proper verification

**How it works**:
1. Extracts method names from "missing" claims using regex
2. Searches TypeScript ports: `grep -r "readonly methodName" packages/application/src/ports/`
3. Searches TypeScript adapters: `grep -r "methodName:" packages/infrastructure/src/adapters/go-backend/`
4. Reports findings:
   - ❌ **Error** if method exists (false claim) - blocks PR
   - ✅ **Success** if method doesn't exist (legitimate claim)
   - ⚠️ **Warning** if simplified implementation found (doesn't block PR)

**Exit codes**:
- `0` - No issues found (PR can proceed)
- `1` - False claims detected (PR blocked until fixed)

**Usage**:

```bash
# Test locally (checks uncommitted changes)
.github/scripts/verify-technical-debt.sh

# Test specific files
.github/scripts/verify-technical-debt.sh \
  packages/application/src/use-cases/financial/vendor-bill-processing.ts \
  docs/PHASE_6_TECHNICAL_DEBT.md

# In CI (automatically gets changed files from PR)
.github/scripts/verify-technical-debt.sh
```

**Example output** (false claim detected):

```
🔍 Verifying technical debt claims in PR...
📄 Analyzing changed files...

Pattern 1: Checking for false 'TECHNICAL DEBT' claims in code...

🔎 Found 'missing' claim in vendor-bill-processing.ts:42 for method: getPurchaseOrder
❌ FALSE CLAIM: Method 'getPurchaseOrder' EXISTS in TypeScript port!
   Found: packages/application/src/ports/go-procurement-port.ts:42:  readonly getPurchaseOrder: (id: string) => Effect.Effect<PurchaseOrder, DomainError>

═══════════════════════════════════════════════════════
📊 Verification Summary
═══════════════════════════════════════════════════════
❌ False claims found: 1
✅ Verified claims: 0
⚠️  Warnings: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ VERIFICATION FAILED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 1 method(s) claimed as 'missing' that actually exist!

Action required:
1. Remove the false 'TECHNICAL DEBT' comments
2. Use the existing port/adapter methods instead of placeholders
3. Re-run: ./.github/scripts/verify-technical-debt.sh

Reference: docs/PRE_IMPLEMENTATION_CHECKLIST.md
```

## GitHub Actions Workflow

**File**: `.github/workflows/verify-technical-debt.yml`

**Triggered on**:
- Pull request opened, synchronized, or reopened
- Only runs when changes affect:
  - `packages/application/src/use-cases/**/*.ts`
  - `docs/**/*.md`
  - `packages/infrastructure/src/adapters/**/*.ts`

**What it does**:
1. Checks out PR code with full git history
2. Fetches base branch for comparison
3. Gets list of changed files: `git diff --name-only origin/base...HEAD`
4. Runs `verify-technical-debt.sh` on changed files
5. Posts PR comment with results:
   - ❌ **Failure**: Lists false claims with remediation steps
   - ⚠️ **Warning**: Notes simplified implementations to review
   - ✅ **Success**: Confirms no false claims detected

**PR Comment Examples**:

<details>
<summary>❌ Failure Comment</summary>

> ## ❌ Technical Debt Verification Failed
> 
> The CI script detected method(s) claimed as "missing" that actually exist in the codebase.
> 
> <details>
> <summary>📋 Verification Output</summary>
> 
> ```
> [full verification output]
> ```
> 
> </details>
> 
> ### Action Required
> 
> 1. **Remove false "TECHNICAL DEBT" comments** from your code
> 2. **Use the existing port/adapter methods** instead of simplified placeholders
> 3. **Run verification locally**: `.github/scripts/verify-technical-debt.sh`
> 4. **Update your PR** after fixing the issues
> 
> ### Why This Matters
> 
> False "missing method" claims lead to:
> - ❌ Duplicate implementations of existing functionality
> - ❌ Incorrect effort estimates (hours vs weeks)
> - ❌ Technical debt that doesn't actually exist
> - ❌ Confusion for future developers
> 
> ### Resources
> 
> - 📖 [Pre-Implementation Checklist](docs/PRE_IMPLEMENTATION_CHECKLIST.md)
> - 📖 [Verification Quick Reference](docs/VERIFICATION_QUICK_REFERENCE.md)
> 
> ---
> 
> **Lesson learned from Use Case 6.4**: Always verify before claiming "missing" - the Go backend has extensive functionality already implemented!

</details>

<details>
<summary>⚠️ Warning Comment</summary>

> ## ⚠️ Technical Debt Verification - Warnings Detected
> 
> The verification passed, but found some "simplified implementation" patterns that should be reviewed.
> 
> ### Before Merging
> 
> 1. Run the **4 verification commands** from [Verification Quick Reference](docs/VERIFICATION_QUICK_REFERENCE.md)
> 2. Confirm the full implementation doesn't already exist
> 3. Update the PR description with your verification results
> 
> ### Pro Tip
> 
> If the method exists with E2E test coverage in the Go backend, it's production-ready! You only need to wire it up in TypeScript (typically 1-2 hours, not weeks).
> 
> ---
> 
> This is a **warning only** - the PR is not blocked.

</details>

<details>
<summary>✅ Success Comment</summary>

> ## ✅ Technical Debt Verification Passed
> 
> No false "missing method" claims detected. Great work! 🎉

</details>

## Integration with Development Workflow

### 1. Before Implementation (Planning Phase)

Consult the verification checklist:
- 📖 [Pre-Implementation Checklist](../../docs/PRE_IMPLEMENTATION_CHECKLIST.md) - 5-step verification process
- 📖 [Verification Quick Reference](../../docs/VERIFICATION_QUICK_REFERENCE.md) - Quick command reference

### 2. During Implementation

Run verification locally before committing:

```bash
# Check your uncommitted changes
.github/scripts/verify-technical-debt.sh

# Or check specific files you modified
.github/scripts/verify-technical-debt.sh packages/application/src/use-cases/financial/my-new-use-case.ts
```

### 3. Pull Request

The PR template (`.github/pull_request_template.md`) requires:
- Pre-Implementation Verification checklist
- Per-operation verification (Port/Adapter/Go Backend/E2E Tests)
- Verification summary with 4 mandatory checks
- Technical debt claims with evidence

### 4. CI Verification

GitHub Actions automatically runs on PR:
- Posts comment with verification results
- Blocks merge if false claims detected
- Warns about simplified implementations

### 5. Merge

Only merge after:
- ✅ CI verification passed
- ✅ PR checklist completed
- ✅ All false claims removed
- ✅ Verification results documented

## Verification Commands Reference

**Quick 4-command checklist** (from [Verification Quick Reference](../../docs/VERIFICATION_QUICK_REFERENCE.md)):

```bash
# 1. Check TypeScript ports
grep -r "readonly methodName" packages/application/src/ports/

# 2. Check TypeScript adapters
grep -r "methodName:" packages/infrastructure/src/adapters/go-backend/

# 3. Check Go backend endpoints
grep -r "methodName\|/api/endpoint" ~/tigerbeetle-trial-app-1/cmd/api/

# 4. Check E2E tests (proof it's production-ready)
grep -r "TestE2E.*MethodName" ~/tigerbeetle-trial-app-1/test/
```

**Interpretation**:
- ✅ E2E test exists → Method is production-ready, only needs TypeScript wiring (1-2 hours)
- ⚠️ Go endpoint exists, no E2E test → Needs testing + wiring (4-8 hours)
- ❌ No Go endpoint → Needs full backend implementation (days/weeks)

## Lessons Learned: Use Case 6.4 Post-Mortem

**What happened**:
- Implemented vendor bill processing with "simplified" 3-way match
- Documented extensive "missing" Go backend methods
- Estimated 3 weeks of backend development work

**Reality**:
- Go backend had complete procurement module (8+ endpoints)
- 3-way match engine existed with tolerance config
- E2E test coverage proved production-readiness
- Only needed 4 hours of TypeScript wiring

**Root cause**:
- Didn't verify before claiming "missing"
- Assumed gap instead of searching
- Didn't check for E2E tests

**Prevention** (this system):
1. ✅ Pre-implementation verification checklist
2. ✅ Automated CI script catches false claims
3. ✅ PR template enforces verification
4. ✅ Quick reference for daily use

**Impact**:
- **Before**: 3 weeks estimated (false technical debt)
- **After**: 4 hours actual (TypeScript wiring only)
- **Saved**: 119 hours of misdirected effort

## Troubleshooting

### Script exits with "command not found"

Make sure the script is executable:
```bash
chmod +x .github/scripts/verify-technical-debt.sh
```

### False positives (legitimate claims flagged as errors)

If a method truly doesn't exist but the script detects it:
1. Check if there's a naming conflict (e.g., `method` as generic term)
2. Update the regex patterns in the script to exclude false matches
3. Add exclusion logic for common false positives

### Script doesn't detect changed files locally

The script defaults to `git diff --name-only HEAD` for local testing. If you want to test specific files:
```bash
.github/scripts/verify-technical-debt.sh file1.ts file2.ts
```

### CI workflow doesn't trigger

Check that your changes affect the watched paths:
- `packages/application/src/use-cases/**/*.ts`
- `docs/**/*.md`
- `packages/infrastructure/src/adapters/**/*.ts`

## Future Enhancements

Potential improvements:
1. **Cross-reference Go OpenAPI spec** - validate endpoints match spec
2. **Check for breaking changes** - detect removed methods
3. **Suggest alternatives** - when method exists, suggest correct usage
4. **Effort estimation** - auto-calculate based on what exists (hours vs days)
5. **Historical tracking** - track false claim rate over time

## Related Documentation

- 📖 [Pre-Implementation Checklist](../../docs/PRE_IMPLEMENTATION_CHECKLIST.md) - Full 5-step verification process
- 📖 [Verification Quick Reference](../../docs/VERIFICATION_QUICK_REFERENCE.md) - Quick command cheat sheet
- 📖 [PR Template](../.github/pull_request_template.md) - Required verification sections
- 📖 [Phase 6 Technical Debt](../../docs/PHASE_6_TECHNICAL_DEBT.md) - Current technical debt (corrected)
- 📖 [Architecture Guidelines](../../ARCHITECTURE.md) - Clean Architecture patterns

## Questions?

If you have questions about the verification system or encounter issues:
1. Check the [Pre-Implementation Checklist](../../docs/PRE_IMPLEMENTATION_CHECKLIST.md) for detailed guidance
2. Review [Use Case 6.4 implementation](../../packages/application/src/use-cases/financial/vendor-bill-processing.ts) as a reference
3. Consult the [Verification Quick Reference](../../docs/VERIFICATION_QUICK_REFERENCE.md) for quick commands

---

**Remember**: Default to "wiring work" (hours), not "missing backend" (weeks). Always grep before claiming "missing"! 🔍
