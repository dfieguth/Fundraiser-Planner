import assert from "node:assert/strict";
import { calculatePlan } from "./calculator";
import { selectSingleMeal, toggleMealSelection } from "./mealSelection";
import { SAMPLE_TEMPLATES } from "./sampleTemplates";
import type { MealType, PlannerFormData } from "./types";
import { recalculateSavedPlan } from "./unlock";
import { buildPermanentPlanUrl, isCustomerFacingOrigin } from "@/config/paymentLinks";

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

function quantityFor(plan: ReturnType<typeof calculatePlan>, name: RegExp): string {
  const item = plan.foodQuantities.find((entry) => name.test(entry.ingredient));
  assert.ok(item, `Missing quantity for ${name}`);
  return item.quantity;
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
  const plan = calculatePlan(BASE_FORM);
  assert.equal(plan.summary.servingsToPrepare, 110);
  assert.equal(quantityFor(plan, /^Hot Dogs(?:$| )/i), "110 hot dogs needed");
  assert.equal(quantityFor(plan, /^Hot Dog Buns /i), "110 buns needed");
  assert.equal(
    plan.shoppingList.find((item) => /^Hot Dogs(?:$| )/i.test(item.item))?.quantity,
    "110 hot dogs needed",
  );
  assert.equal(
    plan.shoppingList.find((item) => /^Hot Dog Buns /i.test(item.item))?.quantity,
    "110 buns needed",
  );
}

{
  const multiMealPlan = calculatePlan({
    ...BASE_FORM,
    selectedMeals: ["hotdogs", "walkingTacos"],
    totalExpectedGuests: 100,
  });
  assert.deepEqual(
    multiMealPlan.multiMealSections?.map((section) => section.servings),
    [110, 100],
  );
  assert.equal(quantityFor(multiMealPlan, /^Hot Dogs(?:$| )/i), "110 hot dogs needed");
  assert.equal(quantityFor(multiMealPlan, /^Hot Dog Buns /i), "110 buns needed");
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

for (const template of SAMPLE_TEMPLATES) {
  const sampleMeal = template.formData.mealType as MealType;
  assert.deepEqual(
    toggleMealSelection([sampleMeal], "walkingTacos"),
    ["walkingTacos"],
    `${template.displayName} did not replace its sample meal with Walking Tacos`,
  );
  assert.deepEqual(
    toggleMealSelection([sampleMeal], "custom"),
    ["custom"],
    `${template.displayName} did not replace its sample meal with Custom Meal`,
  );
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

{
  for (const totalVolunteers of [0, 1, 3, 4]) {
    const plan = calculatePlan({
      ...BASE_FORM,
      adultVolunteers: totalVolunteers,
      studentVolunteers: 0,
    });
    const assigned = plan.volunteerPlan.reduce((sum, role) => sum + role.count, 0);
    assert.ok(
      assigned <= totalVolunteers,
      `Assigned ${assigned} roles for ${totalVolunteers} volunteers`,
    );
    assert.ok(
      plan.volunteerPlan.every((role) => (role.type as string) !== "Parent Oversight"),
      "Active volunteer output still contains Parent Oversight",
    );
    if (totalVolunteers === 0) {
      assert.ok(plan.volunteerPlan.every((role) => role.count === 0));
    }
    if (totalVolunteers === 1) {
      assert.equal(plan.volunteerPlan[0]?.role, "Grill Master");
      assert.equal(plan.volunteerPlan[0]?.count, 1);
      assert.ok(plan.volunteerPlan.slice(1).every((role) => role.count === 0));
    }
  }
}

{
  const customForm: PlannerFormData = {
    ...BASE_FORM,
    mealType: "custom",
    customMealName: "Community Taco Bar",
    customMenuMainDish: "Tacos",
    customMenuSides: ["salad"],
    customMenuDrinks: ["water"],
    customMenuDesserts: ["cookies"],
    customMenuDietary: ["vegetarian"],
  };
  const original = calculatePlan(customForm);
  const normalized = recalculateSavedPlan({ plan: original, formData: customForm });
  assert.ok(normalized);
  assert.equal(normalized.formData.customMealName, "Community Taco Bar");
  assert.deepEqual(normalized.formData.customMenuSides, ["salad"]);
  assert.equal(normalized.plan.summary.servingsToPrepare, 100);
  assert.deepEqual(quantitySnapshot(normalized.plan), quantitySnapshot(calculatePlan(customForm)));
  assert.equal(
    recalculateSavedPlan({
      plan: original,
      formData: { ...customForm, eventName: "" },
    }),
    null,
  );
  assert.equal(isCustomerFacingOrigin("https://fundraiserplanner.online"), true);
  assert.equal(isCustomerFacingOrigin("https://fundraiser-planner.replit.app"), false);
  assert.equal(
    buildPermanentPlanUrl("plan-id"),
    "https://fundraiserplanner.online/plan/plan-id",
  );
}

{
  const announcement = calculatePlan(BASE_FORM).commsPack.announcement;
  assert.ok(!/attendance|expecting \d+ guests|guests/i.test(announcement));

  const comms = calculatePlan(BASE_FORM).commsPack;
  assert.match(comms.volunteerRequest, /Reply to this message to sign up\./);
  assert.ok(!/group leader|adults and students/i.test(comms.volunteerRequest));
  assert.equal(
    Object.keys(comms).length,
    4,
    "Communication pack must keep its four message types",
  );
}