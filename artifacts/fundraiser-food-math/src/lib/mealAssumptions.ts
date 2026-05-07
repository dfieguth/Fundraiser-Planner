// ============================================================
// MEAL ASSUMPTIONS
// Edit these objects to update default quantities, costs,
// ingredients, and serving sizes for each meal type.
// ============================================================

export interface MealAssumption {
  label: string;
  displayName: string;
  adultServings: number;
  kidServings: number;
  wasteBuffer: number;
  cookingComplexity: "low" | "medium" | "high";
  ingredients: IngredientDef[];
  supplies: SupplyDef[];
  prepNotes: string;
  cookNote: string;
}

export interface IngredientDef {
  name: string;
  perServing: number;
  unit: string;
  packageSize: number;
  packageUnit: string;
  costPerPackage: [number, number];
  category: "protein" | "carb" | "dairy" | "produce" | "condiment" | "other";
  // Usage rate: fraction of guests who actually use this item (default 1.0 = everyone)
  // Apply to toppings, condiments, and optional items only.
  usageRate?: number;
  // If true, this item cannot be unchecked on the Customize Your Menu page.
  required?: boolean;
  // If true, this is a batch cooking ingredient (oil, salt, spray), not a per-guest serving.
  cookingOnly?: boolean;
}

export interface SupplyDef {
  name: string;
  perPerson: number;
  packageSize: number;
  costPerPackage: [number, number];
  required?: boolean;
}

// ============================================================
// HOT DOGS
// ============================================================
export const hotDogAssumptions: MealAssumption = {
  label: "hotdogs",
  displayName: "Hot Dogs",
  adultServings: 2.5,
  kidServings: 1.5,
  wasteBuffer: 1.12,
  cookingComplexity: "low",
  ingredients: [
    {
      name: "Hot Dogs (all-beef, 10-pack)",
      perServing: 1,
      unit: "hot dog",
      packageSize: 10,
      packageUnit: "10-pack",
      costPerPackage: [4.50, 9.00],
      category: "protein",
      required: true,
    },
    {
      name: "Hot Dog Buns (8-pack)",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "8-pack",
      costPerPackage: [3.00, 5.50],
      category: "carb",
      required: true,
    },
    {
      name: "Ketchup (32 oz squeeze bottle)",
      perServing: 0.016,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [3.50, 6.00],
      category: "condiment",
      usageRate: 0.60,
    },
    {
      name: "Mustard (20 oz squeeze bottle)",
      perServing: 0.015,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "20 oz bottle",
      costPerPackage: [2.00, 4.00],
      category: "condiment",
      usageRate: 0.45,
    },
    {
      name: "Relish (10 oz jar)",
      perServing: 0.015,
      unit: "jar",
      packageSize: 1,
      packageUnit: "10 oz jar",
      costPerPackage: [2.50, 4.00],
      category: "condiment",
      usageRate: 0.25,
    },
    {
      name: "Diced White Onion (optional topping)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
      usageRate: 0.25,
    },
    {
      name: "Canned Chili (optional topping for chili dogs)",
      perServing: 0.04,
      unit: "can",
      packageSize: 1,
      packageUnit: "15 oz can",
      costPerPackage: [1.50, 3.00],
      category: "other",
      usageRate: 0.20,
    },
    {
      name: "Potato Chips (2-lb bulk bag — side option)",
      perServing: 0.04,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2-lb bag",
      costPerPackage: [5.00, 9.00],
      category: "other",
      usageRate: 0.70,
    },
  ],
  supplies: [
    { name: "Paper Plates (9\")", perPerson: 1.2, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks & Knives", perPerson: 1, packageSize: 100, costPerPackage: [4.00, 7.00] },
    { name: "Grill Tongs", perPerson: 0.01, packageSize: 1, costPerPackage: [7.00, 14.00] },
    { name: "Aluminum Foil Pans (for holding cooked dogs)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.03, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Pre-slit hot dogs before grilling to prevent bursting. Set up a topping bar with ketchup, mustard, relish, and onion. Place buns in foil pans and warm on a low area of the grill.",
  cookNote: "Budget 80–100 hot dogs per hour on a full-size grill. Keep cooked dogs in covered foil pans to hold heat. Rotate older dogs to the front of the pan.",
};

// ============================================================
// BURGERS
// ============================================================
export const burgerAssumptions: MealAssumption = {
  label: "burgers",
  displayName: "Burgers",
  adultServings: 1.5,
  kidServings: 1.0,
  wasteBuffer: 1.12,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Ground Beef Patties (1/3 lb each, frozen or fresh)",
      perServing: 1,
      unit: "patty",
      packageSize: 6,
      packageUnit: "6-pack (~2 lb)",
      costPerPackage: [9.00, 16.00],
      category: "protein",
      required: true,
    },
    {
      name: "Hamburger Buns (8-pack)",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "8-pack",
      costPerPackage: [3.50, 5.50],
      category: "carb",
      required: true,
    },
    {
      name: "American Cheese Slices (24-pack)",
      perServing: 1,
      unit: "slice",
      packageSize: 24,
      packageUnit: "24-slice pack",
      costPerPackage: [5.00, 9.00],
      category: "dairy",
      usageRate: 0.30,
    },
    {
      name: "Shredded Lettuce (pre-bagged)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [3.50, 6.00],
      category: "produce",
      usageRate: 0.60,
    },
    {
      name: "Roma Tomatoes (sliced)",
      perServing: 0.08,
      unit: "tomato",
      packageSize: 5,
      packageUnit: "5-lb box",
      costPerPackage: [5.00, 9.00],
      category: "produce",
      usageRate: 0.55,
    },
    {
      name: "White Onion (sliced rings for burgers)",
      perServing: 0.05,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
      usageRate: 0.25,
    },
    {
      name: "Dill Pickle Slices (gallon jar)",
      perServing: 0.012,
      unit: "jar",
      packageSize: 1,
      packageUnit: "gallon jar",
      costPerPackage: [6.00, 11.00],
      category: "condiment",
      usageRate: 0.30,
    },
    {
      name: "Ketchup (32 oz squeeze bottle)",
      perServing: 0.016,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [3.50, 6.00],
      category: "condiment",
      usageRate: 0.60,
    },
    {
      name: "Mustard (20 oz squeeze bottle)",
      perServing: 0.012,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "20 oz bottle",
      costPerPackage: [2.00, 4.00],
      category: "condiment",
      usageRate: 0.45,
    },
    {
      name: "Mayonnaise (30 oz jar)",
      perServing: 0.015,
      unit: "jar",
      packageSize: 1,
      packageUnit: "30 oz jar",
      costPerPackage: [5.00, 8.50],
      category: "condiment",
      usageRate: 0.30,
    },
  ],
  supplies: [
    { name: "Sturdy Paper Plates (10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [7.00, 13.00] },
    { name: "Napkins", perPerson: 6, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks & Knives", perPerson: 1, packageSize: 100, costPerPackage: [4.00, 7.00] },
    { name: "Grill Spatulas", perPerson: 0.01, packageSize: 1, costPerPackage: [9.00, 18.00] },
    { name: "Aluminum Foil Pans (for holding cooked burgers)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Heavy-Duty Aluminum Foil Roll", perPerson: 0.12, packageSize: 1, costPerPackage: [6.00, 12.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.03, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Form and season patties ahead of time using a burger press for consistency (1/3 lb each). Chill patties until 30 min before grill time. Set up a dedicated assembly station with cheese, toppings, and buns.",
  cookNote: "Budget 60–80 burgers per hour on a full-size grill. Season patties with salt and pepper before grilling. Grill to 160°F internal temp. Keep finished burgers in covered foil pans to hold heat.",
};

// ============================================================
// BAKED POTATOES
// FIX 3: Olive oil and kosher salt are COOKING ingredients —
// calculated by batch, not per-guest. Fixed perServing values.
// FIX 2: Topping usage rates applied — not everyone uses every topping.
// ============================================================
export const bakedPotatoAssumptions: MealAssumption = {
  label: "bakedPotatoes",
  displayName: "Baked Potatoes",
  adultServings: 1.3,
  kidServings: 1.0,
  wasteBuffer: 1.12,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Russet Potatoes (large)",
      perServing: 1,
      unit: "potato",
      packageSize: 10,
      packageUnit: "10-lb bag (~10 large potatoes)",
      costPerPackage: [7.00, 12.00],
      category: "carb",
      required: true,
    },
    {
      // FIX 3: Cooking ingredient — 1 tbsp per 10 potatoes.
      // 1 standard 32 oz bottle (≈64 tbsp) easily covers 500+ potatoes.
      // perServing = 0.1 tbsp / 64 tbsp per bottle ≈ 0.0016 per potato
      name: "Olive Oil (for rubbing potato skins — cooking only)",
      perServing: 0.0016,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [8.00, 15.00],
      category: "other",
      cookingOnly: true,
    },
    {
      // FIX 3: Cooking ingredient — 1 tsp per 10 potatoes.
      // One 3-lb container (~680 tsp) easily covers any event under 1,000 guests.
      // perServing = 0.1 tsp / 680 tsp per container ≈ 0.0001 per potato
      name: "Kosher Salt (for potato skins — cooking only)",
      perServing: 0.0001,
      unit: "container",
      packageSize: 1,
      packageUnit: "3-lb container",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
      cookingOnly: true,
    },
    {
      name: "Butter (1-lb blocks)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb block (4 sticks)",
      costPerPackage: [4.50, 8.00],
      category: "dairy",
      usageRate: 0.70,
    },
    {
      // 0.11 lb per serving × 0.65 usage × ~224 servings (200 guests) ≈ 16 lb → 4 × 5-lb tubs
      name: "Sour Cream",
      perServing: 0.11,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb tub",
      costPerPackage: [5.99, 5.99],
      category: "dairy",
      usageRate: 0.80,
    },
    {
      // 0.08 lb per serving × 0.70 usage × ~224 servings (200 guests) ≈ 12.5 lb → 3 × 5-lb bags
      name: "Shredded Cheddar Cheese",
      perServing: 0.08,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb bag",
      costPerPackage: [10.99, 10.99],
      category: "dairy",
      usageRate: 0.60,
    },
    {
      name: "Real Bacon Bits (12 oz bag)",
      perServing: 0.025,
      unit: "oz",
      packageSize: 12,
      packageUnit: "12 oz bag",
      costPerPackage: [6.00, 11.00],
      category: "protein",
      usageRate: 0.45,
    },
    {
      name: "Chives or Green Onions (bunches)",
      perServing: 0.02,
      unit: "bunch",
      packageSize: 1,
      packageUnit: "bunch",
      costPerPackage: [1.25, 3.00],
      category: "produce",
      usageRate: 0.30,
    },
    {
      name: "Broccoli Florets — optional healthy topping (2-lb bag)",
      perServing: 0.03,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [4.00, 7.50],
      category: "produce",
      usageRate: 0.15,
    },
  ],
  supplies: [
    { name: "Heavy-Duty Aluminum Foil Roll (for baking)", perPerson: 1.5, packageSize: 75, costPerPackage: [10.00, 18.00], required: true },
    { name: "Aluminum Foil Pans (for holding finished potatoes)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Sturdy Paper Plates (10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [7.00, 13.00] },
    { name: "Plastic Forks & Knives", perPerson: 1, packageSize: 100, costPerPackage: [4.00, 7.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Serving Spoons (for topping bar)", perPerson: 0.01, packageSize: 1, costPerPackage: [6.00, 12.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Wash and pierce potatoes the night before. Rub each potato with olive oil and kosher salt, then wrap in foil. Bake in batches at 400°F for 60–75 minutes. Set up a self-serve topping bar: butter, sour cream, cheese, bacon bits, chives, and broccoli (optional).",
  cookNote: "Pre-baked potatoes hold well in towel-lined coolers or low-heat ovens for 2–3 hours. Keep the topping bar stocked — toppings run out faster than potatoes.",
};

// ============================================================
// BREAKFAST BURRITOS
// ============================================================
export const breakfastBurritoAssumptions: MealAssumption = {
  label: "breakfastBurritos",
  displayName: "Breakfast Burritos",
  adultServings: 2,
  kidServings: 1.5,
  wasteBuffer: 1.12,
  cookingComplexity: "high",
  ingredients: [
    {
      name: "Large Flour Tortillas (10-inch, 20-pack)",
      perServing: 1,
      unit: "tortilla",
      packageSize: 20,
      packageUnit: "20-pack",
      costPerPackage: [5.00, 9.00],
      category: "carb",
      required: true,
    },
    {
      name: "Eggs (large, by the flat — 30-count)",
      perServing: 2,
      unit: "egg",
      packageSize: 30,
      packageUnit: "30-egg flat",
      costPerPackage: [9.00, 18.00],
      category: "protein",
      required: true,
    },
    {
      name: "Breakfast Sausage (bulk, 2-lb pack)",
      perServing: 0.1,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb pack",
      costPerPackage: [7.00, 13.00],
      category: "protein",
      required: true,
    },
    {
      name: "Frozen Diced Hash Brown Potatoes (5-lb bag)",
      perServing: 0.08,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb bag",
      costPerPackage: [6.00, 11.00],
      category: "carb",
    },
    {
      name: "Diced Bell Peppers (fresh or frozen — for eggs)",
      perServing: 0.03,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag or 3-pack",
      costPerPackage: [3.50, 7.00],
      category: "produce",
      usageRate: 0.70,
    },
    {
      name: "Shredded Mexican Blend Cheese (2-lb bag)",
      perServing: 0.06,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
      usageRate: 0.80,
    },
    {
      name: "Salsa (24 oz jar)",
      perServing: 0.03,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.50, 6.50],
      category: "condiment",
      usageRate: 0.70,
    },
    {
      name: "Hot Sauce (tabletop bottle — 12 oz)",
      perServing: 0.01,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "12 oz bottle",
      costPerPackage: [2.50, 5.00],
      category: "condiment",
      usageRate: 0.45,
    },
    {
      // Cooking only — used on griddle, not per burrito
      name: "Cooking Oil / Spray (for griddle)",
      perServing: 0.003,
      unit: "can",
      packageSize: 1,
      packageUnit: "cooking spray can",
      costPerPackage: [3.50, 6.00],
      category: "other",
      cookingOnly: true,
    },
    {
      name: "Salt & Pepper Shakers (for eggs and hash browns)",
      perServing: 0.002,
      unit: "set",
      packageSize: 1,
      packageUnit: "shaker set",
      costPerPackage: [3.00, 5.00],
      category: "condiment",
      cookingOnly: true,
    },
  ],
  supplies: [
    { name: "Aluminum Foil (for wrapping each burrito)", perPerson: 2.5, packageSize: 75, costPerPackage: [10.00, 18.00] },
    { name: "Paper Plates", perPerson: 1.2, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.03, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Aluminum Foil Pans with Lids (for holding finished eggs)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 13.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Pre-cook sausage and hash browns the morning of. Set up a two-person assembly line: tortilla → scrambled eggs → sausage → hash browns → bell peppers → cheese → fold and wrap in foil.",
  cookNote: "Electric griddles or large commercial flat-tops work best for eggs. Scramble in batches of 12–18 eggs at a time. Budget 60–80 burritos per hour with a 2-person assembly line.",
};

// ============================================================
// TACOS
// ============================================================
export const tacoAssumptions: MealAssumption = {
  label: "tacos",
  displayName: "Tacos",
  adultServings: 3,
  kidServings: 2,
  wasteBuffer: 1.12,
  cookingComplexity: "low",
  ingredients: [
    {
      name: "Ground Beef 80/20 (or ground turkey)",
      perServing: 0.14,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
      required: true,
    },
    {
      name: "Taco Shells (hard, 24-count box)",
      perServing: 1,
      unit: "shell",
      packageSize: 24,
      packageUnit: "24-count box",
      costPerPackage: [4.50, 8.00],
      category: "carb",
      required: true,
    },
    {
      name: "Flour Tortillas — soft taco option (20-pack)",
      perServing: 0.5,
      unit: "tortilla",
      packageSize: 20,
      packageUnit: "20-pack",
      costPerPackage: [4.50, 8.00],
      category: "carb",
    },
    {
      name: "Taco Seasoning (1-oz packet per 1 lb of meat)",
      perServing: 0.14,
      unit: "packet",
      packageSize: 1,
      packageUnit: "1-oz packet",
      costPerPackage: [0.85, 2.00],
      category: "condiment",
      cookingOnly: true,
    },
    {
      name: "Shredded Iceberg Lettuce (pre-shredded bag — 16 oz)",
      perServing: 0.025,
      unit: "bag",
      packageSize: 1,
      packageUnit: "16 oz bag",
      costPerPackage: [2.50, 4.50],
      category: "produce",
      usageRate: 0.65,
    },
    {
      name: "Roma Tomatoes (diced)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb box",
      costPerPackage: [5.00, 9.00],
      category: "produce",
      usageRate: 0.60,
    },
    {
      name: "White Onion (diced fine)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
      usageRate: 0.50,
    },
    {
      name: "Fresh Cilantro (bunches — optional)",
      perServing: 0.01,
      unit: "bunch",
      packageSize: 1,
      packageUnit: "bunch",
      costPerPackage: [1.25, 2.75],
      category: "produce",
      usageRate: 0.40,
    },
    {
      name: "Lime Wedges (for garnish)",
      perServing: 0.1,
      unit: "lime",
      packageSize: 6,
      packageUnit: "6-pack (or 3-lb bag)",
      costPerPackage: [2.50, 5.00],
      category: "produce",
      usageRate: 0.55,
    },
    {
      name: "Shredded Mexican Blend Cheese (2-lb bag)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
      usageRate: 0.70,
    },
    {
      name: "Sour Cream (16 oz container)",
      perServing: 0.025,
      unit: "container",
      packageSize: 1,
      packageUnit: "16 oz container",
      costPerPackage: [3.50, 5.50],
      category: "dairy",
      usageRate: 0.65,
    },
    {
      name: "Salsa (24 oz jar)",
      perServing: 0.03,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.50, 6.50],
      category: "condiment",
      usageRate: 0.70,
    },
    {
      name: "Hot Sauce (tabletop bottle — 12 oz)",
      perServing: 0.01,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "12 oz bottle",
      costPerPackage: [2.50, 5.00],
      category: "condiment",
      usageRate: 0.45,
    },
  ],
  supplies: [
    { name: "Paper Plates (9\" or 10\")", perPerson: 1.5, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 7, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Serving Spoons (for taco bar toppings)", perPerson: 0.01, packageSize: 6, costPerPackage: [7.00, 13.00] },
    { name: "Aluminum Foil Pans (for holding seasoned meat)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Brown meat in large batches (5 lbs at a time). Season each batch per packet directions. Set up a self-serve taco bar: meat → shells/tortillas → cheese → lettuce → tomato → onion → cilantro → sour cream → salsa → lime wedges.",
  cookNote: "One large skillet or roaster handles 5 lbs of meat at a time. Keep meat warm in covered foil pans or an electric roaster at 170°F.",
};

// ============================================================
// SPAGHETTI
// FIX 3: Olive oil and kosher salt are cooking ingredients — fixed perServing values.
// ============================================================
export const spaghettiAssumptions: MealAssumption = {
  label: "spaghetti",
  displayName: "Spaghetti Dinner",
  adultServings: 1.2,
  kidServings: 0.75,
  wasteBuffer: 1.12,
  cookingComplexity: "high",
  ingredients: [
    {
      name: "Dry Spaghetti (1-lb boxes)",
      perServing: 0.22,
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb box",
      costPerPackage: [1.25, 2.75],
      category: "carb",
      required: true,
    },
    {
      name: "Ground Beef 80/20 or Italian Sausage (for sauce)",
      perServing: 0.2,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
      required: true,
    },
    {
      name: "Jarred Pasta Sauce (24 oz jar)",
      perServing: 0.2,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.00, 6.50],
      category: "other",
      required: true,
    },
    {
      name: "Frozen Garlic Bread Loaves (each loaf serves ~8)",
      perServing: 0.125,
      unit: "loaf",
      packageSize: 1,
      packageUnit: "frozen loaf (serves ~8)",
      costPerPackage: [3.50, 6.50],
      category: "carb",
      usageRate: 0.80,
    },
    {
      name: "Bagged Salad Mix (12 oz bag — optional side)",
      perServing: 0.05,
      unit: "bag",
      packageSize: 1,
      packageUnit: "12 oz bag",
      costPerPackage: [3.50, 6.00],
      category: "produce",
      usageRate: 0.65,
    },
    {
      name: "Italian Salad Dressing (16 oz bottle)",
      perServing: 0.04,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "16 oz bottle",
      costPerPackage: [2.50, 5.00],
      category: "condiment",
      usageRate: 0.65,
    },
    {
      name: "Parmesan Cheese (shredded, 8 oz bag)",
      perServing: 0.025,
      unit: "bag",
      packageSize: 1,
      packageUnit: "8 oz bag",
      costPerPackage: [4.00, 7.50],
      category: "dairy",
      usageRate: 0.75,
    },
    {
      name: "Diced White Onion (for sauce base)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
      cookingOnly: true,
    },
    {
      name: "Minced Garlic (jar — 32 oz)",
      perServing: 0.008,
      unit: "jar",
      packageSize: 1,
      packageUnit: "32 oz jar",
      costPerPackage: [5.00, 9.00],
      category: "condiment",
      cookingOnly: true,
    },
    {
      // FIX 3: Cooking ingredient. ~2 tbsp per pot (1 lb pasta per pot).
      // One 48 oz bottle ≈ 96 tbsp; covers ~48 pots of pasta.
      // perServing = 0.003 → for 270 servings → 0.81 bottles → 1 bottle. Correct.
      name: "Olive Oil (for pasta and sauce)",
      perServing: 0.003,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "48 oz bottle",
      costPerPackage: [9.00, 18.00],
      category: "other",
      cookingOnly: true,
    },
    {
      // FIX 3: Cooking ingredient. ~1 tbsp per pot of pasta water.
      // 3-lb container (~200 tbsp) is plenty for any event under 500 guests.
      // perServing = 0.001 → 270 * 0.001 = 0.27 → 1 container. Correct.
      name: "Kosher Salt (for pasta water — large container)",
      perServing: 0.001,
      unit: "container",
      packageSize: 1,
      packageUnit: "3-lb container",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
      cookingOnly: true,
    },
  ],
  supplies: [
    { name: "Foam or Paper Bowls (12 oz) for pasta", perPerson: 1.2, packageSize: 50, costPerPackage: [6.00, 11.00] },
    { name: "Paper Plates (for garlic bread & salad)", perPerson: 1, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Plastic Forks (2 per guest: pasta + salad)", perPerson: 2, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Napkins", perPerson: 6, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Serving Tongs / Pasta Forks", perPerson: 0.01, packageSize: 6, costPerPackage: [7.00, 14.00] },
    { name: "Large Ladles (for sauce)", perPerson: 0.01, packageSize: 6, costPerPackage: [7.00, 14.00] },
    { name: "Electric Roasters or Chafing Dishes (for pasta & sauce)", perPerson: 0.005, packageSize: 1, costPerPackage: [35.00, 80.00] },
    { name: "Sterno Fuel Cans (if using chafing dishes — 3-pack)", perPerson: 0.005, packageSize: 3, costPerPackage: [9.00, 16.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Sauce can be made 1–2 days ahead and refrigerated — flavor improves overnight. Cook pasta in large stockpots in batches (1 lb pasta per pot of salted boiling water). Toss drained pasta with a splash of olive oil to prevent sticking.",
  cookNote: "Plan 1 large stockpot per 50 servings of pasta. Stagger cooking in 15-minute intervals to keep fresh pasta flowing. Sauce goes in a separate roaster — designate one person solely to sauce temperature and stirring.",
};

// ============================================================
// PANCAKES
// ============================================================
export const pancakeAssumptions: MealAssumption = {
  label: "pancakes",
  displayName: "Pancake Breakfast",
  adultServings: 4,
  kidServings: 3,
  wasteBuffer: 1.15,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Complete Pancake Mix (5-lb box)",
      perServing: 0.1,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb box (~50 pancakes)",
      costPerPackage: [6.50, 11.00],
      category: "carb",
      required: true,
    },
    {
      name: "Eggs (large, by the flat — 30-count)",
      perServing: 0.15,
      unit: "egg",
      packageSize: 30,
      packageUnit: "30-egg flat",
      costPerPackage: [9.00, 18.00],
      category: "protein",
    },
    {
      name: "Milk (gallon — for batter)",
      perServing: 0.08,
      unit: "gallon",
      packageSize: 1,
      packageUnit: "gallon",
      costPerPackage: [4.00, 7.50],
      category: "dairy",
    },
    {
      name: "Breakfast Sausage Links (2-lb pack — side dish)",
      perServing: 0.06,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb pack",
      costPerPackage: [7.00, 13.00],
      category: "protein",
    },
    {
      // FIX 3: Cooking ingredient — used on griddle, not per pancake
      name: "Butter / Cooking Spray (for griddle)",
      perServing: 0.004,
      unit: "can",
      packageSize: 1,
      packageUnit: "cooking spray can",
      costPerPackage: [3.50, 6.00],
      category: "dairy",
      cookingOnly: true,
    },
    {
      name: "Maple Syrup (32 oz bottle)",
      perServing: 0.035,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [6.00, 12.00],
      category: "condiment",
      usageRate: 0.90,
    },
    {
      name: "Powdered Sugar (for dusting — 2-lb bag, optional)",
      perServing: 0.008,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2-lb bag",
      costPerPackage: [2.50, 4.50],
      category: "condiment",
      usageRate: 0.40,
    },
    {
      name: "Whipped Topping (optional — 8 oz container)",
      perServing: 0.025,
      unit: "container",
      packageSize: 1,
      packageUnit: "8 oz container",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
      usageRate: 0.50,
    },
    {
      name: "Orange Juice (half-gallon — optional breakfast drink)",
      perServing: 0.04,
      unit: "carton",
      packageSize: 1,
      packageUnit: "half-gallon carton",
      costPerPackage: [4.50, 8.00],
      category: "other",
      usageRate: 0.65,
    },
  ],
  supplies: [
    { name: "Paper Plates (10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Cups (for juice — 9 oz, 100-count)", perPerson: 1.2, packageSize: 100, costPerPackage: [4.00, 8.00] },
    { name: "Electric Griddles (large, 22\"+)", perPerson: 0.006, packageSize: 1, costPerPackage: [40.00, 90.00] },
    { name: "Heat-Safe Plastic Spatulas", perPerson: 0.015, packageSize: 1, costPerPackage: [6.00, 12.00] },
    { name: "Ladles / 1/4-Cup Portion Scoops (for batter)", perPerson: 0.01, packageSize: 1, costPerPackage: [7.00, 14.00] },
    { name: "Large Mixing Bowls (for batter)", perPerson: 0.005, packageSize: 1, costPerPackage: [9.00, 20.00] },
    { name: "Aluminum Foil Pans (for holding finished pancakes)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Mix batter in large batches 20–30 minutes before service. Keep batter cold in coolers between batches. Designate 1–2 Griddle Operators who stay at the griddles continuously. Pre-cook sausage links and hold warm in foil pans.",
  cookNote: "One large 22\" electric griddle produces ~80–100 pancakes per hour. Use a 1/4-cup ladle for consistent sizing. Flip when bubbles form across the surface and the edges look set.",
};

// ============================================================
// CHIPS (side dish — used in Burgers + Chips combo)
// ============================================================
export const chipsAssumption: MealAssumption = {
  label: "chips" as string,
  displayName: "Chips (side)",
  adultServings: 1,
  kidServings: 1,
  wasteBuffer: 1.10,
  cookingComplexity: "low",
  ingredients: [
    {
      name: "Potato Chips (2-lb bulk bag)",
      perServing: 0.05,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2-lb bag",
      costPerPackage: [5.00, 9.00],
      category: "other",
    },
  ],
  supplies: [],
  prepNotes: "Open bags and portion into serving bowls at the chip station. Set out before doors open.",
  cookNote: "No cooking required. Keep chips sealed until just before service to maintain freshness.",
};

// ============================================================
// CUSTOM (user-defined meal — limited calculation accuracy)
// ============================================================
export const customAssumptions: MealAssumption = {
  label: "custom",
  displayName: "Custom Meal",
  adultServings: 1,
  kidServings: 0.75,
  wasteBuffer: 1.15,
  cookingComplexity: "medium",
  ingredients: [],
  supplies: [
    { name: "Paper Plates (9\" or 10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Plastic Utensils (fork, knife, spoon combo pack)", perPerson: 1, packageSize: 100, costPerPackage: [4.50, 8.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
  ],
  prepNotes: "Plan your custom prep schedule based on your specific recipe and cooking method. Add 20–30 minutes of buffer to any time estimate when using volunteers unfamiliar with the recipe.",
  cookNote: "Quantities and costs for custom meals are rough estimates only. Use this plan for supplies and volunteer structure, and calculate your specific food quantities manually from your recipe.",
};

// ============================================================
// Combo-adjusted assumptions
// People eat less of each item when getting both.
// These are ONLY used in combo contexts — not for solo meals.
// ============================================================

const hotdogsForComboAssumptions: MealAssumption = {
  ...hotDogAssumptions,
  label: "hotdogs_combo",
  displayName: "Hot Dogs (combo portion)",
  // User expects ~1.1 hot dogs per person average in a combo context
  adultServings: 1.2,
  kidServings: 0.9,
};

const bakedPotatoForComboAssumptions: MealAssumption = {
  ...bakedPotatoAssumptions,
  label: "bakedPotatoes_combo",
  displayName: "Baked Potatoes (combo portion)",
  // User specified: 1.05 per adult, 0.6 per child
  adultServings: 1.05,
  kidServings: 0.60,
  supplies: [],  // no duplicate plates/napkins — taken from hotdogs component
};

const burgersForComboAssumptions: MealAssumption = {
  ...burgerAssumptions,
  label: "burgers_combo",
  displayName: "Burgers (combo portion)",
  adultServings: 1.0,
  kidServings: 0.75,
};

const chipsForComboAssumptions: MealAssumption = {
  ...chipsAssumption,
  label: "chips_combo",
  displayName: "Chips (combo portion)",
  adultServings: 1.0,
  kidServings: 1.0,
  supplies: [],
};

// ============================================================
// Combo meal stubs — metadata only; ingredients come from
// constituent assumptions resolved at calculation time.
// ============================================================

const comboHotdogsPotatoesStub: MealAssumption = {
  label: "combo_hotdogs_potatoes",
  displayName: "Hot Dogs + Baked Potatoes",
  adultServings: 1, kidServings: 1, wasteBuffer: 1.12,
  cookingComplexity: "medium",
  ingredients: [], supplies: [],
  prepNotes: hotDogAssumptions.prepNotes + " | " + bakedPotatoAssumptions.prepNotes,
  cookNote: hotDogAssumptions.cookNote + " | " + bakedPotatoAssumptions.cookNote,
};

const comboBurgersChipsStub: MealAssumption = {
  label: "combo_burgers_chips",
  displayName: "Burgers + Chips",
  adultServings: 1, kidServings: 1, wasteBuffer: 1.10,
  cookingComplexity: "medium",
  ingredients: [], supplies: [],
  prepNotes: burgerAssumptions.prepNotes + " | " + chipsAssumption.prepNotes,
  cookNote: burgerAssumptions.cookNote,
};

const comboPancakesSausageStub: MealAssumption = {
  label: "combo_pancakes_sausage",
  displayName: "Pancakes + Sausage",
  adultServings: pancakeAssumptions.adultServings,
  kidServings: pancakeAssumptions.kidServings,
  wasteBuffer: pancakeAssumptions.wasteBuffer,
  cookingComplexity: "medium",
  ingredients: [], supplies: [],
  prepNotes: pancakeAssumptions.prepNotes,
  cookNote: pancakeAssumptions.cookNote,
};

// ============================================================
// Combo component definitions
// Each combo lists its constituent meal assumptions.
// The calculator runs each component independently and merges.
// Uses combo-adjusted serving sizes (not full solo-meal serving sizes).
// ============================================================
export interface ComboComponent {
  displayName: string;
  cookingComplexity: "low" | "medium" | "high";
  components: MealAssumption[];
}

export const COMBO_DEFINITIONS: Record<string, ComboComponent> = {
  combo_hotdogs_potatoes: {
    displayName: "Hot Dogs + Baked Potatoes",
    cookingComplexity: "medium",
    components: [hotdogsForComboAssumptions, bakedPotatoForComboAssumptions],
  },
  combo_burgers_chips: {
    displayName: "Burgers + Chips",
    cookingComplexity: "medium",
    components: [burgersForComboAssumptions, chipsForComboAssumptions],
  },
  combo_pancakes_sausage: {
    displayName: "Pancakes + Sausage",
    cookingComplexity: "medium",
    components: [pancakeAssumptions],
  },
};

export function isComboMeal(mealType: string): boolean {
  return mealType.startsWith("combo_");
}

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
  // Combo stubs — used for metadata/display; ingredient calc uses COMBO_DEFINITIONS
  combo_hotdogs_potatoes: comboHotdogsPotatoesStub,
  combo_burgers_chips: comboBurgersChipsStub,
  combo_pancakes_sausage: comboPancakesSausageStub,
};
