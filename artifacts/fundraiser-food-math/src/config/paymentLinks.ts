// ============================================================
// BACKEND READINESS NOTE
//
// The paid flow verifies the Stripe session server-side, stores a durable
// purchase, and keeps a local unlock only as a convenience for the current
// browser. Signed webhook processing is handled by the API server.
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
//        URL: https://fundraiserplanner.online/success?unlock=full-event-pack&session_id={CHECKOUT_SESSION_ID}
//      Or in Gumroad:
//        Product settings → Redirect URL → https://fundraiserplanner.online/success?unlock=full-event-pack&session_id={CHECKOUT_SESSION_ID}
//  [ ] Test a full purchase flow in the same browser tab before launch
//
//  Canonical customer-facing URL: https://fundraiserplanner.online
//  Success redirect:  https://fundraiserplanner.online/success?unlock=full-event-pack&session_id={CHECKOUT_SESSION_ID}
// ============================================================

// ============================================================
// PAYMENT LINKS CONFIGURATION
// Replace the placeholder URLs below with your actual
// Stripe Payment Links or Gumroad product links.
//
// DEVELOPER NOTE — SECURITY POSTURE:
// Do not remove server-side checkout-session verification or signed webhook
// verification. The URL parameter and browser storage are not payment proof;
// they only carry the local plan through the redirect.
// ============================================================

// ── Stripe test / live switch ────────────────────────────────
// Set USE_STRIPE_TEST_MODE = true to send buyers to the Stripe test
// payment link. Set to false before going live.
//
// BEFORE GOING LIVE: set USE_STRIPE_TEST_MODE = false
// ─────────────────────────────────────────────────────────────
export const LIVE_FULL_EVENT_PACK_LINK = "https://buy.stripe.com/28E7sF4DPgWw8pVgvE9EI00";
export const TEST_FULL_EVENT_PACK_LINK = "https://buy.stripe.com/test_28E7sF4DPgWw8pVgvE9EI00";
export const USE_STRIPE_TEST_MODE = false;
export const CUSTOMER_FACING_ORIGIN = "https://fundraiserplanner.online";

export function isCustomerFacingOrigin(origin: string): boolean {
  return origin === CUSTOMER_FACING_ORIGIN;
}

export function buildPermanentPlanUrl(planId: string): string {
  return `${CUSTOMER_FACING_ORIGIN}/plan/${planId}`;
}

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
  //   → Set to "Redirect to your website"
  //   → URL: https://fundraiserplanner.online/success?unlock=full-event-pack&session_id={CHECKOUT_SESSION_ID}
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
// Tester codes are reusable. Reapplying a valid code refreshes the unlock
// window from the time of application. For production coupon codes, validate
// codes on the backend and issue a signed token or session before setting
// unlock state on the client.
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
    name: "Founding Event Pack",
    price: "$19",
    description: "Ready-to-use fundraiser plan with planning, copy, and design help.",
    features: [
      "Food quantities and shopping list",
      "Prep timeline and volunteer plan",
      "Basic budget range",
      "Announcement copy",
      "Canva flyer brief",
      "Print-ready event plan",
    ],
    cta: "Get the Founding Event Pack",
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