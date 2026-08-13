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
          .returning({ id: purchases.id });
        planId = inserted[0]!.id;
        req.log.info({ sessionId }, "Stripe webhook: purchase recorded");
      }

      if (email) {
        const emailResult = await sendPlanConfirmationEmail({
          customerEmail: email,
          planId,
          stripeSessionId: sessionId,
        });
        if (emailResult.sent) {
          req.log.info({ sessionId, planId }, "Plan confirmation email sent");
        } else {
          req.log.warn(
            { sessionId, planId },
            "Plan confirmation email skipped because Resend is not configured",
          );
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
