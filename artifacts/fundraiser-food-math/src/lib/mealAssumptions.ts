// ============================================================
// MEAL ASSUMPTIONS
// Edit these objects to update default quantities, costs,
// ingredients, and serving sizes for each meal type.
//
// All package sizes, cost ranges, and per-serving amounts
// are real-world estimates based on US grocery/warehouse
// pricing as of 2024-2025. Adjust costPerPackage for your region.
// ============================================================

export interface MealAssumption {
  label: string;
  displayName: string;
  adultServings: number;     // servings per adult (e.g. 2.5 hot dogs)
  kidServings: number;       // servings per kid/student
  wasteBuffer: number;       // multiplier e.g. 1.12 = 12% overage buffer
  cookingComplexity: "low" | "medium" | "high";
  ingredients: IngredientDef[];
  supplies: SupplyDef[];
  prepNotes: string;
  cookNote: string;
}

export interface IngredientDef {
  name: string;
  // perServing = how much of this item one serving requires
  perServing: number;
  unit: string;
  // packaging: how the product is actually sold
  packageSize: number;
  packageUnit: string;
  // cost range per package [low, high] in USD
  costPerPackage: [number, number];
  category: "protein" | "carb" | "dairy" | "produce" | "condiment" | "other";
}

export interface SupplyDef {
  name: string;
  perPerson: number;    // units needed per attendee
  packageSize: number;  // units per package (0 = one-time/reusable item)
  costPerPackage: [number, number];
}

// ============================================================
// HOT DOGS
// Complexity: LOW — simple grill, bun, condiment flow.
// Adults typically eat 2–3; kids 1–2.
// Common at outdoor fundraisers, church picnics, sports events.
// Note: hot dogs come in 10-packs; buns in 8-packs — plan
// for a slight mismatch and buy to the larger number.
// ============================================================
export const hotDogAssumptions: MealAssumption = {
  label: "hotdogs",
  displayName: "Hot Dogs",
  adultServings: 2.5,       // most adults eat 2–3 at a fundraiser
  kidServings: 1.5,
  wasteBuffer: 1.12,        // 12% buffer — hot dogs are cheap; round up
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
    },
    {
      name: "Hot Dog Buns (8-pack)",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "8-pack",
      costPerPackage: [3.00, 5.50],
      category: "carb",
    },
    {
      name: "Ketchup (32 oz squeeze bottle)",
      perServing: 0.016,    // ~0.5 oz per hot dog; 32 oz bottle covers ~64 dogs
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [3.50, 6.00],
      category: "condiment",
    },
    {
      name: "Mustard (20 oz squeeze bottle)",
      perServing: 0.015,    // ~0.3 oz per hot dog; 20 oz bottle covers ~66 dogs
      unit: "bottle",
      packageSize: 1,
      packageUnit: "20 oz bottle",
      costPerPackage: [2.00, 4.00],
      category: "condiment",
    },
    {
      name: "Relish (10 oz jar)",
      perServing: 0.015,    // ~0.15 oz per hot dog; used by about half the crowd
      unit: "jar",
      packageSize: 1,
      packageUnit: "10 oz jar",
      costPerPackage: [2.50, 4.00],
      category: "condiment",
    },
    {
      name: "Diced White Onion (optional topping)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
    },
    {
      name: "Canned Chili (optional topping for chili dogs)",
      perServing: 0.04,     // 3 oz chili per chili dog; not everyone uses it
      unit: "can",
      packageSize: 1,
      packageUnit: "15 oz can",
      costPerPackage: [1.50, 3.00],
      category: "other",
    },
    {
      name: "Shredded Cheddar Cheese (optional topping)",
      perServing: 0.03,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
    },
  ],
  supplies: [
    { name: "Paper Plates (9\")", perPerson: 1.2, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Serving Tongs (grill tongs)", perPerson: 0.01, packageSize: 1, costPerPackage: [7.00, 16.00] },
    { name: "Aluminum Foil Pans (for warming dogs off grill)", perPerson: 0.02, packageSize: 5, costPerPackage: [6.00, 11.00] },
    { name: "Heavy-Duty Aluminum Foil Roll", perPerson: 0.08, packageSize: 1, costPerPackage: [6.00, 12.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
  ],
  prepNotes: "Assign a Grill Master, a Bun & Condiment Station attendant, and a Student Runner for restocking. Pre-split buns into foil pans before service to speed the line. Pre-portion condiments into squeeze bottles so the station is self-serve.",
  cookNote: "A standard outdoor grill handles 40–60 hot dogs at once. Budget 90–120 dogs per hour per grill. Keep finished dogs in foil-lined pans covered with foil to hold warmth. Rotate cooked dogs to the front so older ones go first.",
};

// ============================================================
// BURGERS
// Complexity: MEDIUM — patty formation, grill timing, assembly.
// Adults eat 1–2 patties; kids typically 1.
// Needs grill space + a dedicated assembly crew.
// ============================================================
export const burgerAssumptions: MealAssumption = {
  label: "burgers",
  displayName: "Burgers",
  adultServings: 1.5,       // 1 patty minimum; bigger eaters often take 2
  kidServings: 1.0,
  wasteBuffer: 1.10,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Ground Beef 80/20 (bulk)",
      perServing: 0.33,     // 1/3 lb raw per patty — shrinks to ~1/4 lb cooked
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
    },
    {
      name: "Hamburger Buns (8-pack)",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "8-pack",
      costPerPackage: [3.50, 5.50],
      category: "carb",
    },
    {
      name: "American Cheese Slices (24-pack)",
      perServing: 1,
      unit: "slice",
      packageSize: 24,
      packageUnit: "24-slice pack",
      costPerPackage: [5.00, 9.00],
      category: "dairy",
    },
    {
      name: "Shredded Lettuce (pre-bagged)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [3.50, 6.00],
      category: "produce",
    },
    {
      name: "Roma Tomatoes (sliced)",
      perServing: 0.08,
      unit: "tomato",
      packageSize: 5,
      packageUnit: "5-lb box",
      costPerPackage: [5.00, 9.00],
      category: "produce",
    },
    {
      name: "White Onion (sliced rings for burgers)",
      perServing: 0.05,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
    },
    {
      name: "Dill Pickle Slices (gallon jar)",
      perServing: 0.012,    // about 2 slices per burger; gallon jar covers ~80 burgers
      unit: "jar",
      packageSize: 1,
      packageUnit: "gallon jar",
      costPerPackage: [6.00, 11.00],
      category: "condiment",
    },
    {
      name: "Ketchup (32 oz squeeze bottle)",
      perServing: 0.016,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [3.50, 6.00],
      category: "condiment",
    },
    {
      name: "Mustard (20 oz squeeze bottle)",
      perServing: 0.012,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "20 oz bottle",
      costPerPackage: [2.00, 4.00],
      category: "condiment",
    },
    {
      name: "Mayonnaise (30 oz jar)",
      perServing: 0.015,
      unit: "jar",
      packageSize: 1,
      packageUnit: "30 oz jar",
      costPerPackage: [5.00, 8.50],
      category: "condiment",
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
  prepNotes: "Form and season patties ahead of time using a burger press for consistency (1/3 lb each). Chill patties until 30 min before grill time. Set up a dedicated assembly station with cheese, toppings, and buns. Lay cheese on patties right off the grill to melt.",
  cookNote: "Budget 60–80 burgers per hour on a full-size grill. Season patties with salt and pepper before grilling. Grill to 160°F internal temp. Keep finished burgers in covered foil pans to hold heat. Rotate to keep older burgers served first.",
};

// ============================================================
// BAKED POTATOES
// Complexity: MEDIUM — long oven time, topping station needed.
// Very filling — adults eat 1–2; kids eat 1.
// Great for church dinners and school fundraisers.
// ============================================================
export const bakedPotatoAssumptions: MealAssumption = {
  label: "bakedPotatoes",
  displayName: "Baked Potatoes",
  adultServings: 1.3,       // 1 large potato, some adults take a second
  kidServings: 1.0,
  wasteBuffer: 1.12,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Russet Potatoes (large)",
      perServing: 1,
      unit: "potato",
      packageSize: 10,      // ~10 large russets per 10-lb bag
      packageUnit: "10-lb bag (~10 large potatoes)",
      costPerPackage: [7.00, 12.00],
      category: "carb",
    },
    {
      name: "Olive Oil (for rubbing potato skins)",
      perServing: 0.02,     // ~1 tsp per potato; 32 oz bottle covers ~200 potatoes
      unit: "tbsp",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [8.00, 15.00],
      category: "other",
    },
    {
      name: "Kosher Salt (for potato skins & table)",
      perServing: 0.01,
      unit: "tbsp",
      packageSize: 1,
      packageUnit: "3-lb container",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
    },
    {
      name: "Butter (1-lb blocks)",
      perServing: 0.04,     // ~1 tbsp per potato at topping bar
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb block (4 sticks)",
      costPerPackage: [4.50, 8.00],
      category: "dairy",
    },
    {
      name: "Sour Cream (16 oz container)",
      perServing: 0.06,     // ~1.5 oz per potato; a 16 oz container covers ~10 potatoes
      unit: "container",
      packageSize: 1,
      packageUnit: "16 oz container",
      costPerPackage: [3.50, 5.50],
      category: "dairy",
    },
    {
      name: "Shredded Cheddar Cheese (2-lb bag)",
      perServing: 0.05,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
    },
    {
      name: "Real Bacon Bits (12 oz bag)",
      perServing: 0.025,
      unit: "oz",
      packageSize: 12,
      packageUnit: "12 oz bag",
      costPerPackage: [6.00, 11.00],
      category: "protein",
    },
    {
      name: "Chives or Green Onions (bunches)",
      perServing: 0.02,
      unit: "bunch",
      packageSize: 1,
      packageUnit: "bunch",
      costPerPackage: [1.25, 3.00],
      category: "produce",
    },
    {
      name: "Broccoli Florets — optional healthy topping (2-lb bag)",
      perServing: 0.03,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [4.00, 7.50],
      category: "produce",
    },
  ],
  supplies: [
    { name: "Heavy-Duty Aluminum Foil Roll (for baking)", perPerson: 1.5, packageSize: 75, costPerPackage: [10.00, 18.00] },
    { name: "Sturdy Paper Plates (10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [7.00, 13.00] },
    { name: "Plastic Forks & Knives", perPerson: 1, packageSize: 100, costPerPackage: [4.00, 7.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Serving Spoons (for topping bar)", perPerson: 0.01, packageSize: 1, costPerPackage: [6.00, 12.00] },
    { name: "Aluminum Foil Pans (for holding finished potatoes)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 12.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Wash and pierce potatoes the night before. Rub each potato with olive oil and kosher salt, then wrap in foil. Bake in batches — use home ovens the day before or commercial ovens the morning of. Set up a self-serve topping bar: butter, sour cream, cheese, bacon bits, chives, and broccoli (optional).",
  cookNote: "Bake at 400°F for 60–75 minutes until fork-tender. Pre-baked potatoes hold well in towel-lined coolers or low-heat ovens for 2–3 hours. Keep the topping bar stocked throughout service — toppings run out faster than potatoes.",
};

// ============================================================
// BREAKFAST BURRITOS
// Complexity: HIGH — multiple simultaneous hot cooking surfaces,
// assembly line coordination, and precise timing required.
// Adults eat 2 burritos; kids/students eat 1–2.
// Popular at morning church events and school spirit breakfasts.
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
    },
    {
      name: "Eggs (large, by the flat — 30-count)",
      perServing: 2,        // 2 scrambled eggs per burrito
      unit: "egg",
      packageSize: 30,
      packageUnit: "30-egg flat",
      costPerPackage: [9.00, 18.00],
      category: "protein",
    },
    {
      name: "Breakfast Sausage (bulk, 2-lb pack)",
      perServing: 0.1,      // ~1.6 oz seasoned sausage per burrito
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb pack",
      costPerPackage: [7.00, 13.00],
      category: "protein",
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
    },
    {
      name: "Shredded Mexican Blend Cheese (2-lb bag)",
      perServing: 0.06,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
    },
    {
      name: "Salsa (24 oz jar)",
      perServing: 0.03,     // ~1.5 oz per burrito; about 1 jar per 16 burritos
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.50, 6.50],
      category: "condiment",
    },
    {
      name: "Hot Sauce (tabletop bottle — 12 oz)",
      perServing: 0.01,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "12 oz bottle",
      costPerPackage: [2.50, 5.00],
      category: "condiment",
    },
    {
      name: "Cooking Oil / Spray (for griddle and hash browns)",
      perServing: 0.01,
      unit: "can",
      packageSize: 1,
      packageUnit: "cooking spray can",
      costPerPackage: [3.50, 6.00],
      category: "other",
    },
    {
      name: "Salt & Pepper (for eggs and hash browns)",
      perServing: 0.005,
      unit: "set",
      packageSize: 1,
      packageUnit: "shaker set",
      costPerPackage: [3.00, 5.00],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Aluminum Foil (for wrapping each burrito)", perPerson: 2.5, packageSize: 75, costPerPackage: [10.00, 18.00] },
    { name: "Paper Plates", perPerson: 1.2, packageSize: 100, costPerPackage: [5.00, 9.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.50, 6.00] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.50, 6.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.03, packageSize: 100, costPerPackage: [9.00, 16.00] },
    { name: "Aluminum Foil Pans with Lids (for holding finished eggs)", perPerson: 0.02, packageSize: 5, costPerPackage: [7.00, 13.00] },
    { name: "Large Mixing Bowls (for cracking & beating eggs)", perPerson: 0.005, packageSize: 1, costPerPackage: [10.00, 20.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.03, packageSize: 30, costPerPackage: [9.00, 17.00] },
  ],
  prepNotes: "Pre-cook sausage and hash browns the morning of. Set up a two-person assembly line: tortilla → scrambled eggs → sausage → hash browns → bell peppers → cheese → fold and wrap in foil. Keep wrapped burritos in covered foil pans on a warming tray or low-heat oven (170°F).",
  cookNote: "Electric griddles or large commercial flat-tops work best for eggs. Scramble in batches of 12–18 eggs at a time. Budget 60–80 burritos per hour with a 2-person assembly line. Have a designated 'quality checker' to confirm each burrito is folded and sealed before wrapping.",
};

// ============================================================
// TACOS
// Complexity: LOW-MEDIUM — taco bar setup; meat is the main cook.
// Adults eat 3 tacos; kids 2.
// Very popular at school and church fundraisers.
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
      perServing: 0.14,     // ~2.25 oz seasoned meat per taco
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
    },
    {
      name: "Taco Shells (hard, 24-count box)",
      perServing: 1,
      unit: "shell",
      packageSize: 24,
      packageUnit: "24-count box",
      costPerPackage: [4.50, 8.00],
      category: "carb",
    },
    {
      name: "Flour Tortillas — soft taco option (20-pack)",
      perServing: 0.5,      // about half the crowd prefers soft; plan ~half of each
      unit: "tortilla",
      packageSize: 20,
      packageUnit: "20-pack",
      costPerPackage: [4.50, 8.00],
      category: "carb",
    },
    {
      name: "Taco Seasoning (1-oz packet per 1 lb of meat)",
      perServing: 0.14,     // matches meat ratio — 1 packet per pound
      unit: "packet",
      packageSize: 1,
      packageUnit: "1-oz packet",
      costPerPackage: [0.85, 2.00],
      category: "condiment",
    },
    {
      name: "Shredded Iceberg Lettuce (pre-shredded bag — 16 oz)",
      perServing: 0.025,
      unit: "bag",
      packageSize: 1,
      packageUnit: "16 oz bag",
      costPerPackage: [2.50, 4.50],
      category: "produce",
    },
    {
      name: "Roma Tomatoes (diced)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb box",
      costPerPackage: [5.00, 9.00],
      category: "produce",
    },
    {
      name: "White Onion (diced fine)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
    },
    {
      name: "Fresh Cilantro (bunches — optional)",
      perServing: 0.01,
      unit: "bunch",
      packageSize: 1,
      packageUnit: "bunch",
      costPerPackage: [1.25, 2.75],
      category: "produce",
    },
    {
      name: "Lime Wedges (for garnish)",
      perServing: 0.1,      // 1 lime per ~10 tacos; very popular at taco bars
      unit: "lime",
      packageSize: 6,
      packageUnit: "6-pack (or 3-lb bag)",
      costPerPackage: [2.50, 5.00],
      category: "produce",
    },
    {
      name: "Shredded Mexican Blend Cheese (2-lb bag)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [8.00, 14.00],
      category: "dairy",
    },
    {
      name: "Sour Cream (16 oz container)",
      perServing: 0.025,
      unit: "container",
      packageSize: 1,
      packageUnit: "16 oz container",
      costPerPackage: [3.50, 5.50],
      category: "dairy",
    },
    {
      name: "Salsa (24 oz jar)",
      perServing: 0.03,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.50, 6.50],
      category: "condiment",
    },
    {
      name: "Hot Sauce (tabletop bottle — 12 oz)",
      perServing: 0.01,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "12 oz bottle",
      costPerPackage: [2.50, 5.00],
      category: "condiment",
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
  prepNotes: "Brown meat in large batches (5 lbs at a time). Season each batch per packet directions. Set up a self-serve taco bar in this order: meat → shells/tortillas → cheese → lettuce → tomato → onion → cilantro → sour cream → salsa → lime wedges. Label each item.",
  cookNote: "One large skillet or roaster handles 5 lbs of meat at a time. Brown fully, drain fat, then add seasoning and water per packet directions. Keep meat warm in covered foil pans or an electric roaster at 170°F. Refill the serving tray before it empties to avoid gaps in the line.",
};

// ============================================================
// SPAGHETTI
// Complexity: HIGH — multiple components, pasta timing, saucing.
// Adults eat 1–1.2 plates; kids ~3/4 plate. Classic fundraiser dinner.
// Needs stockpots, serving equipment, and careful warm-holding.
// ============================================================
export const spaghettiAssumptions: MealAssumption = {
  label: "spaghetti",
  displayName: "Spaghetti Dinner",
  adultServings: 1.2,       // 1 generous plate; some adults take a small second serving
  kidServings: 0.75,
  wasteBuffer: 1.12,
  cookingComplexity: "high",
  ingredients: [
    {
      name: "Dry Spaghetti (1-lb boxes)",
      perServing: 0.22,     // ~3.5 oz dry pasta per serving (generous fundraiser portion)
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb box",
      costPerPackage: [1.25, 2.75],
      category: "carb",
    },
    {
      name: "Ground Beef 80/20 or Italian Sausage (for sauce)",
      perServing: 0.2,      // ~3.2 oz meat per serving in sauce
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [20.00, 32.00],
      category: "protein",
    },
    {
      name: "Jarred Pasta Sauce (24 oz jar)",
      perServing: 0.2,      // ~5 oz sauce per serving
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.00, 6.50],
      category: "other",
    },
    {
      name: "Frozen Garlic Bread Loaves (each loaf serves ~8)",
      perServing: 0.125,    // 1 slice per guest
      unit: "loaf",
      packageSize: 1,
      packageUnit: "frozen loaf (serves ~8)",
      costPerPackage: [3.50, 6.50],
      category: "carb",
    },
    {
      name: "Bagged Salad Mix (12 oz bag — optional side)",
      perServing: 0.05,     // 1 bag per ~20 guests
      unit: "bag",
      packageSize: 1,
      packageUnit: "12 oz bag",
      costPerPackage: [3.50, 6.00],
      category: "produce",
    },
    {
      name: "Italian Salad Dressing (16 oz bottle)",
      perServing: 0.04,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "16 oz bottle",
      costPerPackage: [2.50, 5.00],
      category: "condiment",
    },
    {
      name: "Parmesan Cheese (shredded, 8 oz bag)",
      perServing: 0.025,    // ~0.75 oz per serving; 8 oz bag covers ~10 servings
      unit: "bag",
      packageSize: 1,
      packageUnit: "8 oz bag",
      costPerPackage: [4.00, 7.50],
      category: "dairy",
    },
    {
      name: "Diced White Onion (for sauce base)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag (~9 medium onions)",
      costPerPackage: [3.00, 5.00],
      category: "produce",
    },
    {
      name: "Minced Garlic (jar — 32 oz)",
      perServing: 0.008,    // 1 large jar covers ~125 servings
      unit: "jar",
      packageSize: 1,
      packageUnit: "32 oz jar",
      costPerPackage: [5.00, 9.00],
      category: "condiment",
    },
    {
      name: "Olive Oil (for pasta and sauce)",
      perServing: 0.008,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "48 oz bottle",
      costPerPackage: [9.00, 18.00],
      category: "other",
    },
    {
      name: "Kosher Salt (for pasta water — large container)",
      perServing: 0.008,
      unit: "container",
      packageSize: 1,
      packageUnit: "3-lb container",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
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
  prepNotes: "Sauce can be made 1–2 days ahead and refrigerated — flavor improves overnight. Cook pasta in large stockpots in batches (1 lb pasta per pot of salted boiling water). Toss drained pasta with a splash of olive oil to prevent sticking. Hold in electric roasters at 170°F.",
  cookNote: "Plan 1 large stockpot per 50 servings of pasta. Stagger cooking in 15-minute intervals to keep fresh pasta flowing. Sauce goes in a separate roaster — designate one person solely to sauce temperature and stirring. Keep garlic bread in foil until served so it stays warm.",
};

// ============================================================
// PANCAKES
// Complexity: MEDIUM — continuous griddle management, batter batching.
// Adults eat 4 pancakes; kids 3.
// Classic church and school breakfast fundraiser.
// ============================================================
export const pancakeAssumptions: MealAssumption = {
  label: "pancakes",
  displayName: "Pancake Breakfast",
  adultServings: 4,         // 3–5 pancakes per adult is typical
  kidServings: 3,
  wasteBuffer: 1.15,        // pancakes are cheap; round up generously for breakage/irregular sizes
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Complete Pancake Mix (5-lb box)",
      perServing: 0.1,      // ~1.6 oz dry mix per pancake; 5-lb box = ~50 pancakes
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb box (~50 pancakes)",
      costPerPackage: [6.50, 11.00],
      category: "carb",
    },
    {
      name: "Eggs (large, by the flat — 30-count)",
      perServing: 0.15,     // most complete mixes need ~1 egg per 6–8 pancakes
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
      perServing: 0.06,     // ~2 links per guest; very common pancake breakfast side
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb pack",
      costPerPackage: [7.00, 13.00],
      category: "protein",
    },
    {
      name: "Butter / Cooking Spray (for griddle)",
      perServing: 0.015,
      unit: "can",
      packageSize: 1,
      packageUnit: "cooking spray can",
      costPerPackage: [3.50, 6.00],
      category: "dairy",
    },
    {
      name: "Maple Syrup (32 oz bottle)",
      perServing: 0.035,    // ~1 oz syrup per pancake; bottle covers ~30 pancakes
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [6.00, 12.00],
      category: "condiment",
    },
    {
      name: "Powdered Sugar (for dusting — 2-lb bag, optional)",
      perServing: 0.008,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2-lb bag",
      costPerPackage: [2.50, 4.50],
      category: "condiment",
    },
    {
      name: "Whipped Topping (optional — 8 oz container)",
      perServing: 0.025,
      unit: "container",
      packageSize: 1,
      packageUnit: "8 oz container",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
    },
    {
      name: "Orange Juice (half-gallon — optional breakfast drink)",
      perServing: 0.04,
      unit: "carton",
      packageSize: 1,
      packageUnit: "half-gallon carton",
      costPerPackage: [4.50, 8.00],
      category: "other",
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
  prepNotes: "Mix batter in large batches 20–30 minutes before service (avoid overmixing — lumps are fine). Keep batter cold in coolers between batches. Designate 1–2 Griddle Operators who stay at the griddles continuously. Pre-cook sausage links and hold warm in foil pans.",
  cookNote: "One large 22\" electric griddle produces ~80–100 pancakes per hour. Use a 1/4-cup ladle for consistent sizing. Flip when bubbles form across the surface and the edges look set. Keep finished pancakes warm in a low oven (200°F) or covered foil pans. Plan 1 griddle per 75–100 guests.",
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
      perServing: 0.05,     // ~1.3 oz chips per person; 2-lb bag covers ~24 guests
      unit: "bag",
      packageSize: 1,
      packageUnit: "2-lb bag",
      costPerPackage: [5.00, 9.00],
      category: "other",
    },
  ],
  supplies: [],   // supplies are inherited from the primary meal (burgers)
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
  wasteBuffer: 1.15,        // higher buffer since exact amounts are unknown
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
// Each combo lists its constituent base meal assumption objects.
// The calculator runs each component independently and merges.
// ============================================================
export interface ComboComponent {
  displayName: string;
  cookingComplexity: "low" | "medium" | "high";
  components: MealAssumption[];  // one or two base meal assumptions
}

export const COMBO_DEFINITIONS: Record<string, ComboComponent> = {
  combo_hotdogs_potatoes: {
    displayName: "Hot Dogs + Baked Potatoes",
    cookingComplexity: "medium",
    components: [hotDogAssumptions, bakedPotatoAssumptions],
  },
  combo_burgers_chips: {
    displayName: "Burgers + Chips",
    cookingComplexity: "medium",
    components: [burgerAssumptions, chipsAssumption],
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
