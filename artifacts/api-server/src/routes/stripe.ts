// ============================================================
// STRIPE WEBHOOK — SERVER-SIDE PAYMENT CONFIRMATION
//
// Verifies checkout.session.completed events and records the
// purchase in the database, keyed by the Stripe session ID.
// This makes the unlock durable even if the buyer's browser
// never returns to the /success page.
//
// Requires environment variables:
//   STRIPE_SECRET_KEY     — Stripe API key
//   STRIPE_WEBHOOK_SECRET — signing secret from the webhook endpoint config
//
// If they are not set, the route logs a warning and acknowledges
// events without recording anything (never inserts unverified data).
//
// NOTE: this route needs the RAW request body for signature
// verification. app.ts applies express.raw() to this path before
// express.json().
// ============================================================

import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db, purchases } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// POST /api/stripe/webhook
router.post("/stripe/webhook", async (req, res) => {
  if (!stripe || !webhookSecret) {
    req.log.warn(
      "Stripe webhook received but STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are not configured — event ignored",
    );
    return res.json({ received: true, mode: "unconfigured" });
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    req.log.warn({ err }, "Stripe webhook signature verification failed");
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;
      const email = session.customer_details?.email ?? session.customer_email ?? null;

      const existing = await db
        .select({ id: purchases.id, customerEmail: purchases.customerEmail })
        .from(purchases)
        .where(eq(purchases.stripeSessionId, sessionId))
        .limit(1);

      if (existing.length > 0) {
        if (!existing[0]!.customerEmail && email) {
          await db
            .update(purchases)
            .set({ customerEmail: email })
            .where(eq(purchases.id, existing[0]!.id));
        }
        req.log.info({ sessionId }, "Stripe webhook: purchase already recorded");
      } else {
        await db.insert(purchases).values({
          stripeSessionId: sessionId,
          customerEmail: email,
        });
        req.log.info({ sessionId }, "Stripe webhook: purchase recorded");
      }
    }
    return res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Stripe webhook processing failed");
    // Non-2xx makes Stripe retry, which is what we want for DB errors.
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
