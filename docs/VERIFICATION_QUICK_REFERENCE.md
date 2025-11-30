# Pre-Implementation Verification: Quick Reference Card

## 🚨 STOP! Before Claiming "Technical Debt"

Run these 4 commands FIRST:

```bash
# 1. Check TypeScript Port
grep -r "readonly methodName" packages/application/src/ports/

# 2. Check TypeScript Adapter  
grep -r "methodName:" packages/infrastructure/src/adapters/go-backend/

# 3. Check Go Backend Endpoint
grep -r "methodName\|/endpoint" ~/tigerbeetle-trial-app-1/cmd/api/

# 4. Check E2E Tests (proof it works!)
grep -r "TestE2E.*MethodName" ~/tigerbeetle-trial-app-1/test/
```

## ✅ Decision Tree

```
Need a method?
│
├─ Found in TypeScript port? → Check adapter
│  ├─ Adapter exists? → ✅ USE IT! (Ready to implement)
│  └─ No adapter? → Check Go backend
│
└─ Not in TypeScript port? → Check Go backend
   ├─ Go backend has it? → Create TypeScript adapter (4-6 hours)
   └─ Go backend missing? → Document as REAL technical debt
```

## 🎯 Effort Estimation Rules

| Scenario | Estimated Effort | Example |
|----------|-----------------|---------|
| ✅ Port + Adapter exist | **1-2 hours** | Use Case 6.4 (if we checked first!) |
| ⚠️ Port exists, no adapter | **4-6 hours** | Create adapter file |
| ⚠️ No port, Go backend ready | **8-12 hours** | Create port + adapter |
| ❌ Go backend missing | **2-3 weeks** | Actual technical debt |

## 📋 Pre-Flight Checklist

**Before implementing ANY use case:**

```markdown
[ ] Searched TypeScript ports: `grep -r "method" packages/application/src/ports/`
[ ] Searched TypeScript adapters: `ls packages/infrastructure/src/adapters/go-backend/`
[ ] Searched Go backend: `grep -r "endpoint" ~/tigerbeetle-trial-app-1/cmd/api/`
[ ] Found E2E tests: `grep -r "TestE2E" ~/tigerbeetle-trial-app-1/test/`
[ ] Created verification matrix (see PRE_IMPLEMENTATION_CHECKLIST.md)
[ ] Estimated effort based on REALITY (not assumptions)
```

## 🚫 Red Flags

**STOP and verify if you're about to:**

- ❌ Add comment: `// ⚠️ TECHNICAL DEBT: Simplified implementation`
- ❌ Return placeholder: `return { isValid: true }; // TODO: Real implementation`
- ❌ Document: "Missing Go backend method X, estimated 2-3 weeks"
- ❌ Skip verification because "it probably doesn't exist"

**Instead:**

- ✅ Run the 4 verification commands above
- ✅ Check if port/adapter already exists
- ✅ Use actual implementation if it exists
- ✅ Only document REAL gaps (proven by verification)

## 📚 Where Everything Lives

### TypeScript
```
packages/application/src/ports/                    - Port interfaces
packages/infrastructure/src/adapters/go-backend/   - Adapters
```

### Go Backend (adjust path)
```
~/tigerbeetle-trial-app-1/cmd/api/register*.go    - Endpoints
~/tigerbeetle-trial-app-1/test/contract/          - E2E tests
~/tigerbeetle-trial-app-1/internal/domain/        - Domain logic
```

## 💡 Pro Tips

1. **E2E tests are proof**: If `test/contract/e2e_*_test.go` exists, the Go backend is production-ready
2. **Check adapters first**: Most ports already have adapters wired up
3. **Don't trust memory**: Always grep, even if you "think" it doesn't exist
4. **Document findings**: Use verification matrix to avoid re-work

## 🎓 Lesson Learned

**Use Case 6.4 Mistake**:
- ❌ Assumed procurement methods missing
- ❌ Documented 3 weeks of "technical debt"
- ✅ **Reality**: All methods existed, E2E tested, production-ready
- ✅ **Actual work**: 4 hours to wire up TypeScript

**Cost of not verifying**: 3 weeks of phantom work documented!

---

**Remember**: Verify FIRST, assume NEVER! 🚀
