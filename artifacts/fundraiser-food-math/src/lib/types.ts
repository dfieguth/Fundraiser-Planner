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
  | "custom";

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
  // For custom meal type
  customMealName?: string;
  customServingSize?: string;
  customIngredients?: string;
}

export interface ShoppingItem {
  item: string;
  quantity: string;
  estimatedCost: [number, number]; // [low, high]
  notes?: string;
}

export interface SupplyItem {
  item: string;
  quantity: string;
  estimatedCost: [number, number];
}

export interface PrepStep {
  time: string;
  task: string;
  who: string; // "Adult Volunteer" | "Parent Oversight" | "Student Volunteer" etc.
  duration: string;
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
  suppliesList: SupplyItem[];
  costRange: [number, number];
  estimatedRevenue: number;
  estimatedProfit: [number, number];
  prepTimeline: PrepStep[];
  volunteerPlan: VolunteerRole[];
  riskWarnings: RiskWarning[];
  emailBlurb: string;
  disclaimer: string;
}
