// ============================================================
// BACKEND READINESS NOTE
//
// Current MVP launch uses a client-side post-payment redirect unlock:
//   Stripe → /success?unlock=full-event-pack → localStorage flag set → plan unlocked.
//
// The backend webhook route at /api/stripe/webhook exists only as future
// infrastructure. It is NOT required for launch and does NOT affect the
// current unlock flow in any way.
//
// See artifacts/api-server/src/routes/stripe.ts for the future secure flow.
// ============================================================

// ============================================================
// LAUNCH CHECKLIST
// Complete every item below before going live:
//
//  [ ] Replace SUPPORT_EMAIL with your real support address
//  [ ] Replace PAYMENT_LINKS.fullEventPack with your real Stripe or Gumroad link
//  [ ] Set ENABLE_DEMO_UNLOCK to false
//  [ ] Set USE_STRIPE_TEST_MODE = false before going live
//  [ ] In your Stripe Payment Link settings:
//        After payment → Confirmation page → Redirect to your website
//        URL: https://[your-domain]/success?unlock=full-event-pack
//      Or in Gumroad:
//        Product settings → Redirect URL → https://[your-domain]/success?unlock=full-event-pack
//  [ ] Test a full purchase flow in the same browser tab before launch
// ============================================================

// ============================================================
// PAYMENT LINKS CONFIGURATION
// Replace the placeholder URLs below with your actual
// Stripe Payment Links or Gumroad product links.
//
// DEVELOPER NOTE — MVP SECURITY POSTURE:
// The current unlock flow is client-side only (sessionStorage flag set after
// a post-payment redirect). This is fine for early MVP testing and low-volume
// sales — the downside exposure is minimal and the implementation is simple.
//
// If this app starts getting meaningful sales volume, replace this with a
// server-verified flow: use a Stripe webhook to confirm payment server-side,
// then issue a short-lived signed token or session that the client can
// validate before showing the full plan. Do not rely solely on a URL
// parameter or sessionStorage flag for high-stakes gating.
// ============================================================

// ── Stripe test / live switch ────────────────────────────────
// Set USE_STRIPE_TEST_MODE = true to send buyers to the Stripe test
// payment link. Set to false before going live.
//
// BEFORE GOING LIVE: set USE_STRIPE_TEST_MODE = false
// ─────────────────────────────────────────────────────────────
export const LIVE_FULL_EVENT_PACK_LINK = "https://buy.stripe.com/28E7sF4DPgWw8pVgvE9EI00";
export const TEST_FULL_EVENT_PACK_LINK = "https://buy.stripe.com/test_28E7sF4DPgWw8pVgvE9EI00";
export const USE_STRIPE_TEST_MODE = true;

export const PAYMENT_LINKS = {
  // Free tier — no payment needed, just scroll to planner
  free: null,

  // $9 Printable Plan — replace with your Stripe/Gumroad link
  printablePlan: "https://placeholder.example.com/printable-plan",

  // $19 Full Event Pack.
  // Automatically uses TEST_FULL_EVENT_PACK_LINK when USE_STRIPE_TEST_MODE is true,
  // and LIVE_FULL_EVENT_PACK_LINK when false.
  //
  // POST-PAYMENT REDIRECT SETUP (both test and live links):
  // Stripe: Dashboard → Payment Links → [your link] → After payment → Confirmation page
  //   → Set to "Redirect to your website" → URL: https://[your-domain]/success?unlock=full-event-pack
  fullEventPack: USE_STRIPE_TEST_MODE ? TEST_FULL_EVENT_PACK_LINK : LIVE_FULL_EVENT_PACK_LINK,

  // $49 Custom Plan — replace with your Stripe/Gumroad link or calendar booking link
  customPlan: "https://placeholder.example.com/custom-plan",
};

// ============================================================
// SUPPORT EMAIL
// Shown on the /success page when payment cannot be confirmed
// or when a buyer's plan is missing after a redirect.
//
// Replace "support@example.com" with your real support address
// before going live.
// ============================================================

export const SUPPORT_EMAIL = "devin@ghfc.org";

/**
 * Builds a URL-encoded mailto link for the support email.
 * Subject and body are encoded with encodeURIComponent so special
 * characters (spaces, newlines, em-dashes, etc.) are safe in all clients.
 */
export function buildSupportMailto(subject: string, body: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Returns true only when a payment link has been replaced with a real URL.
 * Placeholder links (placeholder.example.com) and null are both treated as
 * not configured — the UI should fall back to the planner instead of
 * navigating to a dead link.
 */
export function isConfigured(link: string | null | undefined): link is string {
  return typeof link === "string" && !link.includes("placeholder.example.com");
}

// ============================================================
// DEMO UNLOCK FLAG
//
// Set ENABLE_DEMO_UNLOCK to true while you are testing the
// monetization flow. It shows a small "Demo: Unlock Full Plan"
// button on the results page so you can see the locked content
// without going through a real payment.
//
// Set to false before going live. The button will disappear
// completely — no visible trace remains in the UI.
// ============================================================

export const ENABLE_DEMO_UNLOCK = false;

// ============================================================
// ACCESS CODES — CLIENT-SIDE ONLY (TESTING / EARLY ACCESS)
//
// Client-side access codes are for early testing only. For production
// coupon codes, validate codes on the backend and issue a signed token
// or session before setting unlock state on the client.
// ============================================================

export interface AccessCode {
  code: string;
  label: string;
  durationDays: number;
}

export const ACCESS_CODES: AccessCode[] = [
  {
    code: "DEVINTEST",
    label: "30-day tester access",
    durationDays: 30,
  },
];

// ============================================================
// PRICING DISPLAY CONFIG
// Update labels and descriptions here to match your copy.
// ============================================================

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  link: string | null;
  highlighted?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free Preview",
    price: "Free",
    description: "Preview your estimate before purchasing.",
    features: [
      "Event summary",
      "Revenue & profit estimate",
      "Top food items preview",
      "Risk flags",
    ],
    cta: "Start Planning",
    link: null,
  },
  {
    id: "full",
    name: "Full Event Pack",
    price: "$19",
    description: "Best for most fundraiser leaders.",
    features: [
      "Complete shopping list",
      "Complete supplies list",
      "Step-by-step prep timeline",
      "Volunteer role assignments",
      "Parent/student sign-up sheet",
      "Copyable volunteer email",
      "Print-ready event plan",
    ],
    cta: "Get the Full Event Pack",
    link: PAYMENT_LINKS.fullEventPack,
    highlighted: true,
  },
  {
    id: "custom",
    name: "Custom Plan",
    price: "$49",
    description: "We tailor a plan specifically for your event.",
    features: [
      "Everything in Full Event Pack",
      "Custom meal type support",
      "Personalized quantity review",
      "Priority email support",
      "1 revision included",
    ],
    cta: "Get Custom Plan",
    link: PAYMENT_LINKS.customPlan,
  },
];
