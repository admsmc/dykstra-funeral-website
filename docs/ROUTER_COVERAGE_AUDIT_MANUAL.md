# Router Coverage Audit - Manual Analysis

**Date**: December 5, 2024  
**Method**: Manual inspection + grep analysis

## Executive Summary

Based on WARP.md documentation and grep analysis of UI code:

- **Total Routers**: 47 routers defined in `packages/api/src/routers/`
- **Wired to UI**: ~15-20 routers actively used (32-43%)
- **Partially Wired**: ~10-15 routers (21-32%)
- **Not Wired**: ~15-20 routers (32-43%)

**Status**: **Significant gaps exist** - many routers have endpoints that are not connected to the frontend UI.

## Router Status by Category

### ✅ Fully Wired & Production Ready

These routers are actively used in the UI and working:

1. **case** - Cases list, create, details
   - Used in: `/staff/cases/*`
   - Endpoints: `create`, `listAll`, `getDetails`, `listMyCases`
   - Status: ✅ **Fully wired**

2. **payment** - Payment processing
   - Used in: `/staff/payments/*`
   - Endpoints: `create`, `list`, `recordPayment`
   - Status: ✅ **Fully wired**

3. **financial** - Financial operations (AP/AR/GL)
   - Used in: `/staff/finops/*`
   - Endpoints: GL, AP, AR operations
   - Status: ✅ **Partially wired** (10 usages found)

4. **contract** - Contract management
   - Used in: `/staff/contracts/*`
   - Endpoints: `create`, `list`, `getDetails`
   - Status: ✅ **Fully wired**

5. **contact** - Contact/CRM management
   - Used in: `/staff/contacts/*`, `/staff/families/*`
   - Status: ✅ **Fully wired** (per WARP.md - 25 components, 160 min implementation)

6. **lead** - Lead management
   - Used in: `/staff/leads/*`
   - Endpoints: `create`, `list`, `convertToCase`
   - Status: ✅ **Fully wired**

7. **arrangements** - Service arrangements
   - Used in: `/staff/arrangements/*`
   - Endpoints: `getRecommendations`, `getProducts`, `getServices`, `saveCeremony`
   - Status: ✅ **Fully wired** (per WARP.md - 75 min implementation)

8. **task** - Task management
   - Used in: `/staff/tasks/*`
   - Status: ✅ **Wired**

9. **documents** - Document management
   - Used in: `/staff/documents/*`, `/staff/cases/[id]/documents`
   - Status: ✅ **Partially wired**

10. **invitation** - Family invitations
    - Used in: Family modals
    - Status: ✅ **Wired**

### ⚠️  Partially Wired

These routers exist but have significant unused endpoints:

11. **timesheet** - Time tracking
    - Router exists with multiple endpoints
    - UI page exists: `/staff/payroll/time`
    - Grep: 1 usage found (`api.timesheet.`)
    - Status: ⚠️ **Minimal wiring** - UI exists but needs more endpoints connected

12. **scheduling** - Staff scheduling
    - Router exists with 25 methods (per WARP.md)
    - UI page exists: `/staff/scheduling`
    - Grep: 1 usage found
    - Status: ⚠️ **Minimal wiring** - Recently created (Use Cases 7.1-7.4)

13. **payroll** - Payroll processing
    - Router exists
    - UI pages exist: `/staff/payroll/*`
    - Grep: 2 usages found
    - Status: ⚠️ **Partial wiring**

14. **inventory** - Inventory management
    - Router exists
    - UI page exists: `/staff/inventory`
    - Grep: 1-2 usages found
    - Status: ⚠️ **Minimal wiring**

15. **procurement** - Purchase orders & suppliers
    - Router exists
    - UI pages exist: `/staff/procurement/*`
    - Grep: 2-3 usages found
    - Status: ⚠️ **Partial wiring**

16. **shipment** - SCM/shipment tracking
    - Router exists
    - UI page exists: `/staff/scm`
    - Grep: 1 usage found
    - Status: ⚠️ **Minimal wiring**

17. **prepRoom** - Prep room management
    - Router exists
    - UI page exists: `/staff/prep-room`
    - Grep: 1 usage found
    - Status: ⚠️ **Minimal wiring**

18. **appointment** - Appointment scheduling
    - Router exists
    - UI page exists: `/staff/appointments`
    - Grep: 1 usage found
    - Status: ⚠️ **Minimal wiring**

19. **communication** - Email & SMS
    - Router exists
    - UI pages exist: `/staff/communication/*`
    - Status: ⚠️ **Likely partial** - UI pages exist but usage unknown

20. **analytics** - Dashboard metrics
    - Router exists
    - UI page exists: `/staff/analytics`
    - Grep: 2 usages found
    - Status: ⚠️ **Minimal wiring**

### ❌ Not Wired to UI

These routers exist but are NOT connected to any UI:

21. **staff** - Staff management
    - Router exists
    - UI page: `/staff/hr`
    - Status: ❌ **Not wired** (grep found 0 direct usages)

22. **photo** - Photo management
    - Router exists
    - Status: ❌ **Not wired** to staff portal

23. **user** - User management
    - Router exists (1 endpoint found)
    - Status: ❌ **Minimal/auth only**

24. **stripe** - Payment processing
    - Router exists
    - Status: ❌ **Not wired** (backend integration only)

25. **note** - Internal notes
    - Router exists
    - Status: ❌ **Not directly wired** (may be embedded in case details)

26. **caseEnhancements** - Case enhancements
    - Router exists (1 endpoint found)
    - Status: ❌ **Minimal wiring**

27. **campaign** - Marketing campaigns
    - Router exists
    - Status: ❌ **Not wired**

28. **referralSource** - Referral tracking
    - Router exists
    - Status: ❌ **Not wired**

29. **interaction** - Interaction logging
    - Router exists
    - Status: ❌ **Not wired**

30. **validation** - Data validation
    - Router exists
    - Status: ❌ **Backend utility** (not user-facing)

31. **enrichment** - Data enrichment
    - Router exists
    - Status: ❌ **Backend utility**

32. **duplicate** - Duplicate detection
    - Router exists
    - Status: ❌ **Backend utility**

33. **familyRelationship** - Family relationships
    - Router exists
    - Status: ❌ **Not wired** (may be part of contact router)

34. **emailSync** - Email synchronization
    - Router exists
    - Status: ❌ **Backend service**

35. **prePlan** - Pre-planning
    - Router exists
    - Status: ❌ **Not wired**

36. **driverVehicle** - Driver/vehicle coordination
    - Router exists
    - Status: ❌ **Not wired**

37. **ptoManagement** - PTO management
    - Router exists
    - Status: ❌ **Not wired**

38. **trainingManagement** - Training management
    - Router exists
    - Status: ❌ **Not wired**

39. **backfillManagement** - Backfill management
    - Router exists
    - Status: ❌ **Not wired**

40. **documentLibrary** - Document library
    - Router exists (separate from `documents`)
    - Status: ❌ **Not wired**

41. **memorialTemplates** - Memorial templates
    - Router exists (2 endpoints found)
    - Status: ❌ **Minimal wiring**

42. **templateAnalytics** - Template analytics
    - Router exists
    - UI page exists: `/staff/template-analytics`
    - Status: ❌ **Not wired**

43. **templateApproval** - Template approvals
    - Router exists
    - UI page exists: `/staff/template-approvals`
    - Status: ❌ **Not wired**

44. **batchDocuments** - Batch document processing
    - Router exists
    - Status: ❌ **Not wired**

45. **printerIntegration** - Printer integration
    - Router exists
    - Status: ❌ **Not wired**

46. **memorial** - Public memorial pages
    - Router exists
    - Status: ❌ **Public-facing** (not staff portal)

47. **refunds** - Refund processing
    - Router exists
    - Status: ❌ **Not directly wired**

## Critical Gaps Analysis

### High Priority - UI Exists But Poorly Connected

These have UI pages but need better router integration:

1. **Timesheet Router** → `/staff/payroll/time`
   - UI exists (weekly calendar view)
   - Router has endpoints (Use Cases 3.1-3.4 per WARP.md)
   - **Gap**: Need to wire time entry, approval, overtime endpoints

2. **Scheduling Router** → `/staff/scheduling`
   - UI exists (staff scheduler with shifts)
   - Router created recently (25 methods, Use Cases 7.1-7.4)
   - **Gap**: Need to wire on-call rotation, coverage, swap endpoints

3. **Payroll Router** → `/staff/payroll`
   - UI exists (payroll dashboard, W-2 generation)
   - Router has endpoints (Use Cases 4.1-4.4 per WARP.md)
   - **Gap**: Need to wire payroll calculation, direct deposit, journal entry

4. **Inventory Router** → `/staff/inventory`
   - UI exists (multi-location with low stock alerts)
   - Router has endpoints (Use Cases 5.7, 6.5, 5.4 per WARP.md)
   - **Gap**: Need to wire inventory operations, transfers, adjustments

5. **Procurement Router** → `/staff/procurement`
   - UI exists (Kanban PO workflow, supplier management)
   - Router has endpoints (Use Cases 5.1-5.3 per WARP.md)
   - **Gap**: Need to wire PO creation, receipt, returns

6. **Shipment Router** → `/staff/scm`
   - UI exists (shipment tracking with status timeline)
   - Router exists
   - **Gap**: Need to wire shipment operations

7. **Prep Room Router** → `/staff/prep-room`
   - UI exists
   - Router exists
   - **Gap**: Need to wire prep room operations (Use Case 7.3)

8. **Communication Router** → `/staff/communication/*`
   - UI exists (4 pages: campaigns, templates, history, analytics)
   - Router exists
   - **Gap**: Need to wire email/SMS operations

9. **Analytics Router** → `/staff/analytics`
   - UI exists (dashboard metrics)
   - Router exists (2 usages found)
   - **Gap**: Need more endpoint connections

### Medium Priority - Backend Ready But No UI

These have backend routers but no staff portal UI:

10. **Staff Router** (HR)
    - Router exists
    - UI exists at `/staff/hr` but not connected
    - **Gap**: Need to build employee management UI

11. **Template Routers** (3 routers)
    - templateAnalytics, templateApproval, batchDocuments
    - UI pages exist but not connected
    - **Gap**: Need to wire template operations

12. **Refunds Router**
    - Router exists
    - No dedicated UI page (may be in payments)
    - **Gap**: Need refund management UI

### Low Priority - Backend Services

These are backend services that may not need UI:

- validation, enrichment, duplicate (backend utilities)
- emailSync (background service)
- memorial (public-facing, not staff portal)
- photo (may be embedded in cases)
- stripe (backend payment processing)

## Recommendations

### Immediate Actions (High ROI)

1. **Wire Existing UI Pages** (1-2 weeks)
   - Connect timesheet router to `/staff/payroll/time`
   - Connect scheduling router to `/staff/scheduling`
   - Connect payroll router to `/staff/payroll`
   - Connect inventory router to `/staff/inventory`
   - Connect procurement router to `/staff/procurement`
   - Connect shipment router to `/staff/scm`
   - Connect communication router to `/staff/communication/*`

   **Impact**: 7 major features become fully functional

2. **Document Current State** (1 day)
   - Create endpoint-by-endpoint checklist for each router
   - Document which endpoints are wired vs. not wired
   - Prioritize based on business value

### Short-term (2-4 weeks)

3. **Complete Partial Routers**
   - Add missing endpoints for partially wired routers
   - Test end-to-end workflows
   - Document usage patterns

4. **Build Missing UI**
   - Staff/HR management at `/staff/hr`
   - Template management (analytics, approvals)
   - Refund processing UI

### Long-term (1-3 months)

5. **Wire Remaining Routers**
   - Pre-planning features
   - Driver/vehicle coordination
   - PTO/training/backfill management
   - Memorial templates

6. **Clean Up Unused Routers**
   - Remove or document routers that won't be used
   - Consolidate overlapping functionality

## Next Steps

1. ✅ **Run smoke tests** to validate existing wiring
2. 📝 **Create detailed endpoint audit** for top 10 routers
3. 📝 **Prioritize endpoints** by business value
4. 📝 **Create implementation plan** for high-priority gaps
5. 📝 **Add integration tests** for each router

## Validation Commands

```bash
# Check usage of specific router
grep -r "api\\.routerName\\." src/app/staff --include="*.tsx" --include="*.ts"

# Count usages
grep -r "api\\.routerName\\." src/app/staff --include="*.tsx" --include="*.ts" | wc -l

# Find all router imports
grep -r "from.*@dykstra/api" src/app/staff --include="*.tsx" --include="*.ts"
```

## Conclusion

**Current State**: Approximately **40-50% of router endpoints are not wired to the UI**, representing significant gaps in functionality.

**Critical Gaps**: 7-9 major feature areas have UI pages but incomplete router connections (timesheet, scheduling, payroll, inventory, procurement, shipment, communication, analytics).

**Recommendation**: Focus on wiring existing UI pages to their corresponding routers before building new features. This will deliver maximum value with minimal effort (estimated 1-2 weeks of work).

**Risk**: Users may encounter "coming soon" or mock data pages that should be functional, leading to poor user experience.

**Priority**: **HIGH** - Address in next sprint to avoid user confusion and maximize ROI on existing development.
