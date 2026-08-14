import type { MealType } from "./types";
import { COMBO_DEFINITIONS, MEAL_ASSUMPTIONS, isComboMeal } from "./mealAssumptions";

/**
 * North Star quantity rule:
 * servings to prepare = ceiling(guest count × meal per-guest serving factor)
 */
export function calculatePreparedServings(guestCount: number, perGuestServings: number): number {
  const guests = Math.max(1, Number(guestCount) || 1);
  const rawServings = guests * perGuestServings;
  const nearestInteger = Math.round(rawServings);
  // Decimal factors such as 1.1 can produce 110.00000000000001 in
  // JavaScript. Treat only that floating-point noise as the exact integer
  // it represents; preserve real fractions for the ceiling rule.
  if (Math.abs(rawServings - nearestInteger) < 1e-9) {
    return nearestInteger;
  }
  return Math.ceil(rawServings);
}

export function getPreparedServingCounts(guestCount: number, mealType: MealType): number[] {
  if (isComboMeal(mealType)) {
    return (COMBO_DEFINITIONS[mealType]?.components ?? []).map((component) =>
      calculatePreparedServings(guestCount, component.perGuestServings)
    );
  }

  const assumption = MEAL_ASSUMPTIONS[mealType] ?? MEAL_ASSUMPTIONS.custom;
  return [calculatePreparedServings(guestCount, assumption.perGuestServings)];
}

export function getPreparedServings(guestCount: number, mealType: MealType): number {
  return getPreparedServingCounts(guestCount, mealType).reduce((total, count) => total + count, 0);
}