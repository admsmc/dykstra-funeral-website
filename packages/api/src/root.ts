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
  // memorial: memorialRouter, // TODO: Phase 2 continuation
});

/**
 * Export type definition of API
 */
export type AppRouter = typeof appRouter;
