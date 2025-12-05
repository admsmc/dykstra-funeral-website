// Ports
export * from './ports/case-repository';
export * from './ports/contract-repository';
export * from './ports/payment-repository';
export * from './ports/photo-repository';
export * from './ports/tribute-repository';
export * from './ports/guestbook-repository';
export * from './ports/storage-port';
export * from './ports/email-port';
export * from './ports/signature-port';
export * from './ports/event-publisher';
export * from './ports/payment-port';
export * from './ports/insurance-port';
export * from './ports/payment-plan-port';
export * from './ports/user-port';
export * from './ports/invitation-repository';
export * from './ports/note-repository';
export * from './ports/task-repository';
export * from './ports/audit-log-repository';
export * from './ports/staff-repository';
export * from './ports/catalog-repository';
export * from './ports/contract-template-repository';

// CRM Ports
export * from './ports/lead-repository';
export * from './ports/contact-repository';
export * from './ports/campaign-repository';
export * from './ports/interaction-repository';
export * from './ports/referral-source-repository';
export * from './ports/email-marketing-port';

// CRM Enhancement Ports
export * from './ports/contact-management-policy-repository';
export * from './ports/email-calendar-sync-policy-repository';
export * from './ports/payment-management-policy-repository';
export * from './ports/interaction-management-policy-repository';
export * from './ports/invitation-management-policy-repository';
export * from './ports/lead-scoring-policy-repository';
export * from './ports/lead-to-case-conversion-policy-repository';
export * from './ports/note-management-policy-repository';
export * from './ports/address-validation-port';
export * from './ports/phone-validation-port';
export * from './ports/contact-enrichment-port';
export * from './ports/family-relationship-repository';
export * from './ports/sms-port';
export * from './ports/email-sync-port';
export * from './ports/email-repository';
export * from './ports/email-service-port';
export * from './ports/calendar-sync-port';
export * from './ports/calendar-event-repository';

// Go ERP Integration Ports (20 modules)
export * from './ports/go-approval-workflow-port';
export * from './ports/go-budget-port';
export * from './ports/go-consolidations-port';
export * from './ports/go-contract-port';
export * from './ports/go-employee-master-data-port';
export * from './ports/go-employee-onboarding-port';
export * from './ports/go-employee-termination-port';
export * from './ports/go-financial-port';
export * from './ports/go-fixed-assets-port';
export * from './ports/go-inventory-port';
export * from './ports/go-payroll-port';
export * from './ports/go-performance-port';
export * from './ports/go-position-management-port';
export * from './ports/go-procurement-port';
export * from './ports/go-professional-services-port';
export * from './ports/go-pto-port';
export * from './ports/go-reconciliations-port';
export * from './ports/go-rehire-port';
export * from './ports/go-segment-reporting-port';
export * from './ports/go-timesheet-port';
export * from './ports/go-training-port';
export * from './ports/go-scheduling-port';

// Commands
export * from './commands/create-case';
export * from './commands/upload-photo';
export * from './commands/delete-photo';
export * from './commands/save-arrangements';
export * from './commands/add-tribute';
export * from './commands/sign-guestbook';
export * from './commands/process-ach-payment';
export * from './commands/create-payment-plan';
export * from './commands/assign-insurance';
export * from './commands/create-payment-intent';

// Queries
export * from './queries/get-case-details';
export * from './queries/get-case-timeline';
export * from './queries/get-photos';
export * from './queries/get-arrangements';
export * from './queries/get-tributes';
export * from './queries/get-guestbook';
export * from './queries/get-payment-history';
export * from './queries/get-payment-receipt';

// User use cases
export * from './use-cases/user/get-user-profile';
export * from './use-cases/user/update-user-profile';

// Invitation use cases
export * from './use-cases/invitations/create-invitation';
export * from './use-cases/invitations/list-invitations';
export * from './use-cases/invitations/resend-invitation';
export * from './use-cases/invitations/revoke-invitation';
export * from './use-cases/invitations/get-invitation-history';

// Note use cases
export * from './use-cases/notes/list-notes';
export * from './use-cases/notes/get-note-history';
export * from './use-cases/notes/create-note';
export * from './use-cases/notes/update-note';
export * from './use-cases/notes/delete-note';

// Case management use cases
export * from './use-cases/case-management/get-financial-summary';
export * from './use-cases/case-management/update-case-status';
export * from './use-cases/case-management/get-audit-log';

// Task use cases
export * from './use-cases/tasks/list-tasks';
export * from './use-cases/tasks/create-task';
export * from './use-cases/tasks/update-task-status';

// Staff use cases
export * from './use-cases/staff/list-staff-members';
export * from './use-cases/staff/get-dashboard-stats';
export * from './use-cases/staff/get-analytics';
export * from './use-cases/staff/get-task-dashboard';

// Contract use cases
export * from './use-cases/contracts/catalog-queries';
export * from './use-cases/contracts/template-operations';
export * from './use-cases/contracts/contract-operations';
export * from './use-cases/contract/service-arrangement-recommendations';

// Payment use cases
export * from './use-cases/payments/list-payments';
export * from './use-cases/payments/get-payment-by-id';
export * from './use-cases/payments/record-manual-payment';
export * from './use-cases/payments/process-refund';
export * from './use-cases/payments/get-payment-stats';
export * from './use-cases/payments/get-ar-aging-report';

// Financial use cases (selective exports to avoid duplicates with ports)
export { monthEndClose, validateMonthEndClose, getMonthEndCloseHistory, type MonthEndCloseCommand, type MonthEndCloseResult } from './use-cases/financial/month-end-close';
export { startBankReconciliation, clearReconciliationItems, completeBankReconciliation, undoBankReconciliation, type StartBankReconciliationCommand, type ClearReconciliationItemsCommand, type CompleteBankReconciliationCommand } from './use-cases/financial/bank-reconciliation';
export { generateARAgingReport, type ARAgingReportCommand, type ARAgingReportResult } from './use-cases/financial/ar-aging-report';
export { executeAPPaymentRun, type ExecuteAPPaymentRunCommand, type ExecuteAPPaymentRunResult } from './use-cases/financial/ap-payment-run';
export { applyBatchPayment, type ApplyBatchPaymentCommand, type BatchPaymentApplicationResult } from './use-cases/financial/batch-payment-application';
export { processRefund as processFinancialRefund } from './use-cases/financial/refund-processing';
export { createVendorBill } from './use-cases/financial/vendor-bill-processing';
export { generateRevenueByServiceType, type GenerateRevenueByServiceTypeCommand, type GenerateRevenueByServiceTypeResult } from './use-cases/financial/revenue-by-service-type';
export { generateBudgetVarianceReport, type BudgetVarianceReportCommand, type BudgetVarianceReportResult } from './use-cases/financial/budget-variance-report';
export { approveVendorBill, type ApproveVendorBillCommand, type ApproveVendorBillResult } from './use-cases/financial/approve-vendor-bill';
export { payVendorBill, payVendorBillsBatch, type PayVendorBillCommand, type PayVendorBillResult } from './use-cases/financial/pay-vendor-bill';
export { getGLTrialBalance, getAccountHistory, getFinancialStatement, postJournalEntry } from './use-cases/financial/gl-operations';
export { listVendorBills, groupVendorBillsByVendor, type VendorPayables } from './use-cases/financial/list-vendor-bills';
// Additional financial use cases (keep wildcard exports for now)
// Note: Some may have naming conflicts - will be refined in Phase 1.4

// CRM Lead use cases
export * from './use-cases/leads/create-lead';
export * from './use-cases/leads/convert-lead-to-case';

// CRM Contact use cases
export * from './use-cases/contacts/merge-contacts';
export * from './use-cases/contacts/find-duplicates';

// CRM Campaign use cases
export * from './use-cases/campaigns/send-campaign';

// CRM Interaction use cases
export * from './use-cases/interactions/log-interaction';

// Email Sync use cases
export * from './use-cases/email-sync/match-email-to-entity';
export * from './use-cases/email-sync/sync-user-emails';

// Calendar Sync use cases
export * from './use-cases/calendar-sync/sync-interaction-to-calendar';
export * from './use-cases/calendar-sync/get-staff-availability';
export * from './use-cases/calendar-sync/suggest-meeting-times';

// Staff Scheduling & PTO Management Ports
export * from './ports/training-management-port';
export * from './ports/pto-management-port';
export * from './ports/backfill-management-port';
export * from './ports/prep-room-repository';

// Pre-Planning Appointment Port
export * from './ports/pre-planning-appointment-repository';

// Driver/Vehicle Coordination Ports (Scenario 7)
export * from './ports/driver-assignment-repository';
export * from './ports/vehicle-repository';
export * from './ports/driver-dispatch-service';

// Pre-Planning Appointment use cases (Scenario 6)
export * from './use-cases/pre-planning/schedule-appointment';
export * from './use-cases/pre-planning/get-director-availability';
export * from './use-cases/pre-planning/list-appointments';
export * from './use-cases/pre-planning/cancel-appointment';
export * from './use-cases/pre-planning/complete-appointment';
export * from './use-cases/pre-planning/send-appointment-reminders';

// Prep Room use cases
export * from './use-cases/prep-room';

// PTO Management use cases
export * from './use-cases/pto-management';

// Driver/Vehicle Coordination use cases (Scenario 7)
export * from './use-cases/scheduling/assign-driver';
export * from './use-cases/scheduling/assign-vehicle';
export * from './use-cases/scheduling/record-mileage';
export * from './use-cases/scheduling/check-driver-availability';
export * from './use-cases/scheduling/check-vehicle-availability';
export * from './use-cases/scheduling/list-driver-schedule';
export * from './use-cases/scheduling/dispatch-driver';

// Document Generation Ports (Week 3 & Week 7)
export * from './ports/document-generator-port';
export * from './ports/template-renderer-port';
export * from './ports/template-repository-port';
export * from './ports/pdf-generator-port'; // Week 7: Puppeteer

// Document Generation Mappers & Use Cases (Week 5-6)
export * from './mappers/go-to-invoice-data-mapper';
export * from './mappers/go-to-purchase-order-data-mapper';
export * from './use-cases/documents/generate-invoice-pdf';
export * from './use-cases/documents/generate-purchase-order-pdf';
export * from './use-cases/documents/generate-payment-receipt-pdf';
export * from './use-cases/documents/store-document-pdf';

// Memorial Material Use Cases (Week 10, 12, 14)
export * from './use-cases/memorial/generate-service-program';
export * from './use-cases/memorial/generate-prayer-card';
export * from './use-cases/memorial/preview-template';
export { saveTemplate as saveMemorialTemplate } from './use-cases/memorial/save-template';
