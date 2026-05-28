// ============================================================
// MEAL ASSUMPTIONS
// Edit these objects to update default quantities, costs,
// ingredients, and serving sizes for each meal type.
//
// SERVING SIZE PHILOSOPHY (research-backed, updated):
//   adultServings — portions per adult (includes 10% buffet premium baked in)
//   kidServings   — portions per child (≈60% of adult for protein/starch * 1.1 buffet)
//   wasteBuffer   — 1.05 standard (buffet premium already in servings)
//   usageRate     — conservative fraction of guests who use optional items
//   cookingOnly   — batch ingredient, not per-guest
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
  // Display tier for shopping list grouping. When set, shopping list uses
  // tier-based sections instead of category-based sections.
  tier?: "essential" | "recommended" | "optional";
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
// Serving: 1.5 per adult, 1.0 per child (research-verified fundraiser standard)
// 10% buffet premium baked into adultServings/kidServings.
// ============================================================
export const hotDogAssumptions: MealAssumption = {
  label: "hotdogs",
  displayName: "Hot Dogs",
  adultServings: 1.265, // 1.15 × 1.1 buffet premium
  kidServings: 1.10,    // 1.0 × 1.1 buffet premium
  wasteBuffer: 1.05,
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
      required: true,
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
      required: true,
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
      required: true,
    },
    {
      name: "Diced White Onion (optional topping)",
      perServing: 0.0158,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
      usageRate: 1.0,
      required: false,
    },
    {
      name: "Canned Chili (108 oz can \u2014 optional topping for chili dogs)",
      perServing: 0.04,
      unit: "can",
      packageSize: 1,
      packageUnit: "108 oz can",
      costPerPackage: [1.50, 3.00],
      category: "other",
      usageRate: 0.20,
      required: false,
    },
    {
      // Individual bags preferred for self-serve lines — no sharing issues
      name: "Potato Chips (individual snack bags — side option)",
      perServing: 1,
      unit: "bag",
      packageSize: 40,
      packageUnit: "40-count variety pack",
      costPerPackage: [18.00, 28.00],
      category: "other",
      usageRate: 1.0,
      required: true,
    },
  ],
  supplies: [
    { name: "Paper Plates (9\")", perPerson: 1.1, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks & Knives", perPerson: 1.25, packageSize: 100, costPerPackage: [4.00, 7.00] },
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
// Serving: 1 patty per adult, 0.75 per child (burgers are filling)
// 10% buffet premium baked in. wasteBuffer reduced accordingly.
// ============================================================
export const burgerAssumptions: MealAssumption = {
  label: "burgers",
  displayName: "Burgers",
  adultServings: 1.10,  // 1.0 × 1.1 buffet premium
  kidServings: 0.83,    // 0.75 × 1.1 buffet premium
  wasteBuffer: 1.05,
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
      usageRate: 0.80,
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
      perServing: 0.021,
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
    { name: "Sturdy Paper Plates (10\")", perPerson: 1.1, packageSize: 100, costPerPackage: [7.00, 13.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks & Knives", perPerson: 1.25, packageSize: 100, costPerPackage: [4.00, 7.00] },
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
// Serving: 1 large potato per adult, 0.75 per child
// Never more than 1 potato per person for a standard fundraiser.
// 10% buffet premium baked in. Topping usage rates already conservative.
// Olive oil and kosher salt are COOKING ingredients — batch calculated.
// ============================================================
export const bakedPotatoAssumptions: MealAssumption = {
  label: "bakedPotatoes",
  displayName: "Baked Potatoes",
  adultServings: 1.10,  // 1.0 × 1.1 buffet premium
  kidServings: 0.83,    // 0.75 × 1.1 buffet premium
  wasteBuffer: 1.05,
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
      tier: "essential",
    },
    {
      // Cooking ingredient — 1 tbsp per 10 potatoes.
      // 1 standard 32 oz bottle (≈64 tbsp) easily covers 500+ potatoes.
      // For any event under 500 guests: 1 bottle maximum.
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
      // Cooking ingredient — 1 tsp per 10 potatoes.
      // One 3-lb container (~680 tsp) covers any event under 1,000 guests.
      // Always buy 1 container; you will have significant leftovers.
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
      // 80% usage — core topping; 1 box per 100 guests
      name: "Butter (1-lb block box)",
      perServing: 0.0125,
      unit: "box",
      packageSize: 1,
      packageUnit: "1-lb block box (4 sticks)",
      costPerPackage: [4.50, 8.00],
      category: "dairy",
      usageRate: 0.80,
      tier: "essential",
    },
    {
      // 60% usage — core topping; 1 x 3-lb tub per 100 guests
      name: "Sour Cream (3-lb tub)",
      perServing: 0.0167,
      unit: "tub",
      packageSize: 1,
      packageUnit: "3-lb tub",
      costPerPackage: [5.99, 5.99],
      category: "dairy",
      usageRate: 0.60,
      tier: "essential",
    },
    {
      // 65% usage — core topping; 2.5 lbs per 100 guests, buy in 5-lb bags
      name: "Fiesta Blend Shredded Cheese",
      perServing: 0.0385,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb bag",
      costPerPackage: [10.99, 10.99],
      category: "dairy",
      usageRate: 0.65,
      tier: "essential",
    },
    {
      // 30% usage — fresh garnish; 3 bunches per 100 guests
      name: "Chives or Green Onions (bunches)",
      perServing: 0.10,
      unit: "bunch",
      packageSize: 1,
      packageUnit: "bunch",
      costPerPackage: [1.25, 3.00],
      category: "produce",
      usageRate: 0.30,
      tier: "essential",
    },
    {
      // 50% usage — popular add-on; 2 large cans per 100 guests
      name: "Chili (large can)",
      perServing: 0.04,
      unit: "can",
      packageSize: 1,
      packageUnit: "large can (~30 oz)",
      costPerPackage: [3.50, 6.00],
      category: "protein",
      usageRate: 0.50,
      tier: "recommended",
    },
    {
      // 40% usage — popular add-on; 1 large can per 100 guests
      name: "Nacho Cheese (large can)",
      perServing: 0.025,
      unit: "can",
      packageSize: 1,
      packageUnit: "large can (~30 oz)",
      costPerPackage: [4.00, 7.50],
      category: "dairy",
      usageRate: 0.40,
      tier: "recommended",
    },
    {
      // 30% usage — fresh topping; 2 large onions per 100 guests
      name: "White Onion (large)",
      perServing: 0.067,
      unit: "onion",
      packageSize: 1,
      packageUnit: "large onion",
      costPerPackage: [1.00, 2.00],
      category: "produce",
      usageRate: 0.30,
      tier: "recommended",
    },
  ],
  supplies: [
    { name: "Heavy-Duty Aluminum Foil Roll (for baking)", perPerson: 1.5, packageSize: 75, costPerPackage: [10.00, 18.00], required: true },
    { name: "Aluminum Foil Pans (for holding finished potatoes)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Sturdy Paper Plates (10\")", perPerson: 1.1, packageSize: 100, costPerPackage: [7.00, 13.00] },
    { name: "Plastic Forks & Knives", perPerson: 1.25, packageSize: 100, costPerPackage: [4.00, 7.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Serving Spoons (for topping bar)", perPerson: 0.01, packageSize: 1, costPerPackage: [6.00, 12.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Wash and pierce potatoes the night before. Rub each potato with olive oil and kosher salt, then wrap in foil. Bake in batches at 400°F for 60–75 minutes. Set up a self-serve topping bar: butter, sour cream, fiesta blend cheese, chives, chili, nacho cheese, and white onion.",
  cookNote: "Pre-baked potatoes hold well in towel-lined coolers or low-heat ovens for 2–3 hours. Keep the topping bar stocked — toppings run out faster than potatoes.",
};

// ============================================================
// BREAKFAST BURRITOS
// Serving: 1 burrito per person — burritos are filling.
// 10% buffet premium baked in. Protein: 2 oz cooked sausage per burrito.
// Eggs: 2 per burrito. Potatoes: 3.5 oz per burrito.
// ============================================================
export const breakfastBurritoAssumptions: MealAssumption = {
  label: "breakfastBurritos",
  displayName: "Breakfast Burritos",
  adultServings: 1.10,  // 1 burrito × 1.1 buffet premium
  kidServings: 0.66,    // 0.6 adult × 1.1 buffet premium
  wasteBuffer: 1.05,
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
      perServing: 1.45,
      unit: "egg",
      packageSize: 30,
      packageUnit: "30-egg flat",
      costPerPackage: [9.00, 18.00],
      category: "protein",
      required: true,
    },
    {
      name: "Breakfast Sausage (bulk, 2-lb pack)",
      perServing: 0.109,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb pack",
      costPerPackage: [7.00, 13.00],
      category: "protein",
      required: true,
    },
    {
      name: "O'Brien Potatoes (1-lb bag)",
      perServing: 0.036,
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb bag",
      costPerPackage: [2.50, 4.50],
      category: "carb",
      required: true,
    },
    {
      name: "Fiesta Blend Shredded Cheese",
      perServing: 0.035,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
      usageRate: 0.90,
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
    { name: "Aluminum Foil (for wrapping each burrito)", perPerson: 1.5, packageSize: 75, costPerPackage: [10.00, 18.00] },
    { name: "Paper Plates", perPerson: 1.1, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks", perPerson: 1.25, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.03, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Aluminum Foil Pans with Lids (for holding finished eggs)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 13.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Pre-cook sausage and hash browns the morning of. Set up a two-person assembly line: tortilla → scrambled eggs → sausage → hash browns → bell peppers → cheese → fold and wrap in foil.",
  cookNote: "Electric griddles or large commercial flat-tops work best for eggs. Scramble in batches of 12–18 eggs at a time. Budget 60–80 burritos per hour with a 2-person assembly line.",
};

// ============================================================
// TACOS
// Serving: 2 tacos per adult, 1.5 per child (research-verified standard)
// Protein: 2.5 oz cooked per taco → 0.208 lb raw (25% shrink factor)
// Shell split: 40% hard, 60% soft when offering both
// 10% buffet premium baked in.
// ============================================================
export const tacoAssumptions: MealAssumption = {
  label: "tacos",
  displayName: "Tacos",
  adultServings: 2.3,   // 2 × 1.15 per-person buffer
  kidServings: 1.65,    // 1.5 × 1.1 buffet premium
  wasteBuffer: 1.05,
  cookingComplexity: "low",
  ingredients: [
    {
      // 2.5 oz cooked per taco → raw with 25% shrink = 3.33 oz = 0.208 lb raw per taco
      name: "Ground Beef 80/20 (or ground turkey)",
      perServing: 0.208,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
      required: true,
    },
    {
      // 40% of tacos go in hard shells
      name: "Taco Shells (hard, 24-count box)",
      perServing: 0.4,
      unit: "shell",
      packageSize: 24,
      packageUnit: "24-count box",
      costPerPackage: [4.50, 8.00],
      category: "carb",
      required: true,
    },
    {
      // 60% of tacos go in soft tortillas
      name: "Flour Tortillas — soft taco option (20-pack)",
      perServing: 0.6,
      unit: "tortilla",
      packageSize: 20,
      packageUnit: "20-pack",
      costPerPackage: [4.50, 8.00],
      category: "carb",
    },
    {
      // 1 packet per 1 lb of meat, scaled to 0.208 lb meat per taco
      name: "Taco Seasoning (1-oz packet per 1 lb of meat)",
      perServing: 0.208,
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
    { name: "Paper Plates (9\" or 10\")", perPerson: 1.1, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks", perPerson: 1.25, packageSize: 100, costPerPackage: [3.50, 6.00] },
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
// Serving: 4 oz dry pasta per adult, 2.5 oz per child (main course)
// Sauce: 4 oz per serving. Meat: 2.5 oz cooked per serving.
// Bread: 1.5 slices per adult (garlic bread loaf serves ~8 slices).
// 10% buffet premium baked in.
// Olive oil and kosher salt are cooking ingredients — batch calculated.
// ============================================================
export const spaghettiAssumptions: MealAssumption = {
  label: "spaghetti",
  displayName: "Spaghetti Dinner",
  adultServings: 1.1,   // 1 plate × 1.1 buffet premium
  kidServings: 0.66,    // 0.6 adult × 1.1 buffet premium
  wasteBuffer: 1.05,
  cookingComplexity: "high",
  ingredients: [
    {
      // 4 oz (0.25 lb) dry pasta per adult serving — standard main-course portion
      name: "Dry Spaghetti (1-lb boxes)",
      perServing: 0.25,
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb box",
      costPerPackage: [1.25, 2.75],
      category: "carb",
      required: true,
    },
    {
      // 2.5 oz cooked per serving; raw with 25% shrink = 0.208 lb raw
      name: "Ground Beef 80/20 or Italian Sausage (for sauce)",
      perServing: 0.21,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
      required: true,
    },
    {
      // 4 oz sauce per serving → 4/24 = 0.167 of a 24 oz jar per serving
      name: "Jarred Pasta Sauce (24 oz jar)",
      perServing: 0.167,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.00, 6.50],
      category: "other",
      required: true,
    },
    {
      // 1.5 slices per adult; loaf ≈ 8 slices → 0.1875 per serving, 80% take
      name: "Frozen Garlic Bread Loaves (each loaf serves ~8)",
      perServing: 0.1875,
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
      // ~2 tbsp per pot (1 lb pasta per pot). One 48 oz bottle ≈ 96 tbsp; covers ~48 pots.
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
      // ~1 tbsp per pot of pasta water. 3-lb container is plenty for any event under 500.
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
    { name: "Foam or Paper Bowls (12 oz) for pasta", perPerson: 1.1, packageSize: 50, costPerPackage: [6.00, 11.00] },
    { name: "Paper Plates (for garlic bread & salad)", perPerson: 1.1, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Plastic Forks (2 per guest: pasta + salad)", perPerson: 1.25, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
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
// Serving: 3 pancakes per adult, 2 per child (breakfast fundraiser standard)
// Each pancake ≈ 0.054 lb dry mix (0.25 cups × 0.215 lb/cup density)
// Sausage: 1 link per adult (2 oz), 0.75 per child, 80% take rate
// Syrup: 1.5 oz per person, 90% usage
// 10% buffet premium baked in.
// ============================================================
export const pancakeAssumptions: MealAssumption = {
  label: "pancakes",
  displayName: "Pancake Breakfast",
  adultServings: 3.45,  // 3 pancakes × 1.15 per-person buffer
  kidServings: 2.2,     // 2 pancakes × 1.1 buffet premium
  wasteBuffer: 1.05,
  cookingComplexity: "medium",
  ingredients: [
    {
      // 0.25 cups dry mix per pancake × 0.215 lb/cup ≈ 0.054 lb per pancake
      // 5-lb box → ~92 pancakes
      name: "Complete Pancake Mix (5-lb box)",
      perServing: 0.054,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb box (~92 pancakes)",
      costPerPackage: [6.50, 11.00],
      category: "carb",
      required: true,
    },
    {
      // Mix-in eggs — complete mix typically needs 1 egg per 7-8 pancakes
      name: "Eggs (large, by the flat — 30-count)",
      perServing: 0.13,
      unit: "egg",
      packageSize: 30,
      packageUnit: "30-egg flat",
      costPerPackage: [9.00, 18.00],
      category: "protein",
    },
    {
      // Mix-in milk — complete mix typically needs ~2/3 cup per 7-8 pancakes
      name: "Milk (gallon — for batter)",
      perServing: 0.011,
      unit: "gallon",
      packageSize: 1,
      packageUnit: "gallon",
      costPerPackage: [4.00, 7.50],
      category: "dairy",
    },
    {
      // 1 link (2 oz = 0.125 lb) per adult, 0.75 per child → per pancake: ~0.038 lb
      name: "Breakfast Sausage Links (2-lb pack — side dish)",
      perServing: 0.038,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb pack",
      costPerPackage: [7.00, 13.00],
      category: "protein",
      usageRate: 0.80,
    },
    {
      // Cooking ingredient — used on griddle
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
      // 1.5 oz syrup per person → per pancake: 1.5/32/3.3 ≈ 0.014 bottles per pancake
      name: "Maple Syrup (32 oz bottle)",
      perServing: 0.014,
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
      perServing: 0.012,
      unit: "carton",
      packageSize: 1,
      packageUnit: "half-gallon carton",
      costPerPackage: [4.50, 8.00],
      category: "other",
      usageRate: 0.65,
    },
  ],
  supplies: [
    { name: "Paper Plates (10\")", perPerson: 1.1, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Plastic Forks", perPerson: 1.25, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
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
// WALKING TACOS
// Great for youth events and outdoor gatherings.
// Setup: Individual snack bags (Fritos/Doritos) opened at the top.
// Guests add seasoned meat and toppings directly into the bag.
// No plates needed — just a fork. Fastest taco-style service.
// ============================================================
export const walkingTacosAssumptions: MealAssumption = {
  label: "walkingTacos",
  displayName: "Walking Tacos",
  adultServings: 1.0,   // 1 bag per person — format is self-limiting
  kidServings: 1.0,     // kids love this format equally
  wasteBuffer: 1.05,
  cookingComplexity: "low",
  ingredients: [
    {
      // 1 individual 1-oz snack bag per person (Fritos or Doritos)
      name: "Fritos or Doritos Individual Snack Bags (1-oz, 40-count box)",
      perServing: 1,
      unit: "bag",
      packageSize: 40,
      packageUnit: "40-count variety box",
      costPerPackage: [18.00, 28.00],
      category: "carb",
      required: true,
    },
    {
      // 2 oz cooked meat per person → raw with 25% shrink = 2.67 oz = 0.167 lb raw
      name: "Ground Beef 80/20 (seasoned taco meat)",
      perServing: 0.167,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
      required: true,
    },
    {
      // 1 packet per 1 lb of meat, scaled to 0.167 lb per person
      name: "Taco Seasoning (1-oz packet)",
      perServing: 0.167,
      unit: "packet",
      packageSize: 1,
      packageUnit: "1-oz packet",
      costPerPackage: [0.85, 2.00],
      category: "condiment",
      cookingOnly: true,
    },
    {
      // 0.75 oz per person = 0.047 lb; 80% usage
      name: "Shredded Mexican Blend Cheese (2-lb bag)",
      perServing: 0.047,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
      usageRate: 0.80,
    },
    {
      // 0.75 oz per person; 50% usage
      name: "Sour Cream (5-lb tub)",
      perServing: 0.047,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb tub",
      costPerPackage: [5.99, 5.99],
      category: "dairy",
      usageRate: 0.50,
    },
    {
      // 0.75 oz = ~1/32 of a 24 oz jar; 65% usage
      name: "Salsa (24 oz jar)",
      perServing: 0.031,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.50, 6.50],
      category: "condiment",
      usageRate: 0.65,
    },
    {
      // 0.5 oz per person; 55% usage
      name: "Shredded Iceberg Lettuce (pre-shredded bag — 16 oz)",
      perServing: 0.031,
      unit: "lb",
      packageSize: 1,
      packageUnit: "16 oz bag",
      costPerPackage: [2.50, 4.50],
      category: "produce",
      usageRate: 0.55,
    },
  ],
  supplies: [
    { name: "Plastic Forks (one per person — no plates needed!)", perPerson: 1.25, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Aluminum Foil Pans (for holding seasoned meat)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Serving Spoons (for toppings)", perPerson: 0.01, packageSize: 6, costPerPackage: [7.00, 13.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Brown and season meat ahead of time — can be done the day before and reheated. At service: open chip bags at the top, let guests add meat and toppings directly into the bag. No plates or assembly table needed — just a topping bar and forks.",
  cookNote: "Walking tacos are the fastest-serving taco format. One person can serve 100 guests in under 20 minutes with a single meat station. Keep meat warm in a covered foil pan or electric roaster at 170°F.",
};

// ============================================================
// CHIPS (side dish — used in Burgers + Chips combo)
// ============================================================
export const chipsAssumption: MealAssumption = {
  label: "chips" as string,
  displayName: "Chips (side)",
  adultServings: 1,
  kidServings: 1,
  wasteBuffer: 1.05,
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
    { name: "Paper Plates (9\" or 10\")", perPerson: 1.1, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Plastic Utensils (fork, knife, spoon combo pack)", perPerson: 1.25, packageSize: 100, costPerPackage: [4.50, 8.00] },
    { name: "Napkins", perPerson: 1.5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
  ],
  prepNotes: "Plan your custom prep schedule based on your specific recipe and cooking method. Add 20–30 minutes of buffer to any time estimate when using volunteers unfamiliar with the recipe.",
  cookNote: "Quantities and costs for custom meals are rough estimates only. Use this plan for supplies and volunteer structure, and calculate your specific food quantities manually from your recipe.",
};

// ============================================================
// Combo-adjusted assumptions
// 30% multi-option rule: when two meals are offered together,
// total quantity only needs to increase by 30% — not double.
// Each component gets ~70% of its solo portion.
// These are ONLY used in combo contexts — not for solo meals.
// ============================================================

const hotdogsForComboAssumptions: MealAssumption = {
  ...hotDogAssumptions,
  label: "hotdogs_combo",
  displayName: "Hot Dogs (combo portion)",
  // Solo: 1.65 per adult → combo 70%: ~1.15
  adultServings: 1.15,
  kidServings: 0.77,
};

const bakedPotatoForComboAssumptions: MealAssumption = {
  ...bakedPotatoAssumptions,
  label: "bakedPotatoes_combo",
  displayName: "Baked Potatoes (combo portion)",
  // Solo: 1.10 per adult → combo 70%: ~0.77
  adultServings: 0.77,
  kidServings: 0.58,
  supplies: [],  // no duplicate plates/napkins — taken from hotdogs component
};

const burgersForComboAssumptions: MealAssumption = {
  ...burgerAssumptions,
  label: "burgers_combo",
  displayName: "Burgers (combo portion)",
  // Solo: 1.10 per adult → combo ~1.0 (burgers already conservative)
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
  adultServings: 1, kidServings: 1, wasteBuffer: 1.05,
  cookingComplexity: "medium",
  ingredients: [], supplies: [],
  prepNotes: hotDogAssumptions.prepNotes + " | " + bakedPotatoAssumptions.prepNotes,
  cookNote: hotDogAssumptions.cookNote + " | " + bakedPotatoAssumptions.cookNote,
};

const comboBurgersChipsStub: MealAssumption = {
  label: "combo_burgers_chips",
  displayName: "Burgers + Chips",
  adultServings: 1, kidServings: 1, wasteBuffer: 1.05,
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
  walkingTacos: walkingTacosAssumptions,
  custom: customAssumptions,
  // Combo stubs — used for metadata/display; ingredient calc uses COMBO_DEFINITIONS
  combo_hotdogs_potatoes: comboHotdogsPotatoesStub,
  combo_burgers_chips: comboBurgersChipsStub,
  combo_pancakes_sausage: comboPancakesSausageStub,
};
