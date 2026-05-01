// ============================================================
// MEAL ASSUMPTIONS
// Edit these objects to update default quantities, costs,
// ingredients, and serving sizes for each meal type.
// ============================================================

export interface MealAssumption {
  label: string;
  displayName: string;
  adultServings: number;     // servings per adult
  kidServings: number;       // servings per kid (fraction of adult)
  wasteBuffer: number;       // multiplier e.g. 1.10 = 10% extra
  ingredients: IngredientDef[];
  supplies: SupplyDef[];
  prepNotes: string;
  cookNote: string;
}

export interface IngredientDef {
  name: string;
  // unit = what one "serving" requires
  perServing: number;
  unit: string;
  // packaging: how it's sold
  packageSize: number;
  packageUnit: string;
  // cost range per package [low, high]
  costPerPackage: [number, number];
  category: "protein" | "carb" | "dairy" | "produce" | "condiment" | "other";
}

export interface SupplyDef {
  name: string;
  perPerson: number;
  packageSize: number;
  costPerPackage: [number, number];
}

// ============================================================
// HOT DOGS
// ============================================================
export const hotDogAssumptions: MealAssumption = {
  label: "hotdogs",
  displayName: "Hot Dogs",
  adultServings: 2,
  kidServings: 1.5,
  wasteBuffer: 1.1,
  ingredients: [
    {
      name: "Hot Dogs (all-beef)",
      perServing: 1,
      unit: "dog",
      packageSize: 10,
      packageUnit: "pack",
      costPerPackage: [3.5, 6],
      category: "protein",
    },
    {
      name: "Hot Dog Buns",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "pack",
      costPerPackage: [2.5, 4],
      category: "carb",
    },
    {
      name: "Ketchup",
      perServing: 0.05,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "bottle (32oz)",
      costPerPackage: [3, 5],
      category: "condiment",
    },
    {
      name: "Mustard",
      perServing: 0.05,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "bottle (20oz)",
      costPerPackage: [2, 3.5],
      category: "condiment",
    },
    {
      name: "Relish",
      perServing: 0.04,
      unit: "jar",
      packageSize: 1,
      packageUnit: "jar (10oz)",
      costPerPackage: [2, 3.5],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Paper Plates", perPerson: 1, packageSize: 100, costPerPackage: [4, 8] },
    { name: "Napkins", perPerson: 3, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Serving Tongs", perPerson: 0.01, packageSize: 1, costPerPackage: [5, 12] },
    { name: "Aluminum Foil", perPerson: 0.1, packageSize: 1, costPerPackage: [4, 8] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
  ],
  prepNotes: "Pre-split duties: grill master, bun handler, condiment station.",
  cookNote: "Grill or steam hot dogs. Average 90–120 dogs per hour on a standard grill.",
};

// ============================================================
// BURGERS
// ============================================================
export const burgerAssumptions: MealAssumption = {
  label: "burgers",
  displayName: "Burgers",
  adultServings: 1.5,
  kidServings: 1,
  wasteBuffer: 1.1,
  ingredients: [
    {
      name: "Ground Beef (80/20)",
      perServing: 0.25, // lbs per patty
      unit: "lb",
      packageSize: 5,
      packageUnit: "lb pack",
      costPerPackage: [15, 22],
      category: "protein",
    },
    {
      name: "Burger Buns",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "pack",
      costPerPackage: [2.5, 4.5],
      category: "carb",
    },
    {
      name: "American Cheese Slices",
      perServing: 1,
      unit: "slice",
      packageSize: 24,
      packageUnit: "pack",
      costPerPackage: [4, 7],
      category: "dairy",
    },
    {
      name: "Lettuce",
      perServing: 0.05,
      unit: "head",
      packageSize: 1,
      packageUnit: "head",
      costPerPackage: [1.5, 3],
      category: "produce",
    },
    {
      name: "Tomatoes",
      perServing: 0.1,
      unit: "tomato",
      packageSize: 5,
      packageUnit: "lb",
      costPerPackage: [3, 6],
      category: "produce",
    },
    {
      name: "Ketchup",
      perServing: 0.05,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "bottle (32oz)",
      costPerPackage: [3, 5],
      category: "condiment",
    },
    {
      name: "Mustard",
      perServing: 0.04,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "bottle (20oz)",
      costPerPackage: [2, 3.5],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Paper Plates (sturdy)", perPerson: 1, packageSize: 100, costPerPackage: [6, 10] },
    { name: "Napkins", perPerson: 4, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Plastic Knives", perPerson: 0.5, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Serving Spatulas", perPerson: 0.01, packageSize: 1, costPerPackage: [8, 15] },
    { name: "Aluminum Foil", perPerson: 0.15, packageSize: 1, costPerPackage: [4, 8] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
  ],
  prepNotes: "Form patties ahead of time. Chill until 30 min before grill time.",
  cookNote: "Grill patties 4–5 min per side. Plan for 60–80 burgers per hour.",
};

// ============================================================
// BAKED POTATOES
// ============================================================
export const bakedPotatoAssumptions: MealAssumption = {
  label: "bakedPotatoes",
  displayName: "Baked Potatoes",
  adultServings: 1.5,
  kidServings: 1,
  wasteBuffer: 1.1,
  ingredients: [
    {
      name: "Russet Potatoes",
      perServing: 1,
      unit: "potato",
      packageSize: 10,
      packageUnit: "lb bag (~10 potatoes)",
      costPerPackage: [5, 9],
      category: "carb",
    },
    {
      name: "Butter / Margarine",
      perServing: 0.05,
      unit: "lb",
      packageSize: 1,
      packageUnit: "lb",
      costPerPackage: [3, 6],
      category: "dairy",
    },
    {
      name: "Sour Cream",
      perServing: 0.03,
      unit: "container",
      packageSize: 1,
      packageUnit: "16oz container",
      costPerPackage: [2.5, 4.5],
      category: "dairy",
    },
    {
      name: "Shredded Cheddar Cheese",
      perServing: 0.05,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2lb bag",
      costPerPackage: [6, 10],
      category: "dairy",
    },
    {
      name: "Broccoli (optional topping)",
      perServing: 0.05,
      unit: "lb",
      packageSize: 2,
      packageUnit: "lb bag",
      costPerPackage: [2, 4],
      category: "produce",
    },
  ],
  supplies: [
    { name: "Aluminum Foil (heavy duty)", perPerson: 1, packageSize: 75, costPerPackage: [8, 14] },
    { name: "Sturdy Paper Plates", perPerson: 1, packageSize: 100, costPerPackage: [6, 10] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Plastic Knives", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Napkins", perPerson: 3, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Serving Spoons", perPerson: 0.01, packageSize: 1, costPerPackage: [5, 10] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
  ],
  prepNotes: "Wash and pierce potatoes 2–3 hours before oven time. Wrap in foil.",
  cookNote: "Bake at 400°F for 60–75 min. Pre-bake at home then hold in warming ovens or coolers.",
};

// ============================================================
// BREAKFAST BURRITOS
// ============================================================
export const breakfastBurritoAssumptions: MealAssumption = {
  label: "breakfastBurritos",
  displayName: "Breakfast Burritos",
  adultServings: 2,
  kidServings: 1.5,
  wasteBuffer: 1.1,
  ingredients: [
    {
      name: "Large Flour Tortillas",
      perServing: 1,
      unit: "tortilla",
      packageSize: 20,
      packageUnit: "pack",
      costPerPackage: [4, 7],
      category: "carb",
    },
    {
      name: "Eggs",
      perServing: 2,
      unit: "egg",
      packageSize: 18,
      packageUnit: "dozen+ flat",
      costPerPackage: [3.5, 7],
      category: "protein",
    },
    {
      name: "Breakfast Sausage (bulk)",
      perServing: 0.1,
      unit: "lb",
      packageSize: 2,
      packageUnit: "lb pack",
      costPerPackage: [5, 9],
      category: "protein",
    },
    {
      name: "Shredded Cheddar Cheese",
      perServing: 0.05,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2lb bag",
      costPerPackage: [6, 10],
      category: "dairy",
    },
    {
      name: "Salsa",
      perServing: 0.04,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24oz jar",
      costPerPackage: [3, 5],
      category: "condiment",
    },
    {
      name: "Salt & Pepper",
      perServing: 0.01,
      unit: "set",
      packageSize: 1,
      packageUnit: "shakers",
      costPerPackage: [2, 4],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Aluminum Foil (for wrapping)", perPerson: 2, packageSize: 75, costPerPackage: [8, 14] },
    { name: "Large Griddle or Skillet", perPerson: 0, packageSize: 1, costPerPackage: [0, 0] },
    { name: "Napkins", perPerson: 3, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Paper Plates", perPerson: 1, packageSize: 100, costPerPackage: [4, 8] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
  ],
  prepNotes: "Pre-cook sausage in bulk. Scramble eggs in large batches. Assembly line for wrapping.",
  cookNote: "Large flat griddles or electric roasters work best for eggs. Keep warm in foil.",
};

// ============================================================
// TACOS
// ============================================================
export const tacoAssumptions: MealAssumption = {
  label: "tacos",
  displayName: "Tacos",
  adultServings: 3,
  kidServings: 2,
  wasteBuffer: 1.1,
  ingredients: [
    {
      name: "Ground Beef or Chicken",
      perServing: 0.12,
      unit: "lb",
      packageSize: 5,
      packageUnit: "lb pack",
      costPerPackage: [12, 22],
      category: "protein",
    },
    {
      name: "Taco Shells / Tortillas",
      perServing: 1,
      unit: "shell",
      packageSize: 24,
      packageUnit: "pack",
      costPerPackage: [3.5, 6],
      category: "carb",
    },
    {
      name: "Taco Seasoning",
      perServing: 0.03,
      unit: "packet",
      packageSize: 1,
      packageUnit: "packet (1oz per 1lb meat)",
      costPerPackage: [1, 2],
      category: "condiment",
    },
    {
      name: "Shredded Lettuce",
      perServing: 0.03,
      unit: "bag",
      packageSize: 1,
      packageUnit: "16oz bag",
      costPerPackage: [2, 4],
      category: "produce",
    },
    {
      name: "Diced Tomatoes",
      perServing: 0.04,
      unit: "lb",
      packageSize: 5,
      packageUnit: "lb box",
      costPerPackage: [4, 8],
      category: "produce",
    },
    {
      name: "Shredded Cheese (Mexican blend)",
      perServing: 0.04,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2lb bag",
      costPerPackage: [6, 10],
      category: "dairy",
    },
    {
      name: "Sour Cream",
      perServing: 0.03,
      unit: "container",
      packageSize: 1,
      packageUnit: "16oz container",
      costPerPackage: [2.5, 4.5],
      category: "dairy",
    },
    {
      name: "Salsa",
      perServing: 0.04,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24oz jar",
      costPerPackage: [3, 5],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Paper Plates", perPerson: 1, packageSize: 100, costPerPackage: [4, 8] },
    { name: "Napkins", perPerson: 4, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Serving Spoons", perPerson: 0.01, packageSize: 6, costPerPackage: [6, 12] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
    { name: "Aluminum Foil Pans (for keeping meat warm)", perPerson: 0.01, packageSize: 5, costPerPackage: [5, 10] },
  ],
  prepNotes: "Set up a taco bar with stations for meat, toppings, and sauces.",
  cookNote: "Brown meat in large batches. Keep warm in chafing dishes or electric roasters.",
};

// ============================================================
// SPAGHETTI
// ============================================================
export const spaghettiAssumptions: MealAssumption = {
  label: "spaghetti",
  displayName: "Spaghetti",
  adultServings: 1,
  kidServings: 0.75,
  wasteBuffer: 1.1,
  ingredients: [
    {
      name: "Spaghetti (dry pasta)",
      perServing: 0.25,
      unit: "lb",
      packageSize: 5,
      packageUnit: "lb box",
      costPerPackage: [4, 8],
      category: "carb",
    },
    {
      name: "Ground Beef or Italian Sausage",
      perServing: 0.15,
      unit: "lb",
      packageSize: 5,
      packageUnit: "lb pack",
      costPerPackage: [12, 22],
      category: "protein",
    },
    {
      name: "Jarred Pasta Sauce",
      perServing: 0.15,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24oz jar",
      costPerPackage: [2.5, 5],
      category: "other",
    },
    {
      name: "Garlic Bread Loaves",
      perServing: 1,
      unit: "slice",
      packageSize: 16,
      packageUnit: "loaf (16 slices)",
      costPerPackage: [3, 6],
      category: "carb",
    },
    {
      name: "Parmesan Cheese (shredded)",
      perServing: 0.03,
      unit: "bag",
      packageSize: 1,
      packageUnit: "8oz bag",
      costPerPackage: [3, 6],
      category: "dairy",
    },
  ],
  supplies: [
    { name: "Foam or Paper Bowls", perPerson: 1, packageSize: 50, costPerPackage: [5, 9] },
    { name: "Paper Plates (for garlic bread)", perPerson: 1, packageSize: 100, costPerPackage: [4, 8] },
    { name: "Plastic Forks", perPerson: 2, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Napkins", perPerson: 4, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Serving Spoons / Tongs", perPerson: 0.01, packageSize: 6, costPerPackage: [6, 12] },
    { name: "Chafing Dishes or Electric Roasters", perPerson: 0.005, packageSize: 1, costPerPackage: [25, 60] },
    { name: "Sterno Fuel Cans", perPerson: 0.005, packageSize: 3, costPerPackage: [8, 14] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
  ],
  prepNotes: "Cook pasta in large stockpots. Sauce can be made a day ahead and reheated.",
  cookNote: "Plan 1 large stockpot per 50 servings. Keep sauce in roasters or chafing dishes.",
};

// ============================================================
// PANCAKES
// ============================================================
export const pancakeAssumptions: MealAssumption = {
  label: "pancakes",
  displayName: "Pancakes",
  adultServings: 4,
  kidServings: 3,
  wasteBuffer: 1.15,
  ingredients: [
    {
      name: "Pancake Mix (complete)",
      perServing: 0.125,
      unit: "lb",
      packageSize: 5,
      packageUnit: "lb box",
      costPerPackage: [5, 9],
      category: "carb",
    },
    {
      name: "Eggs",
      perServing: 0.2,
      unit: "egg",
      packageSize: 18,
      packageUnit: "flat",
      costPerPackage: [3.5, 7],
      category: "protein",
    },
    {
      name: "Milk or Water",
      perServing: 0.1,
      unit: "gallon",
      packageSize: 1,
      packageUnit: "gallon",
      costPerPackage: [3, 5.5],
      category: "dairy",
    },
    {
      name: "Butter / Cooking Spray",
      perServing: 0.02,
      unit: "can",
      packageSize: 1,
      packageUnit: "can",
      costPerPackage: [3, 5],
      category: "dairy",
    },
    {
      name: "Maple Syrup",
      perServing: 0.05,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32oz bottle",
      costPerPackage: [4, 9],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Paper Plates", perPerson: 1, packageSize: 100, costPerPackage: [4, 8] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Napkins", perPerson: 3, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Electric Griddles (large)", perPerson: 0.005, packageSize: 1, costPerPackage: [30, 70] },
    { name: "Spatulas", perPerson: 0.01, packageSize: 1, costPerPackage: [5, 10] },
    { name: "Ladles / Portion Scoops", perPerson: 0.01, packageSize: 1, costPerPackage: [5, 10] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
  ],
  prepNotes: "Mix batter in large batches. Keep batter cold until use.",
  cookNote: "Electric griddles give consistent heat. One large griddle can produce ~100 pancakes/hour.",
};

// ============================================================
// CUSTOM (placeholder, user-defined)
// ============================================================
export const customAssumptions: MealAssumption = {
  label: "custom",
  displayName: "Custom Meal",
  adultServings: 1,
  kidServings: 0.75,
  wasteBuffer: 1.1,
  ingredients: [],
  supplies: [
    { name: "Paper Plates", perPerson: 1, packageSize: 100, costPerPackage: [4, 8] },
    { name: "Plastic Utensils", perPerson: 1, packageSize: 100, costPerPackage: [3, 5] },
    { name: "Napkins", perPerson: 3, packageSize: 200, costPerPackage: [3, 5] },
    { name: "Trash Bags", perPerson: 0.02, packageSize: 30, costPerPackage: [8, 15] },
  ],
  prepNotes: "Plan your custom prep schedule manually.",
  cookNote: "Adjust quantities based on your custom recipe.",
};

// ============================================================
// Map meal type keys to their assumption objects
// ============================================================
import type { MealType } from "./types";

export const MEAL_ASSUMPTIONS: Record<MealType, MealAssumption> = {
  hotdogs: hotDogAssumptions,
  burgers: burgerAssumptions,
  bakedPotatoes: bakedPotatoAssumptions,
  breakfastBurritos: breakfastBurritoAssumptions,
  tacos: tacoAssumptions,
  spaghetti: spaghettiAssumptions,
  pancakes: pancakeAssumptions,
  custom: customAssumptions,
};
