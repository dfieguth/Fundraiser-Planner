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

import type { FundraiserPlan, PlannerFormData } from "@/lib/types";
import { ACCESS_CODES } from "@/config/paymentLinks";

// ── Storage keys ─────────────────────────────────────────────
// Change these if you need to namespace multiple apps on the same origin.
export const UNLOCK_KEY = "ffm_unlocked";
export const PLAN_SAVE_KEY = "ffm_plan_saved";

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
 * NOTE: Client-side access codes are for early testing only.
 * For production coupon codes, validate codes on the backend.
 */
export function applyAccessCode(code: string): "ok" | "invalid" {
  const normalized = code.trim().toUpperCase();
  const match = ACCESS_CODES.find((ac) => ac.code.trim().toUpperCase() === normalized);
  if (!match) return "invalid";
  setUnlockedWithCode(match.durationDays);
  return "ok";
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
    const payload: SavedPlan = { plan, formData };
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
    return JSON.parse(raw) as SavedPlan;
  } catch {
    return null;
  }
}
