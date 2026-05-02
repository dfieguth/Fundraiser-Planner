// ============================================================
// MEAL ASSUMPTIONS
// Edit these objects to update default quantities, costs,
// ingredients, and serving sizes for each meal type.
//
// All package sizes, cost ranges, and per-serving amounts
// are real-world estimates based on US grocery/warehouse
// pricing. Adjust costPerPackage for your region.
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
// ============================================================
export const hotDogAssumptions: MealAssumption = {
  label: "hotdogs",
  displayName: "Hot Dogs",
  adultServings: 2.5,       // most adults eat 2–3 at a fundraiser
  kidServings: 1.5,
  wasteBuffer: 1.12,        // 12% buffer — hot dogs are cheap, round up
  cookingComplexity: "low",
  ingredients: [
    {
      name: "Hot Dogs (all-beef, 10-pack)",
      perServing: 1,
      unit: "hot dog",
      packageSize: 10,
      packageUnit: "10-pack",
      costPerPackage: [3.5, 6.5],
      category: "protein",
    },
    {
      name: "Hot Dog Buns",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "8-pack",
      costPerPackage: [2.50, 4.00],
      category: "carb",
    },
    {
      name: "Ketchup (32 oz squeeze bottle)",
      perServing: 0.04,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [3.00, 5.00],
      category: "condiment",
    },
    {
      name: "Mustard (20 oz squeeze bottle)",
      perServing: 0.04,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "20 oz bottle",
      costPerPackage: [1.75, 3.50],
      category: "condiment",
    },
    {
      name: "Relish (10 oz jar)",
      perServing: 0.03,
      unit: "jar",
      packageSize: 1,
      packageUnit: "10 oz jar",
      costPerPackage: [2.00, 3.50],
      category: "condiment",
    },
    {
      name: "Onion (diced, optional topping)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag",
      costPerPackage: [2.50, 4.00],
      category: "produce",
    },
  ],
  supplies: [
    { name: "Paper Plates (9\")", perPerson: 1.2, packageSize: 100, costPerPackage: [4.00, 8.00] },
    { name: "Napkins", perPerson: 4, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Serving Tongs", perPerson: 0.01, packageSize: 1, costPerPackage: [6.00, 14.00] },
    { name: "Aluminum Foil (heavy duty roll)", perPerson: 0.08, packageSize: 1, costPerPackage: [5.00, 10.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
    { name: "Hand Sanitizer / Gloves (box)", perPerson: 0.02, packageSize: 100, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Assign a grill master, a bun/condiment station attendant, and a serving runner. Pre-split buns before service to speed the line.",
  cookNote: "A standard outdoor grill handles 40–60 hot dogs at once. Budget 90–120 dogs per hour. Keep finished dogs in foil-lined pans to stay warm.",
};

// ============================================================
// BURGERS
// Complexity: MEDIUM — patty formation, grill timing, assembly.
// Adults eat 1–2 patties; kids typically 1.
// Needs grill space + assembly crew.
// ============================================================
export const burgerAssumptions: MealAssumption = {
  label: "burgers",
  displayName: "Burgers",
  adultServings: 1.5,       // 1 patty minimum; bigger eaters take 2
  kidServings: 1.0,
  wasteBuffer: 1.10,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Ground Beef 80/20 (bulk)",
      perServing: 0.33,     // ~1/3 lb per patty (raw, shrinks to ~1/4 lb)
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [16.00, 25.00],
      category: "protein",
    },
    {
      name: "Hamburger Buns",
      perServing: 1,
      unit: "bun",
      packageSize: 8,
      packageUnit: "8-pack",
      costPerPackage: [2.75, 5.00],
      category: "carb",
    },
    {
      name: "American Cheese Slices",
      perServing: 1,
      unit: "slice",
      packageSize: 24,
      packageUnit: "24-slice pack",
      costPerPackage: [4.00, 7.50],
      category: "dairy",
    },
    {
      name: "Lettuce (shredded, bagged)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [3.00, 5.50],
      category: "produce",
    },
    {
      name: "Tomatoes (roma, sliced)",
      perServing: 0.08,
      unit: "tomato",
      packageSize: 5,
      packageUnit: "5-lb box",
      costPerPackage: [4.00, 7.00],
      category: "produce",
    },
    {
      name: "Dill Pickle Slices (gallon jar)",
      perServing: 0.02,
      unit: "jar",
      packageSize: 1,
      packageUnit: "gallon jar",
      costPerPackage: [5.00, 9.00],
      category: "condiment",
    },
    {
      name: "Ketchup (32 oz squeeze bottle)",
      perServing: 0.04,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [3.00, 5.00],
      category: "condiment",
    },
    {
      name: "Mustard (20 oz squeeze bottle)",
      perServing: 0.03,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "20 oz bottle",
      costPerPackage: [1.75, 3.50],
      category: "condiment",
    },
    {
      name: "Mayonnaise (30 oz jar)",
      perServing: 0.03,
      unit: "jar",
      packageSize: 1,
      packageUnit: "30 oz jar",
      costPerPackage: [4.00, 7.00],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Sturdy Paper Plates (10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [6.00, 11.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.00, 5.00] },
    { name: "Serving Spatulas", perPerson: 0.01, packageSize: 1, costPerPackage: [8.00, 16.00] },
    { name: "Aluminum Foil (heavy duty roll)", perPerson: 0.12, packageSize: 1, costPerPackage: [5.00, 10.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.03, packageSize: 100, costPerPackage: [8.00, 14.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Form patties ahead of time (use a burger press for consistency). Chill until 30 min before grill time. Set up a dedicated assembly station with cheese, toppings, and buns.",
  cookNote: "Budget 60–80 burgers per hour on a full-size grill. Season patties with salt and pepper before grilling. Keep finished burgers in foil pans with a lid to hold heat.",
};

// ============================================================
// BAKED POTATOES
// Complexity: MEDIUM — long oven time, topping station needed.
// Very filling — adults eat 1 large; kids eat 1 small/medium.
// Great for church dinners and school fundraisers.
// ============================================================
export const bakedPotatoAssumptions: MealAssumption = {
  label: "bakedPotatoes",
  displayName: "Baked Potatoes",
  adultServings: 1.25,      // 1 large potato; bigger eaters may take a second
  kidServings: 1.0,
  wasteBuffer: 1.10,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Russet Potatoes (large, 100-count case or 10-lb bags)",
      perServing: 1,
      unit: "potato",
      packageSize: 10,      // ~10 large russets per 10-lb bag
      packageUnit: "10-lb bag (~10 large potatoes)",
      costPerPackage: [5.50, 9.50],
      category: "carb",
    },
    {
      name: "Butter (1-lb blocks)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb block",
      costPerPackage: [3.50, 6.50],
      category: "dairy",
    },
    {
      name: "Sour Cream (16 oz containers)",
      perServing: 0.06,
      unit: "container",
      packageSize: 1,
      packageUnit: "16 oz container",
      costPerPackage: [2.75, 4.75],
      category: "dairy",
    },
    {
      name: "Shredded Cheddar Cheese (2-lb bag)",
      perServing: 0.05,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [7.00, 12.00],
      category: "dairy",
    },
    {
      name: "Real Bacon Bits (12 oz bag)",
      perServing: 0.03,
      unit: "oz",
      packageSize: 12,
      packageUnit: "12 oz bag",
      costPerPackage: [5.00, 9.00],
      category: "protein",
    },
    {
      name: "Chives or Green Onions (bunch)",
      perServing: 0.02,
      unit: "bunch",
      packageSize: 1,
      packageUnit: "bunch",
      costPerPackage: [1.00, 2.50],
      category: "produce",
    },
    {
      name: "Salt & Pepper (shakers for tables)",
      perServing: 0.01,
      unit: "set",
      packageSize: 1,
      packageUnit: "shaker set",
      costPerPackage: [2.50, 4.50],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Aluminum Foil (heavy duty roll)", perPerson: 1.2, packageSize: 75, costPerPackage: [9.00, 16.00] },
    { name: "Sturdy Paper Plates (10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [6.00, 11.00] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.00, 5.00] },
    { name: "Plastic Knives", perPerson: 1, packageSize: 100, costPerPackage: [3.00, 5.00] },
    { name: "Napkins", perPerson: 4, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Serving Spoons (for toppings)", perPerson: 0.01, packageSize: 1, costPerPackage: [5.00, 10.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [8.00, 14.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Wash and pierce potatoes the night before. Rub with oil and salt, wrap in foil. Bake in batches — use home ovens the day before or commercial ovens event morning.",
  cookNote: "Bake at 400°F for 60–75 minutes until fork-tender. Pre-baked potatoes hold well in towel-lined coolers for 2–3 hours. Set up a topping bar: butter, sour cream, cheese, bacon bits, chives — self-serve style works well.",
};

// ============================================================
// BREAKFAST BURRITOS
// Complexity: MEDIUM-HIGH — multiple hot components, assembly line required.
// Adults eat 2 burritos; kids/students eat 1–2.
// Popular at morning church events and school spirit breakfasts.
// ============================================================
export const breakfastBurritoAssumptions: MealAssumption = {
  label: "breakfastBurritos",
  displayName: "Breakfast Burritos",
  adultServings: 2,
  kidServings: 1.5,
  wasteBuffer: 1.12,
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Large Flour Tortillas (10-inch, 20-pack)",
      perServing: 1,
      unit: "tortilla",
      packageSize: 20,
      packageUnit: "20-pack",
      costPerPackage: [4.50, 7.50],
      category: "carb",
    },
    {
      name: "Eggs (large, by the flat)",
      perServing: 2,
      unit: "egg",
      packageSize: 30,
      packageUnit: "30-egg flat",
      costPerPackage: [5.00, 10.00],
      category: "protein",
    },
    {
      name: "Breakfast Sausage (bulk, 2-lb pack)",
      perServing: 0.1,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb pack",
      costPerPackage: [5.50, 10.00],
      category: "protein",
    },
    {
      name: "Frozen Diced Hash Brown Potatoes (5-lb bag)",
      perServing: 0.08,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb bag",
      costPerPackage: [5.00, 9.00],
      category: "carb",
    },
    {
      name: "Shredded Mexican Blend Cheese (2-lb bag)",
      perServing: 0.06,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [7.00, 12.00],
      category: "dairy",
    },
    {
      name: "Salsa (24 oz jar)",
      perServing: 0.04,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
    },
    {
      name: "Hot Sauce (tabletop bottles)",
      perServing: 0.02,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "12 oz bottle",
      costPerPackage: [2.00, 4.00],
      category: "condiment",
    },
    {
      name: "Cooking Oil / Spray (for griddle)",
      perServing: 0.01,
      unit: "can",
      packageSize: 1,
      packageUnit: "cooking spray can",
      costPerPackage: [3.00, 5.00],
      category: "other",
    },
    {
      name: "Salt & Pepper",
      perServing: 0.01,
      unit: "set",
      packageSize: 1,
      packageUnit: "shaker set",
      costPerPackage: [2.50, 4.50],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Aluminum Foil (for wrapping burritos)", perPerson: 2.5, packageSize: 75, costPerPackage: [9.00, 16.00] },
    { name: "Paper Plates", perPerson: 1.2, packageSize: 100, costPerPackage: [4.00, 8.00] },
    { name: "Napkins", perPerson: 4, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.00, 5.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.03, packageSize: 100, costPerPackage: [8.00, 14.00] },
    { name: "Chafing Dish / Aluminum Foil Pans (for holding eggs)", perPerson: 0.01, packageSize: 5, costPerPackage: [6.00, 12.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Pre-cook sausage in bulk the morning of. Set up an assembly line: tortilla → scrambled eggs → sausage → hash browns → cheese → fold & wrap. Keep wrapped burritos warm in foil pans covered with foil.",
  cookNote: "Electric griddles or large commercial flat-tops work best. Scramble eggs in large batches (12–18 eggs at a time). Budget 60–80 burritos per hour with a 2-person assembly line.",
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
      costPerPackage: [16.00, 25.00],
      category: "protein",
    },
    {
      name: "Taco Shells (hard, 24-count box) or Flour Tortillas",
      perServing: 1,
      unit: "shell",
      packageSize: 24,
      packageUnit: "24-count box",
      costPerPackage: [4.00, 7.00],
      category: "carb",
    },
    {
      name: "Taco Seasoning (1 oz packet per lb of meat)",
      perServing: 0.14,     // 1 packet per lb of meat
      unit: "packet",
      packageSize: 1,
      packageUnit: "1 oz packet",
      costPerPackage: [0.75, 1.75],
      category: "condiment",
    },
    {
      name: "Shredded Lettuce (pre-shredded bag)",
      perServing: 0.03,
      unit: "bag",
      packageSize: 1,
      packageUnit: "16 oz bag",
      costPerPackage: [2.00, 4.00],
      category: "produce",
    },
    {
      name: "Diced Tomatoes (Roma or canned, drained)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb box",
      costPerPackage: [4.50, 8.00],
      category: "produce",
    },
    {
      name: "Shredded Mexican Blend Cheese (2-lb bag)",
      perServing: 0.04,
      unit: "lb",
      packageSize: 2,
      packageUnit: "2-lb bag",
      costPerPackage: [7.00, 12.00],
      category: "dairy",
    },
    {
      name: "Sour Cream (16 oz container)",
      perServing: 0.03,
      unit: "container",
      packageSize: 1,
      packageUnit: "16 oz container",
      costPerPackage: [2.75, 4.75],
      category: "dairy",
    },
    {
      name: "Salsa (24 oz jar)",
      perServing: 0.04,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [3.00, 5.50],
      category: "condiment",
    },
    {
      name: "Hot Sauce (tabletop bottles)",
      perServing: 0.02,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "12 oz bottle",
      costPerPackage: [2.00, 4.00],
      category: "condiment",
    },
    {
      name: "Diced Onions (white)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag",
      costPerPackage: [2.50, 4.50],
      category: "produce",
    },
  ],
  supplies: [
    { name: "Paper Plates (9\")", perPerson: 1.5, packageSize: 100, costPerPackage: [4.00, 8.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.00, 5.00] },
    { name: "Serving Spoons (for toppings)", perPerson: 0.01, packageSize: 6, costPerPackage: [6.00, 12.00] },
    { name: "Aluminum Foil Pans (for holding seasoned meat)", perPerson: 0.01, packageSize: 5, costPerPackage: [6.00, 11.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [8.00, 14.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Brown meat in large batches (5 lbs at a time works well). Season each batch. Set up a self-serve taco bar: meat → shells/tortillas → cheese → lettuce → tomato → sour cream → salsa.",
  cookNote: "One large skillet or roaster handles 5 lbs of meat at a time. Brown fully, drain fat, then add seasoning and water per packet directions. Keep meat warm in covered foil pans or a roaster set to 170°F.",
};

// ============================================================
// SPAGHETTI
// Complexity: HIGH — multiple components, pasta timing, saucing.
// Adults eat 1 plate; kids 3/4 plate. Classic church/school dinner.
// Needs stockpots, serving equipment, and careful warm-holding.
// ============================================================
export const spaghettiAssumptions: MealAssumption = {
  label: "spaghetti",
  displayName: "Spaghetti Dinner",
  adultServings: 1,
  kidServings: 0.75,
  wasteBuffer: 1.12,
  cookingComplexity: "high",
  ingredients: [
    {
      name: "Dry Spaghetti (1-lb boxes)",
      perServing: 0.22,     // ~3.5 oz dry pasta per serving (generous plate)
      unit: "lb",
      packageSize: 1,
      packageUnit: "1-lb box",
      costPerPackage: [1.00, 2.25],
      category: "carb",
    },
    {
      name: "Ground Beef 80/20 or Italian Sausage",
      perServing: 0.2,      // ~3.2 oz meat per serving in sauce
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb pack",
      costPerPackage: [16.00, 25.00],
      category: "protein",
    },
    {
      name: "Jarred Pasta Sauce (24 oz jar)",
      perServing: 0.2,
      unit: "jar",
      packageSize: 1,
      packageUnit: "24 oz jar",
      costPerPackage: [2.50, 5.50],
      category: "other",
    },
    {
      name: "Garlic Bread (pre-made loaves, 2 servings per loaf half)",
      perServing: 0.5,
      unit: "serving",
      packageSize: 2,
      packageUnit: "loaf (4 servings)",
      costPerPackage: [3.00, 6.00],
      category: "carb",
    },
    {
      name: "Parmesan Cheese (shredded, 8 oz bag)",
      perServing: 0.03,
      unit: "bag",
      packageSize: 1,
      packageUnit: "8 oz bag",
      costPerPackage: [3.50, 6.50],
      category: "dairy",
    },
    {
      name: "Diced Onion (for sauce)",
      perServing: 0.02,
      unit: "onion",
      packageSize: 3,
      packageUnit: "3-lb bag",
      costPerPackage: [2.50, 4.50],
      category: "produce",
    },
    {
      name: "Minced Garlic (jar)",
      perServing: 0.01,
      unit: "jar",
      packageSize: 1,
      packageUnit: "32 oz jar",
      costPerPackage: [4.00, 7.50],
      category: "condiment",
    },
    {
      name: "Olive Oil (for pasta & sauce)",
      perServing: 0.01,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "48 oz bottle",
      costPerPackage: [7.00, 14.00],
      category: "other",
    },
    {
      name: "Salt (for pasta water, large container)",
      perServing: 0.01,
      unit: "container",
      packageSize: 1,
      packageUnit: "26 oz container",
      costPerPackage: [1.50, 3.00],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Foam or Paper Bowls (12 oz)", perPerson: 1.2, packageSize: 50, costPerPackage: [5.00, 9.00] },
    { name: "Paper Plates (for garlic bread)", perPerson: 1, packageSize: 100, costPerPackage: [4.00, 8.00] },
    { name: "Plastic Forks", perPerson: 2, packageSize: 100, costPerPackage: [3.00, 5.00] },
    { name: "Napkins", perPerson: 5, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Serving Tongs / Pasta Forks", perPerson: 0.01, packageSize: 6, costPerPackage: [6.00, 12.00] },
    { name: "Large Serving Spoons (for sauce)", perPerson: 0.01, packageSize: 6, costPerPackage: [6.00, 12.00] },
    { name: "Chafing Dishes or Electric Roasters (for pasta and sauce)", perPerson: 0.005, packageSize: 1, costPerPackage: [30.00, 70.00] },
    { name: "Sterno Fuel Cans (if using chafing dishes)", perPerson: 0.005, packageSize: 3, costPerPackage: [8.00, 14.00] },
    { name: "Disposable Gloves (box of 100)", perPerson: 0.02, packageSize: 100, costPerPackage: [8.00, 14.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Sauce can be made 1–2 days ahead and refrigerated — flavor improves overnight. Cook pasta in large stockpots in batches (1 lb pasta per pot). Toss cooked pasta with a small amount of olive oil to prevent sticking. Keep in roasters or chafing dishes at 170°F.",
  cookNote: "Plan 1 large stockpot per 50 servings of pasta. Stagger cooking in 15-minute intervals to maintain fresh pasta supply. Sauce goes in a separate roaster. Assign one person solely to pasta water management.",
};

// ============================================================
// PANCAKES
// Complexity: MEDIUM — griddle management, continuous output needed.
// Adults eat 4 pancakes; kids 3.
// Classic church breakfast fundraiser.
// ============================================================
export const pancakeAssumptions: MealAssumption = {
  label: "pancakes",
  displayName: "Pancake Breakfast",
  adultServings: 4,         // 3–5 pancakes per adult is typical
  kidServings: 3,
  wasteBuffer: 1.15,        // pancakes are cheap; round up generously
  cookingComplexity: "medium",
  ingredients: [
    {
      name: "Complete Pancake Mix (5-lb box)",
      perServing: 0.1,      // ~1.6 oz dry mix per pancake
      unit: "lb",
      packageSize: 5,
      packageUnit: "5-lb box",
      costPerPackage: [5.50, 9.50],
      category: "carb",
    },
    {
      name: "Eggs (large, by the flat)",
      perServing: 0.15,     // most complete mixes need 1 egg per ~6–8 pancakes
      unit: "egg",
      packageSize: 30,
      packageUnit: "30-egg flat",
      costPerPackage: [5.00, 10.00],
      category: "protein",
    },
    {
      name: "Milk (gallon)",
      perServing: 0.08,
      unit: "gallon",
      packageSize: 1,
      packageUnit: "gallon",
      costPerPackage: [3.25, 5.75],
      category: "dairy",
    },
    {
      name: "Butter / Cooking Spray (for griddles)",
      perServing: 0.015,
      unit: "can",
      packageSize: 1,
      packageUnit: "cooking spray can",
      costPerPackage: [3.00, 5.50],
      category: "dairy",
    },
    {
      name: "Maple Syrup (32 oz bottle)",
      perServing: 0.04,
      unit: "bottle",
      packageSize: 1,
      packageUnit: "32 oz bottle",
      costPerPackage: [4.50, 9.50],
      category: "condiment",
    },
    {
      name: "Powdered Sugar (for topping, optional)",
      perServing: 0.01,
      unit: "bag",
      packageSize: 1,
      packageUnit: "2-lb bag",
      costPerPackage: [2.00, 3.50],
      category: "condiment",
    },
    {
      name: "Whipped Topping (Cool Whip or can, optional)",
      perServing: 0.03,
      unit: "container",
      packageSize: 1,
      packageUnit: "8 oz container",
      costPerPackage: [2.50, 4.50],
      category: "condiment",
    },
  ],
  supplies: [
    { name: "Paper Plates (10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [4.00, 8.00] },
    { name: "Plastic Forks", perPerson: 1, packageSize: 100, costPerPackage: [3.00, 5.00] },
    { name: "Napkins", perPerson: 4, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Electric Griddles (large, 22\"+)", perPerson: 0.006, packageSize: 1, costPerPackage: [35.00, 80.00] },
    { name: "Plastic Spatulas (heat-safe)", perPerson: 0.015, packageSize: 1, costPerPackage: [5.00, 10.00] },
    { name: "Ladles / Portion Scoops (for batter)", perPerson: 0.01, packageSize: 1, costPerPackage: [6.00, 12.00] },
    { name: "Large Mixing Bowls", perPerson: 0.005, packageSize: 1, costPerPackage: [8.00, 18.00] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Mix batter in large batches 20–30 minutes before service (avoid overmixing). Keep batter cold in coolers between batches. Designate 1–2 griddle operators who stay at the griddles continuously.",
  cookNote: "One large 22\" electric griddle produces ~80–100 pancakes per hour. Use a 1/4-cup ladle for consistent sizing. Keep finished pancakes warm in a low oven (200°F) or covered foil pans. Plan 1 griddle per 75–100 guests for smooth flow.",
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
    { name: "Paper Plates (9\" or 10\")", perPerson: 1.2, packageSize: 100, costPerPackage: [4.00, 8.00] },
    { name: "Plastic Utensils (combo pack)", perPerson: 1, packageSize: 100, costPerPackage: [4.00, 7.00] },
    { name: "Napkins", perPerson: 4, packageSize: 250, costPerPackage: [3.00, 5.50] },
    { name: "Trash Bags (13-gallon)", perPerson: 0.02, packageSize: 30, costPerPackage: [8.00, 15.00] },
  ],
  prepNotes: "Plan your custom prep schedule based on your specific recipe and cooking method.",
  cookNote: "Quantities and costs for custom meals are rough estimates only. Adjust all values based on your specific recipe.",
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
