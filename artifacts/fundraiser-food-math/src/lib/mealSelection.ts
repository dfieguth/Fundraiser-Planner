import type { MealType } from "./types";

const DEFAULT_MEAL: MealType = "hotdogs";

/**
 * The initial Hot Dogs entry is a hidden compatibility default. The first
 * visible meal selection should replace it instead of creating a two-meal
 * plan.
 */
export function toggleMealSelection(current: MealType[], mealType: MealType): MealType[] {
  if (mealType === "walkingTacos" || mealType === "custom") {
    return [mealType];
  }

  if (current.length === 1 && current[0] === DEFAULT_MEAL && mealType !== DEFAULT_MEAL) {
    return [mealType];
  }

  if (current.includes(mealType)) {
    const next = current.filter((meal) => meal !== mealType);
    return next.length > 0 ? next : current;
  }

  if (current.length >= 2) {
    return [current[0], mealType];
  }

  return [...current, mealType];
}

export function selectSingleMeal(mealType: MealType): MealType[] {
  return [mealType];
}