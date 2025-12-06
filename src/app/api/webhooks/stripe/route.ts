import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

type PaymentStatus = "SUCCEEDED" | "FAILED" | "CANCELLED" | "PROCESSING";

let prisma: PrismaClient | null = null;
const getPrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

const stripeSecretKey: string | undefined = process.env.STRIPE_SECRET_KEY;
const stripe: Stripe | null = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    })
  : null;

const webhookSecret: string | undefined = process.env.STRIPE_WEBHOOK_SECRET;

function isStripeConfigured(
  client: Stripe | null,
  secretKey: string | undefined,
): client is Stripe {
  return Boolean(client && secretKey);
}

/**
 * Stripe Webhook Handler
 * Processes payment_intent events to update payment status in database
 * 
 * IMPORTANT: This endpoint must have body parsing disabled in Next.js config
 * to verify webhook signatures correctly
 */
export async function POST(req: NextRequest) {
  try {
    if (!isStripeConfigured(stripe, stripeSecretKey)) {
      console.error("[Stripe Webhook] STRIPE_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // Get raw body as text for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[Stripe Webhook] Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.canceled":
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.processing":
        await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);

  try {
    // Find existing payment record by Stripe payment intent ID
    const existingPayment = await getPrisma().payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        isCurrent: true,
      },
    });

    if (!existingPayment) {
      console.error(`[Stripe Webhook] Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    const paymentMethodId =
      typeof paymentIntent.payment_method === "string"
        ? paymentIntent.payment_method
        : paymentIntent.payment_method?.id ?? null;

    // Update payment status to SUCCEEDED (SCD2 pattern)
    await getPrisma().payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "SUCCEEDED" satisfies PaymentStatus,
        notes: `Payment succeeded via Stripe (${paymentMethodId ?? "unknown method"})`,
        stripePaymentMethodId: paymentMethodId,
        updatedAt: new Date(),
      },
    });

    console.log(`[Stripe Webhook] Payment ${existingPayment.id} marked as SUCCEEDED`);
  } catch (error) {
    console.error("[Stripe Webhook] Error updating payment:", error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);

  try {
    const existingPayment = await getPrisma().payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        isCurrent: true,
      },
    });

    if (!existingPayment) {
      console.error(`[Stripe Webhook] Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    // Get failure reason from last_payment_error
    const failureReason = paymentIntent.last_payment_error?.message || "Payment failed";

    await getPrisma().payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "FAILED" satisfies PaymentStatus,
        failureReason,
        notes: `Payment failed: ${failureReason}`,
        updatedAt: new Date(),
      },
    });

    console.log(`[Stripe Webhook] Payment ${existingPayment.id} marked as FAILED`);
  } catch (error) {
    console.error("[Stripe Webhook] Error updating payment:", error);
    throw error;
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Payment canceled: ${paymentIntent.id}`);

  try {
    const existingPayment = await getPrisma().payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        isCurrent: true,
      },
    });

    if (!existingPayment) {
      console.error(`[Stripe Webhook] Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    await getPrisma().payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "CANCELLED" satisfies PaymentStatus,
        notes: "Payment canceled by user or system",
        updatedAt: new Date(),
      },
    });

    console.log(`[Stripe Webhook] Payment ${existingPayment.id} marked as CANCELLED`);
  } catch (error) {
    console.error("[Stripe Webhook] Error updating payment:", error);
    throw error;
  }
}

/**
 * Handle processing payment
 */
async function handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Payment processing: ${paymentIntent.id}`);

  try {
    const existingPayment = await getPrisma().payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        isCurrent: true,
      },
    });

    if (!existingPayment) {
      console.error(`[Stripe Webhook] Payment not found for intent: ${paymentIntent.id}`);
      return;
    }

    await getPrisma().payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "PROCESSING" satisfies PaymentStatus,
        notes: "Payment is being processed by Stripe",
        updatedAt: new Date(),
      },
    });

    console.log(`[Stripe Webhook] Payment ${existingPayment.id} marked as PROCESSING`);
  } catch (error) {
    console.error("[Stripe Webhook] Error updating payment:", error);
    throw error;
  }
}
