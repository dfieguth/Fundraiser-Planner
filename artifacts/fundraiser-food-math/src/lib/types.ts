// ============================================================
// Core types for Fundraiser Food Math
// ============================================================

export type MealType =
  | "hotdogs"
  | "burgers"
  | "bakedPotatoes"
  | "breakfastBurritos"
  | "tacos"
  | "walkingTacos"
  | "spaghetti"
  | "pancakes"
  | "custom"
  // ── Combo meals ───────────────────────────────────────────
  | "combo_hotdogs_potatoes"   // Hot Dogs + Baked Potatoes
  | "combo_burgers_chips"      // Burgers + Chips
  | "combo_pancakes_sausage";  // Pancakes + Sausage

export type OrgType =
  | "Church"
  | "School"
  | "Sports Team"
  | "Nonprofit"
  | "Other";

export type StorePreference =
  | "Costco"
  | "Sam's Club"
  | "Walmart"
  | "Smart & Final"
  | "Aldi"
  | "Local Grocery"
  | "Mixed";

export type PricingModel = "flat" | "split";

export interface PlannerFormData {
  eventName: string;
  orgType: OrgType;
  mealType: MealType;
  attendance: number;
  mealPrice: number;
  adultPercent: number;
  kidPercent: number;
  storePreference: StorePreference;
  prepStartTime: string;
  serveStartTime: string;
  serveEndTime: string;
  adultVolunteers: number;
  studentVolunteers: number;
  notes: string;
  // ── Pricing model ────────────────────────────────────────
  pricingModel?: PricingModel;             // "flat" = single price (default), "split" = tiered
  individualPrice?: number;                // $ per individual attendee
  familyPrice?: number;                    // $ per family group
  individualPercent?: number;              // legacy — % attending as individuals (default 40)
  donationRate?: number;                   // baseline % of attendees who actually donate (default 75)
  // ── Attendee mix (tiered pricing) ────────────────────────
  soloAdultPct?: number;                   // % of crowd that are solo adults (default 22)
  couplesPct?: number;                     // % arriving as couples / pairs (default 25)
  familiesPct?: number;                    // % arriving as families with kids (default 45)
  teensPct?: number;                       // % arriving as unaccompanied teens (default 8)
  avgFamilySize?: number;                  // average people per family group (default 3.75)
  familyPriceAdoptionRate?: number;        // % of families choosing family bundle price (default 80)
  // ── Attendance range mode ─────────────────────────────────
  attendanceMode?: "exact" | "estimate";
  attendanceLow?: number;
  attendanceHigh?: number;
  // ── Custom meal (Tier 1 free-text) ───────────────────────
  customMealName?: string;
  customServingSize?: string;
  customIngredients?: string;
  // ── Tier 2 "Tell Us About Your Menu" follow-up ───────────
  customMenuMainDish?: string;
  customMenuSides?: string[];    // e.g. ["rolls", "chips", "salad", "mac", "coleslaw", "other"]
  customMenuDrinks?: string[];   // e.g. ["water", "lemonade", "coffee", "soda", "none"]
  customMenuDesserts?: string[]; // e.g. ["cookies", "brownies", "cake", "none"]
  customMenuDietary?: string[];  // e.g. ["vegetarian", "glutenFree", "nutAllergy"]
  // ── Customize Your Menu (item selection + custom prices) ──
  excludedItems?: string[];                     // names of items the user has unchecked
  customItemPrices?: Record<string, number>;    // item name → custom price per package
  // ── Multi-meal mode ──────────────────────────────────────
  selectedMeals?: string[];                     // 1 or 2 selected meal types
  mealServings?: Record<string, number>;        // independent serving count per meal
  totalExpectedGuests?: number;                 // total guests for coverage + supplies
}

export interface ShoppingItem {
  item: string;
  quantity: string;
  estimatedCost: [number, number];
  notes?: string;
  category?: string; // ingredient category key for grouping
}

export interface ShoppingGroup {
  label: string;      // display name for this category
  items: ShoppingItem[];
}

export interface SupplyItem {
  item: string;
  quantity: string;
  estimatedCost: [number, number];
}

export interface PrepStep {
  time: string;
  task: string;
  who: string;
  duration: string;
  leaderNote?: string;   // actionable note for the event leader
  watchOut?: string;     // common failure point to avoid
}

export interface VolunteerRole {
  role: string;
  count: number;
  type: "Adult Volunteer" | "Parent Volunteer" | "Parent Oversight" | "Student Volunteer";
  duties: string[];
}

export interface RiskWarning {
  level: "warning" | "error" | "info";
  message: string;
}

export interface RiskPlanItem {
  level: "warning" | "error" | "info";
  warning: string;
  fix: string;
}

// ── Full Event Pack sections ──────────────────────────────────

export interface StrategySection {
  bestFit: string;
  mainProfitDriver: string;
  mainExecutionRisk: string;
  recommendedFocus: string;
}

export interface ProfitStrategy {
  priceCheck: string;
  upsellIdeas: string[];
  donationTableNote: string;
  signageLines: string[];
  pricingModel: string;
}

export interface SetupStation {
  position: string;
  label: string;
  detail: string;
}

export interface LeftoverPlan {
  canSave: string[];
  discard: string[];
  packaging: string;
  whoDecides: string;
}

export interface CommsPack {
  announcement: string;
  volunteerRequest: string;
  dayBeforeReminder: string;
  thankYou: string;
}

// ── Revenue scenario (3-scenario model) ──────────────────────
export interface RevenueScenario {
  label: string;
  conversionRate: number;    // % (e.g. 65, 75, 85)
  grossRevenue: number;
  costRange: [number, number];
  netProfitRange: [number, number];
  revenuePerAttendee: number;
  breakEvenAttendance: number;
}

export interface MultiMealSection {
  mealType: string;
  label: string;
  emoji: string;
  servings: number;
  shoppingList: ShoppingItem[];
  shoppingListGrouped: ShoppingGroup[];
  costRange: [number, number];
}

export interface FundraiserPlan {
  summary: {
    eventName: string;
    orgType: string;
    mealType: string;
    attendance: number;
    adults: number;
    kids: number;
    mealPrice: number;
    storePreference: string;
  };
  // ── Multi-meal output ─────────────────────────────────────
  multiMealSections?: MultiMealSection[];
  sharedSuppliesList?: SupplyItem[];
  foodQuantities: Array<{ ingredient: string; quantity: string; notes?: string }>;
  shoppingList: ShoppingItem[];
  shoppingListGrouped: ShoppingGroup[];
  suppliesList: SupplyItem[];
  costRange: [number, number];
  estimatedRevenue: number;
  revenueConservative?: number;
  revenueGenerous?: number;
  estimatedProfit: [number, number];
  // Three-scenario revenue model
  revenueScenarios?: {
    conservative: RevenueScenario;
    baseline: RevenueScenario;
    optimistic: RevenueScenario;
  };
  pricingMethodologyNote?: string;
  // Attendance range / scenario bundle
  scenarioBundle?: {
    conservative: { attendance: number; estimatedRevenue: number; costRange: [number, number]; estimatedProfit: [number, number] };
    expected:     { attendance: number; estimatedRevenue: number; costRange: [number, number]; estimatedProfit: [number, number] };
    generous:     { attendance: number; estimatedRevenue: number; costRange: [number, number]; estimatedProfit: [number, number] };
  };
  prepTimeline: PrepStep[];
  volunteerPlan: VolunteerRole[];
  riskWarnings: RiskWarning[];
  riskPlan: RiskPlanItem[];
  emailBlurb: string;
  disclaimer: string;
  // Full Event Pack sections
  strategySummary: StrategySection;
  profitStrategy: ProfitStrategy;
  volunteerBriefing: string;
  setupLayout: SetupStation[];
  leftoverPlan: LeftoverPlan;
  commsPack: CommsPack;
}
