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
  // memorial: memorialRouter, // TODO: Phase 2 continuation
});

/**
 * Export type definition of API
 */
export type AppRouter = typeof appRouter;
