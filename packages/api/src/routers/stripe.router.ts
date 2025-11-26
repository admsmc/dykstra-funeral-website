import { z } from "zod";
import { router, familyProcedure } from "../trpc";
import { createPaymentIntent } from "@dykstra/application";
import { runEffect } from "../utils/effect-runner";

/**
 * Stripe router for payment processing
 */
export const stripeRouter = router({
  /**
   * Create a Stripe PaymentIntent for card payments
   * Returns clientSecret for frontend Elements integration
   */
  createPaymentIntent: familyProcedure
    .input(
      z.object({
        caseId: z.string(),
        amount: z.number().positive(),
        currency: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await runEffect(
        createPaymentIntent({
          caseId: input.caseId,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          userId: ctx.user.id,
        })
      );

      return {
        success: result.success,
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        amount: result.amount,
      };
    }),
});
