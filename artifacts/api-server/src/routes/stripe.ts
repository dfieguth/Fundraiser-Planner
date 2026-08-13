import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db, purchases } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendPlanConfirmationEmail } from "../lib/email";

const router: IRouter = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

router.post("/stripe/webhook", async (req, res) => {
  if (!stripe || !webhookSecret) {
    req.log.warn(
      "Stripe webhook received but STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are not configured, event ignored",
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

      let planId: string;
      if (existing.length > 0) {
        planId = existing[0]!.id;
        if (!existing[0]!.customerEmail && email) {
          await db.update(purchases).set({ customerEmail: email }).where(eq(purchases.id, planId));
        }
        req.log.info({ sessionId }, "Stripe webhook: purchase already recorded");
      } else {
        const inserted = await db
          .insert(purchases)
          .values({ stripeSessionId: sessionId, customerEmail: email })
          .onConflictDoNothing({ target: purchases.stripeSessionId })
          .returning({ id: purchases.id });
        if (inserted.length > 0) {
          planId = inserted[0]!.id;
          req.log.info({ sessionId }, "Stripe webhook: purchase recorded");
        } else {
          const raced = await db
            .select({ id: purchases.id })
            .from(purchases)
            .where(eq(purchases.stripeSessionId, sessionId))
            .limit(1);
          if (raced.length === 0) {
            throw new Error("Stripe webhook purchase race did not produce a purchase record");
          }
          planId = raced[0]!.id;
          req.log.info({ sessionId }, "Stripe webhook: purchase already recorded by a concurrent delivery");
        }
      }

      if (email) {
        const emailSent = await db.transaction(async (tx) => {
          const locked = await tx
            .select({
              id: purchases.id,
              customerEmail: purchases.customerEmail,
              confirmationEmailSentAt: purchases.confirmationEmailSentAt,
            })
            .from(purchases)
            .where(eq(purchases.id, planId))
            .for("update")
            .limit(1);

          const purchase = locked[0];
          if (!purchase) {
            throw new Error("Stripe webhook purchase record disappeared before email delivery");
          }
          if (purchase.confirmationEmailSentAt) {
            return false;
          }

          const recipient = purchase.customerEmail ?? email;
          await sendPlanConfirmationEmail({
            customerEmail: recipient,
            planId: purchase.id,
            stripeSessionId: sessionId,
          });
          await tx
            .update(purchases)
            .set({
              customerEmail: recipient,
              confirmationEmailSentAt: new Date(),
            })
            .where(eq(purchases.id, purchase.id));
          return true;
        });
        if (emailSent) {
          req.log.info({ sessionId, planId }, "Plan confirmation email sent");
        } else {
          req.log.info({ sessionId, planId }, "Plan confirmation email already sent");
        }
      } else {
        req.log.warn({ sessionId, planId }, "Plan confirmation email skipped because no customer email was provided");
      }
    }
    return res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Stripe webhook processing failed");
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;
