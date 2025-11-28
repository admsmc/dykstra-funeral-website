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
export * from './ports/address-validation-port';
export * from './ports/phone-validation-port';
export * from './ports/contact-enrichment-port';
export * from './ports/family-relationship-repository';
export * from './ports/sms-port';
export * from './ports/email-sync-port';
export * from './ports/email-repository';
export * from './ports/calendar-sync-port';
export * from './ports/calendar-event-repository';

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

// Payment use cases
export * from './use-cases/payments/list-payments';
export * from './use-cases/payments/get-payment-by-id';
export * from './use-cases/payments/record-manual-payment';
export * from './use-cases/payments/process-refund';
export * from './use-cases/payments/get-payment-stats';
export * from './use-cases/payments/get-ar-aging-report';

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
