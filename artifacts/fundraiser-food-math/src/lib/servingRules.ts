import type { MealType } from "./types";
import { COMBO_DEFINITIONS, MEAL_ASSUMPTIONS, isComboMeal } from "./mealAssumptions";

/**
 * North Star quantity rule:
 * servings to prepare = ceiling(guest count × meal per-guest serving factor)
 */
export function calculatePreparedServings(guestCount: number, perGuestServings: number): number {
  const guests = Math.max(1, Number(guestCount) || 1);
  return Math.ceil(guests * perGuestServings);
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