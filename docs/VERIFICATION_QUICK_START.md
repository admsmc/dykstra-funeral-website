# Technical Debt Verification - Quick Start Guide

**For**: Developers implementing new use cases or documenting technical debt  
**Time to read**: 2 minutes  
**Purpose**: Get started with the verification system immediately

## TL;DR

Before claiming a method is "missing," run these 4 commands:

```bash
# Replace "methodName" with the actual method you're looking for
grep -r "readonly methodName" packages/application/src/ports/
grep -r "methodName:" packages/infrastructure/src/adapters/go-backend/
grep -r "methodName\|/api/endpoint" ~/tigerbeetle-trial-app-1/cmd/api/
grep -r "TestE2E.*MethodName" ~/tigerbeetle-trial-app-1/test/
```

**If any command returns results → the method exists!** Don't claim it's "missing."

## Why This Matters

**Use Case 6.4 lesson learned**: We initially documented 3 weeks of "missing" Go backend work when only 4 hours of TypeScript wiring was needed. All the backend methods existed with E2E test coverage. This system prevents similar mistakes.

**Impact**: Saved 119 hours of misdirected effort on a single use case.

## Quick Decision Tree

```
Is E2E test found? (grep TestE2E...)
│
├─ YES → Method is production-ready!
│         Effort: 1-2 hours (TypeScript wiring only)
│         Action: Use existing infrastructure, don't claim "missing"
│
└─ NO → Is Go endpoint found? (grep cmd/api...)
        │
        ├─ YES → Method exists but needs testing
        │         Effort: 4-8 hours (testing + wiring)
        │         Action: Add tests, wire up TypeScript
        │
        └─ NO → Method doesn't exist
                  Effort: Days/weeks (full backend implementation)
                  Action: Document as legitimate technical debt
```

## Before You Start Implementing

1. **Read the checklist** (5 minutes):  
   📖 [Pre-Implementation Checklist](./PRE_IMPLEMENTATION_CHECKLIST.md)

2. **Run the 4 verification commands** (1 minute):  
   📖 [Verification Quick Reference](./VERIFICATION_QUICK_REFERENCE.md)

3. **Document your findings** (2 minutes):  
   Use the Verification Matrix template from the checklist

## Before You Commit

Run the verification script locally:

```bash
.github/scripts/verify-technical-debt.sh
```

**Green ✅ = good to go**  
**Red ❌ = fix false claims before committing**

## When You Create a PR

The PR template (`.github/pull_request_template.md`) will guide you through required verification sections:

- ✅ Pre-Implementation Verification checklist
- ✅ Per-Operation Verification table
- ✅ Verification Summary (4 mandatory checks)
- ✅ Technical Debt Claims (with evidence)

## What Happens in CI

GitHub Actions automatically runs on your PR:

1. ✅ **Pass** → PR comment: "Verification passed! 🎉"
2. ⚠️ **Warning** → PR comment: "Please verify simplified implementations" (non-blocking)
3. ❌ **Fail** → PR comment: "False claims detected!" + remediation steps (blocks merge)

## Red Flags to Watch For

❌ **DON'T**:
- Assume methods are missing without verification
- Use "simplified implementation" as a shortcut for real implementation
- Document technical debt before running the 4 commands
- Copy/paste technical debt from other use cases

✅ **DO**:
- Run verification commands first
- Check for E2E tests (proof of production-readiness)
- Use existing infrastructure when available
- Document only legitimate technical debt with evidence

## Common Patterns

### Pattern 1: "Missing" method that exists

**Before verification**:
```typescript
// TECHNICAL DEBT: Missing Go backend method getPurchaseOrder()
// Simplified implementation returns mock data
async getPurchaseOrder(id: string) {
  return { id, status: 'draft' }; // Mock
}
```

**After verification** (found E2E test):
```typescript
// Use existing GoProcurementPort
async getPurchaseOrder(id: string) {
  return Effect.runPromise(
    this.goProcurementPort.getPurchaseOrder(id)
  );
}
```

**Result**: 4 hours instead of 3 weeks!

### Pattern 2: Legitimate technical debt

**Verification commands return empty** → Method truly doesn't exist

```typescript
// TECHNICAL DEBT: Go backend doesn't have AI-powered contract analysis
// Evidence:
// - grep "analyzeContract" packages/application/src/ports/ → No results
// - grep "analyzeContract:" packages/infrastructure/src/adapters/ → No results  
// - grep "analyzeContract\|/analyze" ~/tigerbeetle-trial-app-1/cmd/api/ → No results
// - grep "TestE2E.*AnalyzeContract" ~/tigerbeetle-trial-app-1/test/ → No results
// 
// Estimated effort: 2-3 weeks (requires ML model integration)
```

**Result**: Properly documented technical debt with verification evidence!

## Cheat Sheet

| Command | Purpose | What to look for |
|---------|---------|------------------|
| `grep -r "readonly methodName" packages/application/src/ports/` | Check TypeScript port interface | Port method signature |
| `grep -r "methodName:" packages/infrastructure/src/adapters/go-backend/` | Check TypeScript adapter | Adapter implementation |
| `grep -r "methodName\|/api/endpoint" ~/tigerbeetle-trial-app-1/cmd/api/` | Check Go backend | HTTP endpoint registration |
| `grep -r "TestE2E.*MethodName" ~/tigerbeetle-trial-app-1/test/` | Check E2E tests | **Production-ready proof!** |

## Need Help?

1. **Quick questions**: Check [Verification Quick Reference](./VERIFICATION_QUICK_REFERENCE.md)
2. **Detailed guidance**: Read [Pre-Implementation Checklist](./PRE_IMPLEMENTATION_CHECKLIST.md)
3. **CI/CD details**: See [CI Scripts README](../.github/scripts/README.md)
4. **Complete overview**: Read [Verification System Summary](./VERIFICATION_SYSTEM_SUMMARY.md)

## Resources (Bookmarks)

- 📖 [Pre-Implementation Checklist](./PRE_IMPLEMENTATION_CHECKLIST.md) - Full 5-step process
- 📖 [Verification Quick Reference](./VERIFICATION_QUICK_REFERENCE.md) - One-page cheat sheet
- 📖 [CI Scripts README](../.github/scripts/README.md) - Complete system guide
- 📖 [Verification System Summary](./VERIFICATION_SYSTEM_SUMMARY.md) - Executive overview
- 📖 [PR Template](../.github/pull_request_template.md) - Required sections
- 📖 [WARP.md](../WARP.md) - Project rules (includes verification)

## Pro Tips

💡 **E2E tests are gold**: If you find an E2E test, the backend is production-ready. You only need TypeScript wiring.

💡 **Default to "wiring"**: Assume the Go backend has it until proven otherwise. It's a mature system with extensive functionality.

💡 **Run locally first**: Test with `.github/scripts/verify-technical-debt.sh` before pushing to avoid CI failures.

💡 **Document verification**: Keep your Verification Matrix handy for the PR description.

💡 **When in doubt, ask**: Better to verify twice than assume once!

---

**Remember**: "Always grep before claiming 'missing'!" - Lesson from Use Case 6.4 🔍
