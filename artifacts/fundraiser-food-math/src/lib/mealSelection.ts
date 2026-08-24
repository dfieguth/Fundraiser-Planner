import type { MealType } from "./types";

/** Public launch planning permits one meal. */
export function toggleMealSelection(current: MealType[], mealType: MealType): MealType[] {
  return current[0] === mealType ? current : [mealType];
}

export function selectSingleMeal(mealType: MealType): MealType[] {
  return [mealType];
}