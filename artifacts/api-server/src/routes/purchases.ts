import { Router, type IRouter } from "express";
import Stripe from "stripe";
import { db, purchases } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

// POST /api/purchases
// Called by the frontend after the Stripe success redirect.
// Body: { sessionId: string, customerEmail?: string, planData?: object, formData?: object }
//
// Payment integrity: a record is only created for a Stripe session that the
// server has verified as PAID (via the Stripe API, or previously via the
// webhook). Client-supplied plan data is only ever attached to a verified
// session's record — the client can never mint an unlocked plan on its own.
router.post("/purchases", async (req, res) => {
  try {
    const { sessionId, customerEmail, planData, formData } = req.body ?? {};

    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return res.status(400).json({ error: "A valid Stripe session id is required" });
    }

    // 1. If the webhook (or an earlier redirect) already verified this
    //    session, attach any missing plan data and return the existing id.
    const existing = await db
      .select()
      .from(purchases)
      .where(eq(purchases.stripeSessionId, sessionId))
      .limit(1);

    if (existing.length > 0) {
      const record = existing[0]!;
      const updates: Record<string, unknown> = {};
      if (!record.planData && planData) updates.planData = planData;
      if (!record.formData && formData) updates.formData = formData;
      if (!record.customerEmail && typeof customerEmail === "string" && customerEmail) {
        updates.customerEmail = customerEmail;
      }
      if (Object.keys(updates).length > 0) {
        await db.update(purchases).set(updates).where(eq(purchases.id, record.id));
      }
      return res.json({
        planId: record.id,
        hasPlan: Boolean(record.planData ?? updates.planData) && Boolean(record.formData ?? updates.formData),
      });
    }

    // 2. No record yet — verify the session directly with Stripe.
    if (!stripe) {
      req.log.error(
        "STRIPE_SECRET_KEY is not configured — cannot verify checkout session; rejecting purchase record request",
      );
      return res.status(503).json({
        error: "Payment verification is not configured. Your payment is safe — contact support to get your plan link.",
      });
    }

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err) {
      req.log.warn({ err, sessionId }, "Stripe session lookup failed");
      return res.status(400).json({ error: "Unknown Stripe session" });
    }

    if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      return res.status(402).json({ error: "Payment not completed for this session" });
    }

    const verifiedEmail = session.customer_details?.email ?? session.customer_email ?? null;

    const inserted = await db
      .insert(purchases)
      .values({
        stripeSessionId: sessionId,
        customerEmail: verifiedEmail,
        planData: planData ?? null,
        formData: formData ?? null,
      })
      .onConflictDoNothing({ target: purchases.stripeSessionId })
      .returning({ id: purchases.id });

    if (inserted.length > 0) {
      return res.json({
        planId: inserted[0]!.id,
        hasPlan: Boolean(planData) && Boolean(formData),
      });
    }

    // Rare race: webhook inserted between our select and insert.
    const raced = await db
      .select({ id: purchases.id, planData: purchases.planData, formData: purchases.formData })
      .from(purchases)
      .where(eq(purchases.stripeSessionId, sessionId))
      .limit(1);
    return res.json({
      planId: raced[0]!.id,
      hasPlan: Boolean(raced[0]!.planData) && Boolean(raced[0]!.formData),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create purchase record");
    return res.status(500).json({ error: "Failed to save purchase" });
  }
});

// GET /api/purchases/:planId
// Returns the durable plan record. Records only exist for verified
// payments, so existence implies the plan is unlocked.
router.get("/purchases/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    if (!UUID_RE.test(planId)) {
      return res.status(400).json({ error: "Invalid plan id" });
    }

    const rows = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, planId))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const record = rows[0]!;
    return res.json({
      planId: record.id,
      hasPlan: Boolean(record.planData) && Boolean(record.formData),
      planData: record.planData,
      formData: record.formData,
      createdAt: record.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch purchase record");
    return res.status(500).json({ error: "Failed to fetch plan" });
  }
});

export default router;
