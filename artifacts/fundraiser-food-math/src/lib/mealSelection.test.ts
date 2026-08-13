import assert from "node:assert/strict";
import { calculatePlan } from "./calculator";
import { selectSingleMeal, toggleMealSelection } from "./mealSelection";
import type { PlannerFormData } from "./types";

const BASE_FORM: PlannerFormData = {
  eventName: "100 Guest Selection Regression",
  orgType: "School",
  mealType: "hotdogs",
  attendance: 100,
  mealPrice: 10,
  adultPercent: 60,
  kidPercent: 40,
  storePreference: "Mixed",
  prepStartTime: "10:00",
  serveStartTime: "12:00",
  serveEndTime: "14:00",
  adultVolunteers: 8,
  studentVolunteers: 4,
  notes: "",
  customMenuMainDish: "",
  customMenuSides: [],
  customMenuDrinks: [],
  customMenuDesserts: [],
  customMenuDietary: [],
};

function itemNames(plan: ReturnType<typeof calculatePlan>): string[] {
  return [
    ...plan.foodQuantities.map((item) => item.ingredient),
    ...plan.shoppingList.map((item) => item.item),
  ];
}

{
  const selectedMeals = toggleMealSelection(["hotdogs"], "walkingTacos");
  assert.deepEqual(selectedMeals, ["walkingTacos"]);

  const plan = calculatePlan({
    ...BASE_FORM,
    mealType: selectedMeals[0]!,
  });

  assert.equal(plan.summary.attendance, 100);
  assert.equal(plan.summary.mealType, "Walking Tacos");
  assert.equal(plan.multiMealSections, undefined);
  assert.ok(!itemNames(plan).some((name) => /hot dog|bun|canned chili/i.test(name)));
}

{
  const selectedMeals = selectSingleMeal("custom");
  assert.deepEqual(selectedMeals, ["custom"]);

  const plan = calculatePlan({
    ...BASE_FORM,
    mealType: selectedMeals[0]!,
    customMenuMainDish: "Pasta",
    customMenuSides: ["salad"],
    customMenuDrinks: ["water"],
    customMenuDesserts: ["cookies"],
    customMenuDietary: ["vegetarian"],
  });

  assert.equal(plan.summary.attendance, 100);
  assert.equal(plan.summary.mealType, "Custom Meal");
  assert.equal(plan.multiMealSections, undefined);
  assert.ok(!itemNames(plan).some((name) => /hot dog|bun|canned chili/i.test(name)));
}

console.log("Meal-selection regressions passed for 100 guests.");