// ============================================================
// PAYMENT LINKS CONFIGURATION
// Replace the placeholder URLs below with your actual
// Stripe Payment Links or Gumroad product links.
// ============================================================

export const PAYMENT_LINKS = {
  // Free tier — no payment needed, just scroll to planner
  free: null,

  // $9 Printable Plan — replace with your Stripe/Gumroad link
  printablePlan: "https://placeholder.example.com/printable-plan",

  // $19 Full Event Pack — replace with your Stripe/Gumroad link
  // ↑ This is the primary paid product. Paste your link here.
  fullEventPack: "https://placeholder.example.com/full-event-pack",

  // $49 Custom Plan — replace with your Stripe/Gumroad link or calendar booking link
  customPlan: "https://placeholder.example.com/custom-plan",
} as const;

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

export const ENABLE_DEMO_UNLOCK = true;

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
