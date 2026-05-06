// ============================================================
// Core types for Fundraiser Food Math
// ============================================================

export type MealType =
  | "hotdogs"
  | "burgers"
  | "bakedPotatoes"
  | "breakfastBurritos"
  | "tacos"
  | "spaghetti"
  | "pancakes"
  | "custom"
  // ── Combo meals ───────────────────────────────────────────
  | "combo_hotdogs_potatoes"   // Hot Dogs + Baked Potatoes
  | "combo_burgers_chips"      // Burgers + Chips
  | "combo_pancakes_sausage";  // Pancakes + Sausage (sausage already in pancakes — presented as explicit combo)

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
  foodQuantities: Array<{ ingredient: string; quantity: string; notes?: string }>;
  shoppingList: ShoppingItem[];
  shoppingListGrouped: ShoppingGroup[];
  suppliesList: SupplyItem[];
  costRange: [number, number];
  estimatedRevenue: number;
  estimatedProfit: [number, number];
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
