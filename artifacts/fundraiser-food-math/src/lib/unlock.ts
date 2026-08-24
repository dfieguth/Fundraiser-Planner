// ============================================================
// SHARED UNLOCK HELPER
//
// MVP unlock flow: this is based on post-payment redirect and
// is not server-verified. For higher-volume sales, replace with
// Stripe webhook verification.
//
// All unlock state is stored in localStorage so it survives
// tab navigation and Stripe/Gumroad redirect round-trips.
// The plan data is also stored in localStorage before the user
// leaves for payment, then restored on the /success page.
// ============================================================

import { calculatePlan } from "@/lib/calculator";
import type {
  FundraiserPlan,
  MealType,
  OrgType,
  PlannerFormData,
  StorePreference,
} from "@/lib/types";

// ── Storage keys ─────────────────────────────────────────────
// Change these if you need to namespace multiple apps on the same origin.
export const UNLOCK_KEY = "ffm_unlocked";
export const PLAN_SAVE_KEY = "ffm_plan_saved";

// Durable plan id returned by the server after a verified purchase.
// The permanent link is /plan/<planId> and works on any device.
export const PLAN_ID_KEY = "ffm_plan_id";

export function savePlanId(planId: string): void {
  try {
    localStorage.setItem(PLAN_ID_KEY, planId);
  } catch {
    // ignore
  }
}

export function getPlanId(): string | null {
  try {
    return localStorage.getItem(PLAN_ID_KEY);
  } catch {
    return null;
  }
}

// Expiration timestamp (ms since epoch) for access-code-based unlocks.
// Only written when unlocking via an access code — Stripe unlocks do not expire.
export const UNLOCK_EXPIRES_KEY = "ffm_unlock_expires";

// Key accepted in the ?unlock= query param to grant Full Event Pack access.
// Must match what you configure as the Stripe/Gumroad success redirect URL.
export const FULL_PACK_UNLOCK_VALUE = "full-event-pack";

// ── Saved plan shape ─────────────────────────────────────────
export interface SavedPlan {
  plan: FundraiserPlan;
  formData: PlannerFormData;
}

const VALID_MEAL_TYPES: MealType[] = [
  "hotdogs",
  "burgers",
  "bakedPotatoes",
  "breakfastBurritos",
  "tacos",
  "walkingTacos",
  "spaghetti",
  "pancakes",
  "custom",
  "combo_hotdogs_potatoes",
  "combo_burgers_chips",
  "combo_pancakes_sausage",
];
const VALID_ORG_TYPES: OrgType[] = ["Church", "School", "Sports Team", "Nonprofit", "Other"];
const VALID_STORE_PREFERENCES: StorePreference[] = [
  "Costco",
  "Sam's Club",
  "Walmart",
  "Smart & Final",
  "Aldi",
  "Local Grocery",
  "Mixed",
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalStringArray(value: unknown): value is string[] {
  return value === undefined
    || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

/**
 * Saved form data must contain the fields required by the current planner.
 * We intentionally do not fill missing values here: an incomplete historical
 * purchase must remain a paid-but-no-plan record rather than becoming a plan
 * with invented defaults.
 */
export function isValidSavedFormData(value: unknown): value is PlannerFormData {
  if (!value || typeof value !== "object") return false;
  const form = value as Partial<PlannerFormData>;

  if (
    !isNonEmptyString(form.eventName)
    || !VALID_ORG_TYPES.includes(form.orgType as OrgType)
    || !VALID_MEAL_TYPES.includes(form.mealType as MealType)
    || !VALID_STORE_PREFERENCES.includes(form.storePreference as StorePreference)
    || !isNonEmptyString(form.prepStartTime)
    || !isNonEmptyString(form.serveStartTime)
    || !isNonEmptyString(form.serveEndTime)
    || !isFiniteNumber(form.attendance)
    || form.attendance < 10
    || form.attendance > 5000
    || !isFiniteNumber(form.mealPrice)
    || form.mealPrice < 0.5
    || !isFiniteNumber(form.adultVolunteers)
    || form.adultVolunteers < 0
    || !isFiniteNumber(form.studentVolunteers)
    || form.studentVolunteers < 0
  ) {
    return false;
  }

  if (
    form.selectedMeals !== undefined
    && (!Array.isArray(form.selectedMeals)
      || form.selectedMeals.length === 0
      || form.selectedMeals.length > 2
      || form.selectedMeals.some((meal) => !VALID_MEAL_TYPES.includes(meal as MealType)))
  ) {
    return false;
  }

  return isOptionalStringArray(form.customMenuSides)
    && isOptionalStringArray(form.customMenuDrinks)
    && isOptionalStringArray(form.customMenuDesserts)
    && isOptionalStringArray(form.customMenuDietary);
}

/**
 * Rebuilds a saved plan from its saved form using the current calculator.
 * This keeps the summary, food quantities, and shopping list on one rule set
 * while preserving all custom meal information stored in formData.
 */
export function recalculateSavedPlan(saved: SavedPlan): SavedPlan | null {
  if (!isValidSavedFormData(saved?.formData)) return null;

  try {
    return {
      formData: saved.formData,
      plan: calculatePlan(saved.formData),
    };
  } catch {
    return null;
  }
}

// ── Unlock state ─────────────────────────────────────────────

/**
 * Returns true if the Full Event Pack is unlocked on this device.
 *
 * Two unlock modes:
 *   "true"  — Stripe redirect unlock (non-expiring)
 *   "code"  — Access code unlock (expires after durationDays)
 *
 * Reads from localStorage so it persists across redirects and tab close/reopen.
 */
export function getUnlocked(): boolean {
  try {
    const val = localStorage.getItem(UNLOCK_KEY);
    if (val === "true") return true; // Stripe unlock — never expires
    if (val === "code") {
      const expiresRaw = localStorage.getItem(UNLOCK_EXPIRES_KEY);
      if (!expiresRaw) return false;
      return Date.now() < parseInt(expiresRaw, 10);
    }
    return false;
  } catch {
    return false;
  }
}

export function hasExpiredCodeUnlock(): boolean {
  try {
    if (localStorage.getItem(UNLOCK_KEY) !== "code") return false;
    const expiresRaw = localStorage.getItem(UNLOCK_EXPIRES_KEY);
    if (!expiresRaw) return false;
    const expiresAt = parseInt(expiresRaw, 10);
    if (!Number.isFinite(expiresAt)) return false;
    return Date.now() > expiresAt;
  } catch {
    return false;
  }
}

/**
 * Marks the Full Event Pack as unlocked on this device via Stripe payment.
 * This unlock is non-expiring.
 * Also writes to sessionStorage["ffm_plan"] if a saved plan exists,
 * so the PrintPage can find the plan immediately after unlock.
 */
export function setUnlocked(): void {
  try {
    localStorage.setItem(UNLOCK_KEY, "true");
    // Mirror the saved plan into sessionStorage so PrintPage finds it
    // without requiring a separate call from the success page.
    const saved = getStoredPlan();
    if (saved) {
      sessionStorage.setItem("ffm_plan", JSON.stringify(saved));
    }
  } catch {
    // localStorage may be blocked in certain privacy modes — fail silently.
  }
}

/**
 * Marks the Full Event Pack as unlocked on this device via access code.
 * This unlock expires after durationDays days.
 * Also writes to sessionStorage["ffm_plan"] so PrintPage finds the plan immediately.
 */
export function setUnlockedWithCode(durationDays: number): void {
  try {
    const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    localStorage.setItem(UNLOCK_KEY, "code");
    localStorage.setItem(UNLOCK_EXPIRES_KEY, String(expiresAt));
    const saved = getStoredPlan();
    if (saved) {
      sessionStorage.setItem("ffm_plan", JSON.stringify(saved));
    }
  } catch {
    // fail silently
  }
}

/**
 * Attempts to unlock via an access code.
 * Matching is case-insensitive and trims surrounding whitespace.
 *
 * Returns "ok" if the code matched and unlock was applied,
 * or "invalid" if the code was not recognized.
 *
 * Validation happens on the API server so reusable codes never ship in the
 * public frontend bundle.
 */
export async function applyAccessCode(code: string): Promise<"ok" | "invalid"> {
  try {
    const response = await fetch("/api/access-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) return "invalid";
    const result = await response.json() as { valid?: boolean; durationDays?: number };
    if (!result.valid || !Number.isFinite(result.durationDays)) return "invalid";
    setUnlockedWithCode(result.durationDays!);
    return "ok";
  } catch {
    return "invalid";
  }
}

// ── Plan persistence ─────────────────────────────────────────

/**
 * Saves the current plan to localStorage before the user navigates away
 * to Stripe or Gumroad. Call this in the payment CTA's onClick handler.
 *
 * Also writes to sessionStorage["ffm_plan"] so the PrintPage can find it
 * in the current tab session.
 */
export function savePlanBeforePayment(plan: FundraiserPlan, formData: PlannerFormData): void {
  try {
    const payload = recalculateSavedPlan({ plan, formData }) ?? { plan, formData };
    const json = JSON.stringify(payload);
    localStorage.setItem(PLAN_SAVE_KEY, json);
    // Keep sessionStorage in sync for the print page (same-tab access).
    sessionStorage.setItem("ffm_plan", json);
  } catch {
    // ignore
  }
}

/**
 * Retrieves the plan saved before payment from localStorage.
 * Returns null if nothing was saved or if parsing fails.
 */
export function getStoredPlan(): SavedPlan | null {
  try {
    const raw = localStorage.getItem(PLAN_SAVE_KEY);
    if (!raw) return null;
    return recalculateSavedPlan(JSON.parse(raw) as SavedPlan);
  } catch {
    return null;
  }
}

/**
 * Reads the same saved-plan payload from the current tab and applies the
 * same current-rule recalculation as localStorage restores.
 */
export function getSessionStoredPlan(): SavedPlan | null {
  try {
    const raw = sessionStorage.getItem("ffm_plan");
    if (!raw) return null;
    return recalculateSavedPlan(JSON.parse(raw) as SavedPlan);
  } catch {
    return null;
  }
}
