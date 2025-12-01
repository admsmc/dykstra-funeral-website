# Use Case Refactoring Status

Generated: 2025-12-01 at 08:13:21 UTC

---

## Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ CONFIGURABLE | 0 | 0% |
| 🟡 IN PROGRESS | 12 | 11% |
| 🔴 HARDCODED | 96 | 88% |
| ❓ UNKNOWN/UNTAGGED | 0 | 0% |
| **TOTAL** | **     108** | **100%** |

---

## By Domain

### calendar-sync (       3 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| get-staff-availability | Type A | 🔴 HARDCODED | 0 | N/A | NO | NO | N/A |
| suggest-meeting-times | Type A | 🔴 HARDCODED | 0 | N/A | NO | NO | N/A |
| sync-interaction-to-calendar | Type A | 🔴 HARDCODED | 0 | N/A | NO | NO | N/A |

### campaigns (       1 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| send-campaign | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### case-management (       5 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| convert-lead-to-case-with-contract | N/A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| finalize-case-with-gl-posting | N/A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-audit-log | N/A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-financial-summary | N/A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| update-case-status | N/A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### contacts (       2 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| find-duplicates | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| merge-contacts | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### contract (       6 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| contract-renewal | Type C | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| pre-need-contract-processing | Type C | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| service-arrangement-recommendations | Type C | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### contracts (       3 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| catalog-queries | Type C | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| contract-operations | Type C | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| template-operations | Type C | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### email-sync (       2 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| match-email-to-entity | Type A | 🔴 HARDCODED | 0 | N/A | NO | NO | N/A |
| sync-user-emails | Type A | 🔴 HARDCODED | 0 | N/A | NO | NO | N/A |

### financial (      17 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| ap-payment-run | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| ar-aging-report | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| bank-reconciliation | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| batch-payment-application | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| budget-variance-report | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| cash-flow-forecasting | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| create-invoice-from-contract | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| customer-retention-analysis | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| expense-report-approval | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| fixed-asset-depreciation-run | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| insurance-claim-processing | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| month-end-close | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| process-case-payment | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| refund-processing | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| revenue-by-service-type | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| sales-tax-reporting | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| vendor-bill-processing | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### hr (       2 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| employee-offboarding | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| employee-onboarding | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### interactions (       1 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| log-interaction | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### inventory (       5 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| commit-inventory-reservation | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| inventory-cycle-count | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| inventory-transfer | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| inventory-valuation-report | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| reserve-inventory-for-case | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### invitations (       5 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| create-invitation | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-invitation-history | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| list-invitations | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| resend-invitation | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| revoke-invitation | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### leads (       2 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| convert-lead-to-case | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| create-lead | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### notes (       5 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| create-note | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| delete-note | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-note-history | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| list-notes | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| update-note | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### payments (       6 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| get-ar-aging-report | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-payment-by-id | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-payment-stats | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| list-payments | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| process-refund | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| record-manual-payment | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### payroll (       3 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| case-based-labor-costing | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| create-payroll-run-from-timesheets | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| submit-timesheet-for-approval | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### pre-planning (       6 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| cancel-appointment | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| complete-appointment | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| get-director-availability | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| list-appointments | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| schedule-appointment | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| send-appointment-reminders | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### prep-room (       7 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| auto-release-reservation | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| check-availability | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| check-in-reservation | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| check-out-reservation | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| list-schedule | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| override-conflict | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| reserve-room | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### procurement (       2 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| purchase-requisition-to-po | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| receive-inventory-from-po | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### pto-management (       7 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| approve-pto-request | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| approve-training | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| assign-pto-backfill | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| complete-training | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| reject-pto-request | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| request-pto | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |
| request-training | Type B | 🔴 HARDCODED | 0 | N/A | YES | YES | N/A |

### scheduling (      12 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| assign-driver | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| assign-embalmer-shift | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| assign-oncall-director | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| assign-service-coverage | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| assign-vehicle | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| check-driver-availability | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| check-vehicle-availability | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| create-rotating-weekend-shift | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| dispatch-driver | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| list-driver-schedule | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| record-mileage | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |
| request-shift-swap | Type B | 🟡 IN PROGRESS | 0 | ShiftPolicy | YES | YES | N/A |

### staff (       4 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| get-analytics | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-dashboard-stats | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| get-task-dashboard | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| list-staff-members | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### tasks (       3 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| create-task | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| list-tasks | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |
| update-task-status | Type A | 🔴 HARDCODED | 0 | N/A | NO | YES | N/A |

### user (       2 use cases - 0% complete)

| Use Case | Type | Status | Tests | Policy Entity | Backend | Per-Home | Updated |
|----------|------|--------|-------|---------------|---------|----------|---------|
| get-user-profile | Type A | 🔴 HARDCODED | 0 | N/A | NO | NO | N/A |
| update-user-profile | Type A | 🔴 HARDCODED | 0 | N/A | NO | NO | N/A |

---

## Notes

- Generated from JSDoc headers in use case files
- Run this script before each release to track progress
- Update JSDoc headers when refactoring status changes
- Use: `./scripts/scan-use-case-status.sh > docs/USE_CASE_STATUS.md` to save report

