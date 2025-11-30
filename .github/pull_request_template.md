## Description

<!-- Brief description of the changes in this PR -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] Test coverage improvement

## Related Issues

<!-- Link to related issues, e.g., Closes #123 -->

---

## ✅ Pre-Implementation Verification (Required for Use Cases)

<!-- 
If this PR implements a new use case, you MUST complete this section.
See docs/VERIFICATION_QUICK_REFERENCE.md for guidance.
-->

**Use Case**: <!-- e.g., "Use Case 6.4: Vendor Bill Processing" or "N/A" -->

### Required Operations Verification

<!-- For each operation your use case needs, verify it exists -->

#### Operation 1: <!-- e.g., "Get Purchase Order" -->
- [ ] **TypeScript Port**: Exists at `packages/application/src/ports/_____.ts` (or ❌ Not found)
- [ ] **TypeScript Adapter**: Exists at `packages/infrastructure/src/adapters/go-backend/_____.ts` (or ❌ Not found)
- [ ] **Go Backend Endpoint**: Verified at `_____ (endpoint path)` (or ❌ Not found)
- [ ] **Go E2E Tests**: Verified at `_____ (test file)` (or ❌ Not found)
- **Status**: <!-- READY | NEEDS_ADAPTER | NEEDS_BACKEND -->

#### Operation 2: <!-- e.g., "Validate 3-way match" -->
- [ ] **TypeScript Port**: Exists at `_____` (or ❌ Not found)
- [ ] **TypeScript Adapter**: Exists at `_____` (or ❌ Not found)
- [ ] **Go Backend Endpoint**: Verified at `_____` (or ❌ Not found)
- [ ] **Go E2E Tests**: Verified at `_____` (or ❌ Not found)
- **Status**: <!-- READY | NEEDS_ADAPTER | NEEDS_BACKEND -->

<!-- Add more operations as needed -->

### Verification Summary

- [ ] **I have run the 4 verification commands** from `docs/VERIFICATION_QUICK_REFERENCE.md`
- [ ] **I have verified ports/adapters exist** before claiming "missing methods"
- [ ] **I have checked the Go backend** for existing endpoints and tests
- [ ] **I have distinguished "needs wiring" from "needs backend development"**

**Estimated Effort Breakdown**:
- TypeScript implementation: _____ hours
- TypeScript adapter work: _____ hours (if needed)
- Go backend work: _____ hours (if truly missing)
- **Total**: _____ hours

**Technical Debt Claims** (if any):
<!-- 
⚠️ IMPORTANT: Only claim technical debt if you've VERIFIED the Go backend is missing functionality.
List the specific methods/endpoints that are missing and provide evidence:
- [ ] Method X - searched Go backend with: `grep -r "methodX" ~/tigerbeetle-trial-app-1/` - NOT FOUND
- [ ] Endpoint Y - searched routes with: `grep -r "/endpoint/y" ~/tigerbeetle-trial-app-1/cmd/api/` - NOT FOUND
-->

---

## Implementation Details

### Changes Made

<!-- List the main changes in this PR -->

- 
- 
- 

### Architecture Compliance

- [ ] Follows Clean Architecture patterns (ports/adapters/use cases)
- [ ] Uses Effect-TS for error handling
- [ ] Uses object-based ports (NOT classes)
- [ ] Uses Context tags for dependency injection
- [ ] Proper error types (ValidationError, NetworkError, NotFoundError)

### Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing locally (`pnpm test`)
- [ ] Test coverage maintained/improved (target: 80%+)

**Test Summary**:
- Tests added: _____ 
- Tests updated: _____
- Total tests passing: _____

### Code Quality

- [ ] TypeScript compilation passes (`pnpm type-check`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Architectural validation passes (`pnpm validate`)
- [ ] No circular dependencies
- [ ] No Effect Layer issues

### Documentation

- [ ] TSDoc comments added for public APIs
- [ ] Business rules documented in code
- [ ] README updated (if needed)
- [ ] Architecture docs updated (if needed)

---

## Breaking Changes

<!-- If this introduces breaking changes, describe them and migration path -->

N/A

---

## Screenshots / Demo

<!-- If UI changes, add screenshots or video -->

N/A

---

## Reviewer Notes

<!-- Any specific areas you'd like reviewers to focus on -->

---

## Checklist

- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have verified ports/adapters exist before claiming technical debt

---

<!-- 
🤖 Automated Verification: The CI will check for false "technical debt" claims.
If you've claimed methods are "missing" but they exist in ports/adapters/Go backend,
the CI will flag them for review.
-->
