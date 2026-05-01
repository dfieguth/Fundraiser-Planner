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
  fullEventPack: "https://placeholder.example.com/full-event-pack",

  // $49 Custom Plan — replace with your Stripe/Gumroad link or calendar link
  customPlan: "https://placeholder.example.com/custom-plan",
} as const;

// ============================================================
// PRICING DISPLAY CONFIG
// Update labels and descriptions here.
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
    description: "Get instant estimates without saving or printing.",
    features: [
      "Shopping list estimate",
      "Food quantity calculator",
      "Profit estimate",
      "Volunteer plan overview",
    ],
    cta: "Start Planning",
    link: null,
  },
  {
    id: "printable",
    name: "Printable Plan",
    price: "$9",
    description: "One clean PDF you can print or share with your team.",
    features: [
      "Everything in Free",
      "Print-ready event plan",
      "Full prep timeline",
      "Volunteer assignment sheet",
      "Email blurb template",
    ],
    cta: "Get Printable Plan",
    link: PAYMENT_LINKS.printablePlan,
    highlighted: true,
  },
  {
    id: "full",
    name: "Full Event Pack",
    price: "$19",
    description: "Everything you need to run a polished fundraiser.",
    features: [
      "Everything in Printable",
      "Parent/student sign-up sheet",
      "Risk checklist",
      "Shopping store comparison",
      "Post-event debrief template",
    ],
    cta: "Get Full Pack",
    link: PAYMENT_LINKS.fullEventPack,
  },
  {
    id: "custom",
    name: "Custom Plan",
    price: "$49",
    description: "We tailor a plan specifically for your event.",
    features: [
      "Everything in Full Pack",
      "Custom meal type support",
      "Personalized quantity review",
      "Priority email support",
      "1 revision included",
    ],
    cta: "Get Custom Plan",
    link: PAYMENT_LINKS.customPlan,
  },
];
