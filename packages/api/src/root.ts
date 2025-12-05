import { router } from './trpc';
import { caseRouter } from './routers/case.router';
import { photoRouter } from './routers/photo.router';
import { arrangementsRouter } from './routers/arrangements.router';
import { userRouter } from './routers/user.router';
import { paymentRouter } from './routers/payment.router';
import { stripeRouter } from './routers/stripe.router';
import { staffRouter } from './routers/staff.router';
import { noteRouter } from './routers/note.router';
import { caseEnhancementsRouter } from './routers/case-enhancements.router';
import { invitationRouter } from './routers/invitation.router';
import { contractRouter } from './routers/contract.router';
import { leadRouter } from './routers/lead.router';
import { contactRouter } from './routers/contact.router';
import { campaignRouter } from './routers/campaign.router';
import { referralSourceRouter } from './routers/referral-source.router';
import { interactionRouter } from './routers/interaction.router';
import { validationRouter } from './routers/validation.router';
import { enrichmentRouter } from './routers/enrichment.router';
import { duplicateRouter } from './routers/duplicate.router';
import { familyRelationshipRouter } from './routers/family-relationship.router';
import { emailSyncRouter } from './routers/email-sync.router';
import { prePlanRouter } from './routers/preplan.router';
import { driverVehicleRouter } from './routers/driver-vehicle.router';
import { ptoManagementRouter } from './routers/pto-management.router';
import { trainingManagementRouter } from './routers/training-management.router';
import { backfillManagementRouter } from './routers/backfill-management.router';
import { documentsRouter } from './routers/documents';
import { documentLibraryRouter } from './routers/documents.router';
import { memorialTemplatesRouter } from './routers/memorial-templates';
import { templateAnalyticsRouter } from './routers/template-analytics';
import { templateApprovalRouter } from './routers/template-approval';
import { batchDocumentsRouter } from './routers/batch-documents';
import { printerIntegrationRouter } from './routers/printer-integration';
import { financialRouter } from './routers/financial.router';
import { familyHierarchyRouter } from './routers/family-hierarchy.router';
import { taskRouter } from './routers/task.router';
import { appointmentRouter } from './routers/appointment.router';
import { timesheetRouter } from './routers/timesheet.router';
import { schedulingRouter } from './routers/scheduling.router';
import { payrollRouter } from './routers/payroll.router';
import { inventoryRouter } from './routers/inventory.router';
import { prepRoomRouter } from './routers/prep-room.router';
import { shipmentRouter } from './routers/shipment.router';
import { memorialRouter } from './routers/memorial.router';
import { communicationRouter } from './routers/communication.router';

/**
 * Root application router
 * Merges all sub-routers
 */
export const appRouter = router({
  case: caseRouter,
  photo: photoRouter,
  arrangements: arrangementsRouter,
  user: userRouter,
  payment: paymentRouter,
  stripe: stripeRouter,
  staff: staffRouter,
  note: noteRouter,
  caseEnhancements: caseEnhancementsRouter,
  invitation: invitationRouter,
  contract: contractRouter,
  // CRM routers
  lead: leadRouter,
  contact: contactRouter,
  campaign: campaignRouter,
  referralSource: referralSourceRouter,
  interaction: interactionRouter,
  // CRM enhancement routers (Sprint 4)
  validation: validationRouter,
  enrichment: enrichmentRouter,
  duplicate: duplicateRouter,
  familyRelationship: familyRelationshipRouter,
  // Email sync router (Sprint 10)
  emailSync: emailSyncRouter,
  // Pre-Planning Appointment Scheduling (Scenario 6)
  prePlan: prePlanRouter,
  // Driver/Vehicle Coordination (Scenario 7)
  driverVehicle: driverVehicleRouter,
  // Scenario 10: Staff Training & PTO Coverage (Phases 1-7)
  ptoManagement: ptoManagementRouter,
  trainingManagement: trainingManagementRouter,
  backfillManagement: backfillManagementRouter,
  // Document Generation (Weeks 4-6)
  documents: documentsRouter,
  // Document Library Management (Staff Portal Router 5)
  documentLibrary: documentLibraryRouter,
  // Memorial Templates (Weeks 13-14)
  memorialTemplates: memorialTemplatesRouter,
  // Template Analytics (Week 17)
  templateAnalytics: templateAnalyticsRouter,
  // Template Approval (Week 17)
  templateApproval: templateApprovalRouter,
  // Batch Documents (Week 17)
  batchDocuments: batchDocumentsRouter,
  // Printer Integration (Week 17)
  printerIntegration: printerIntegrationRouter,
  // Financial Operations (Week 1-2: Production Integration)
  financial: financialRouter,
  // Family Hierarchy (Week 3-4: Family CRM Domain)
  familyHierarchy: familyHierarchyRouter,
  // Task Management
  task: taskRouter,
  // Appointment Scheduling
  appointment: appointmentRouter,
  // Timesheet Management (Use Cases 3.1-3.4)
  timesheet: timesheetRouter,
  // Staff Scheduling & Rotation (Use Cases 7.1-7.4)
  scheduling: schedulingRouter,
  // Payroll Management (Use Cases 4.1-4.4)
  payroll: payrollRouter,
  // Inventory Management (Use Cases 5.7, 6.5, 5.4)
  inventory: inventoryRouter,
  // Prep Room Management
  prepRoom: prepRoomRouter,
  // Shipment/SCM Management
  shipment: shipmentRouter,
  // Memorial Pages (tributes, guestbook, photos)
  memorial: memorialRouter,
  // Communication (Email & SMS) - Staff Portal Router 6
  communication: communicationRouter,
});

/**
 * Export type definition of API
 */
export type AppRouter = typeof appRouter;
