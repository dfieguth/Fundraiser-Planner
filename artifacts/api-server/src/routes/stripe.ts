// ============================================================
// STRIPE WEBHOOK — PLACEHOLDER ROUTE
//
// This route exists as future infrastructure only.
// It does NOT verify payments and is NOT required for the
// current MVP launch flow.
//
// CURRENT MVP FLOW (client-side, no backend required):
//   1. User clicks the $19 Full Event Pack payment link
//   2. Stripe processes the payment
//   3. Stripe redirects the browser to /success?unlock=full-event-pack
//   4. The frontend reads the ?unlock param and sets localStorage
//   5. The plan is unlocked locally — no server call needed
//
// FUTURE SECURE FLOW (replace the above with this):
//   1. User clicks the Full Event Pack payment link
//   2. Stripe processes the payment
//   3. Stripe sends a POST to /api/stripe/webhook with a signed event
//   4. This server verifies the Stripe signature using STRIPE_WEBHOOK_SECRET
//      (via stripe.webhooks.constructEvent — requires the raw request body,
//      NOT the JSON-parsed body; express.raw() must be applied BEFORE express.json())
//   5. Server confirms event.type === "checkout.session.completed" and that
//      the line item matches the Full Event Pack product
//   6. Server creates a short-lived signed token (e.g. JWT) or stores a
//      verified paid order record in the database
//   7. Stripe redirects the browser to /success?session_id=<session_id>
//   8. The frontend exchanges the session_id for the signed token via a
//      GET /api/stripe/verify?session_id=... endpoint
//   9. The frontend uses the verified token to unlock the Full Event Pack
//      instead of trusting the ?unlock param directly
//
// TO ACTIVATE:
//   - Install the Stripe Node SDK: pnpm add stripe
//   - Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your environment
//   - Add express.raw() middleware ONLY for this route (before express.json())
//   - Replace the placeholder body below with real signature verification
// ============================================================

import { Router, type IRouter } from "express";

const router: IRouter = Router();

// POST /api/stripe/webhook
// Placeholder — returns a safe acknowledgement without verifying anything.
// Stripe requires a 2xx response within 30 seconds or it will retry.
router.post("/stripe/webhook", (req, res) => {
  req.log.info({ mode: "placeholder" }, "Stripe webhook received (placeholder — no verification)");

  // TODO: Replace with real Stripe signature verification before going live.
  // See the FUTURE SECURE FLOW comments above.
  res.json({ received: true, mode: "placeholder" });
});

export default router;
