import assert from "node:assert/strict";
import { calculatePlan } from "./calculator";
import { selectSingleMeal, toggleMealSelection } from "./mealSelection";
import type { MealType, PlannerFormData } from "./types";

const BASE_FORM: PlannerFormData = {
  eventName: "100 Guest Selection Regression",
  orgType: "School",
  mealType: "hotdogs",
  attendance: 100,
  mealPrice: 10,
  // Legacy fields are intentionally extreme to prove they do not affect output.
  adultPercent: 0,
  kidPercent: 100,
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

function quantitySnapshot(plan: ReturnType<typeof calculatePlan>) {
  return {
    foodQuantities: plan.foodQuantities,
    shoppingList: plan.shoppingList,
    suppliesList: plan.suppliesList,
    drinksList: plan.drinksList,
  };
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

const SUPPORTED_MEALS: Array<{ mealType: MealType; label: string }> = [
  { mealType: "hotdogs", label: "Hot Dogs" },
  { mealType: "burgers", label: "Burgers" },
  { mealType: "bakedPotatoes", label: "Baked Potatoes" },
  { mealType: "breakfastBurritos", label: "Breakfast Burritos" },
  { mealType: "tacos", label: "Tacos" },
  { mealType: "walkingTacos", label: "Walking Tacos" },
  { mealType: "spaghetti", label: "Spaghetti" },
  { mealType: "pancakes", label: "Pancakes" },
  { mealType: "custom", label: "Custom Meal" },
  { mealType: "combo_hotdogs_potatoes", label: "Hot Dogs + Baked Potatoes" },
  { mealType: "combo_burgers_chips", label: "Burgers + Chips" },
  { mealType: "combo_pancakes_sausage", label: "Pancakes + Sausage" },
];

console.log("\n100-guest supported meal matrix:");
for (const { mealType, label } of SUPPORTED_MEALS) {
  const mealDetails = mealType === "custom"
    ? {
        customMenuMainDish: "Pasta",
        customMenuSides: ["rolls", "salad", "mac"],
        customMenuDrinks: ["water", "lemonade"],
        customMenuDesserts: ["cookies", "brownies"],
      }
    : {};

  const allAdultsPlan = calculatePlan({
    ...BASE_FORM,
    ...mealDetails,
    mealType,
    adultPercent: 100,
    kidPercent: 0,
  });
  const allKidsPlan = calculatePlan({
    ...BASE_FORM,
    ...mealDetails,
    mealType,
    adultPercent: 0,
    kidPercent: 100,
  });

  assert.equal(allAdultsPlan.summary.attendance, 100);
  assert.deepEqual(
    quantitySnapshot(allAdultsPlan),
    quantitySnapshot(allKidsPlan),
    `${label} quantities changed with legacy age fields`,
  );
  assert.ok(allAdultsPlan.summary.servingsToPrepare > 0);

  const servings = allAdultsPlan.multiMealSections
    ? allAdultsPlan.multiMealSections.map((section) => `${section.label}: ${section.servings}`).join(" + ")
    : `${allAdultsPlan.summary.servingsToPrepare}`;
  const firstFive = allAdultsPlan.shoppingList
    .slice(0, 5)
    .map((item) => `${item.item} (${item.quantity})`)
    .join("; ");
  console.log(`- ${label}: ${servings} servings | ${firstFive}`);
}

console.log("Meal-selection regressions passed for 100 guests.");