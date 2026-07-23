// ============================================================
// CORE CALCULATION ENGINE
// All food quantity, cost, timeline, and volunteer logic lives here.
// To update serving assumptions, edit mealAssumptions.ts.
// ============================================================

import type {
  PlannerFormData, FundraiserPlan, ShoppingItem,
  SupplyItem, DrinkItem, PrepStep, VolunteerRole, RiskWarning, RiskPlanItem,
  StrategySection, ProfitStrategy, SetupStation,
  LeftoverPlan, CommsPack, ShoppingGroup, MealType, MultiMealSection,
} from "./types";
import { MEAL_ASSUMPTIONS, isComboMeal, COMBO_DEFINITIONS, drinkAssumptions } from "./mealAssumptions";
import type { MealAssumption, IngredientDef } from "./mealAssumptions";

// ── Planning disclaimer ───────────────────────────────────────
const DISCLAIMER =
  "These are planning estimates. Adjust for your group, appetite, store prices, and local context.";

// ── Helpers ──────────────────────────────────────────────────

function ceilToPackage(total: number, packageSize: number): number {
  return Math.ceil(total / packageSize);
}

// ── Store-specific package overrides ─────────────────────────
// Applies warehouse-specific package size overrides without changing
// base mealAssumptions. Only called when storePreference warrants it.
function applyStorePackageOverrides(
  component: MealAssumption,
  storePreference?: string,
): MealAssumption {
  // Always normalize hot dog display name regardless of store
  const renamedIngredients = component.ingredients.map((ing) => {
    if (ing.name === "Hot Dogs (all-beef, 10-pack)") {
      return { ...ing, name: "Hot Dogs" };
    }
    return ing;
  });

  if (storePreference !== "Costco") {
    return { ...component, ingredients: renamedIngredients };
  }

  return {
    ...component,
    ingredients: renamedIngredients.map((ing) => {
      if (ing.name === "Hot Dogs") {
        return {
          ...ing,
          packageSize: 36,
          packageUnit: "36-count pack",
          costPerPackage: [14.00, 22.00] as [number, number],
        };
      }
      return ing;
    }),
  };
}

function rangeAdd(a: [number, number], b: [number, number]): [number, number] {
  return [a[0] + b[0], a[1] + b[1]];
}

function addMinutes(timeStr: string, minutes: number): string {
  if (!timeStr || !timeStr.includes(":")) return "00:00";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "00:00";
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function formatTime(timeStr: string): string {
  if (!timeStr || !timeStr.includes(":")) return "";
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function minutesBetween(start: string, end: string): number {
  if (!start || !end || !start.includes(":") || !end.includes(":")) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;
  return (eh * 60 + em) - (sh * 60 + sm);
}

function fmt$(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

// ── Risk helper ───────────────────────────────────────────────
// Produces both a warning banner and a risk plan item (with fix) together.
function buildRisk(
  level: RiskWarning["level"],
  message: string,
  fix: string,
): { warning: RiskWarning; plan: RiskPlanItem } {
  return { warning: { level, message }, plan: { level, warning: message, fix } };
}

// ── Volunteer plan by meal type ──────────────────────────────
//
// Approved role types: "Adult Volunteer" | "Parent Volunteer" |
//   "Parent Oversight" | "Student Volunteer"
//
// Approved role names include: Grill Master, Serving Team,
//   Student Runner, Cleanup Team, Setup Crew, Cashier /
//   Donation Table — never use "Parent Helper."
//

function buildVolunteerPlan(
  form: PlannerFormData,
  cookingComplexity: "low" | "medium" | "high",
): VolunteerRole[] {
  const { attendance, mealType, adultVolunteers, studentVolunteers } = form;
  const totalVolunteers = adultVolunteers + studentVolunteers;

  // ── Meal-specific cook roles ────────────────────────────────
  const cookRoles: Record<string, VolunteerRole[]> = {
    hotdogs: [
      {
        role: "Grill Master",
        count: Math.max(1, Math.ceil(attendance / 80)),
        type: "Adult Volunteer",
        duties: [
          "Operate and monitor grill(s) throughout service",
          "Cook hot dogs to safe internal temperature",
          "Signal Serving Team when the next batch is ready",
        ],
      },
      {
        role: "Bun & Condiment Station",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Parent Oversight",
        duties: [
          "Pre-open buns and stage in foil pans before service",
          "Keep condiment station stocked (ketchup, mustard, relish, onion)",
          "Restock chili and cheese toppings as needed",
        ],
      },
    ],
    burgers: [
      {
        role: "Grill Master",
        count: Math.max(1, Math.ceil(attendance / 60)),
        type: "Adult Volunteer",
        duties: [
          "Form and grill patties to 160°F internal temperature",
          "Monitor grill temperature and timing between batches",
          "Coordinate burger output pace with the Assembly Station",
        ],
      },
      {
        role: "Burger Assembly Station",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Parent Oversight",
        duties: [
          "Place cheese slices on hot patties immediately off the grill",
          "Build burgers and set at the serving tray",
          "Keep buns, lettuce, tomato, onion, and condiments stocked",
        ],
      },
    ],
    bakedPotatoes: [
      {
        role: "Oven & Potato Monitor",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Adult Volunteer",
        duties: [
          "Monitor oven temperatures and pull potatoes when fork-tender",
          "Transfer finished potatoes to warm-holding (foil pans or coolers)",
          "Track oven batches so supply stays ahead of demand",
        ],
      },
      {
        role: "Topping Bar Attendant",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Parent Oversight",
        duties: [
          "Keep topping bar stocked: butter, sour cream, fiesta blend cheese, chili, nacho cheese, chives, and white onion",
          "Assist guests if the bar is not fully self-serve",
          "Maintain cleanliness and organization of the topping station",
        ],
      },
    ],
    breakfastBurritos: [
      {
        role: "Lead Cook — Eggs & Griddle",
        count: Math.max(1, Math.ceil(attendance / 60)),
        type: "Adult Volunteer",
        duties: [
          "Scramble eggs in large batches on the griddle",
          "Manage griddle temperature, oil, and batch timing",
          "Signal the assembly crew when fresh eggs are ready",
        ],
      },
      {
        role: "Sausage & Hash Brown Station",
        count: Math.max(1, Math.ceil(attendance / 80)),
        type: "Adult Volunteer",
        duties: [
          "Pre-cook sausage and hold warm in roasters or foil pans",
          "Cook and season O'Brien potatoes",
          "Keep the protein and potato station continuously stocked",
        ],
      },
      {
        role: "Burrito Assembly & Wrapping",
        count: Math.max(2, Math.ceil(attendance / 45)),
        type: "Parent Oversight",
        duties: [
          "Assemble burritos in order: eggs → sausage → O'Brien potatoes → cheese",
          "Fold and wrap each burrito tightly in foil",
          "Pass finished burritos to the Serving Team",
        ],
      },
    ],
    tacos: [
      {
        role: "Taco Meat Station",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Adult Volunteer",
        duties: [
          "Brown and season ground beef in batches (5 lbs at a time)",
          "Keep meat warm at 170°F in covered roaster or foil pans",
          "Replenish the serving tray before it empties",
        ],
      },
      {
        role: "Taco Bar Setup & Restock",
        count: Math.max(1, Math.ceil(attendance / 90)),
        type: "Parent Oversight",
        duties: [
          "Stock and maintain taco bar: shells, tortillas, cheese, lettuce, tomato, onion, cilantro, sour cream, salsa, lime",
          "Refill serving dishes continuously during service",
          "Keep bar clean, labeled, and organized",
        ],
      },
    ],
    spaghetti: [
      {
        role: "Pasta Station Lead",
        count: Math.max(1, Math.ceil(attendance / 50)),
        type: "Adult Volunteer",
        duties: [
          "Cook pasta in large stockpots — stagger batches every 15 min",
          "Drain and transfer pasta to electric roasters with a splash of olive oil",
          "Monitor pasta temperature and texture throughout service",
        ],
      },
      {
        role: "Sauce Station",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Adult Volunteer",
        duties: [
          "Keep meat sauce at serving temperature in roaster (170°F+)",
          "Stir sauce regularly to prevent scorching on the bottom",
          "Ladle sauce over pasta at the serving station",
        ],
      },
      {
        role: "Garlic Bread & Salad",
        count: Math.max(1, Math.ceil(attendance / 120)),
        type: "Parent Oversight",
        duties: [
          "Warm garlic bread in foil and slice just before service",
          "Keep bread station and salad bar stocked",
          "Plate or bag bread and salad for each guest",
        ],
      },
    ],
    pancakes: [
      {
        role: "Griddle Operator",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Adult Volunteer",
        duties: [
          "Operate electric griddle continuously throughout service",
          "Pour batter with a 1/4-cup ladle, flip when bubbles form across the surface",
          "Keep griddle properly greased and at the correct temperature",
        ],
      },
      {
        role: "Batter & Syrup Station",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Parent Oversight",
        duties: [
          "Mix fresh batter batches as needed (avoid overmixing)",
          "Keep syrup, whipped topping, and powdered sugar stocked",
          "Deliver fresh batter to Griddle Operators and remove empty bowls",
        ],
      },
      {
        role: "Sausage Station",
        count: Math.max(1, Math.ceil(attendance / 120)),
        type: "Parent Oversight",
        duties: [
          "Pre-cook sausage links and hold warm in foil pans",
          "Restock sausage at the serving station throughout service",
          "Monitor food temperature — hold at 140°F or above",
        ],
      },
    ],
    custom: [
      {
        role: "Lead Cook / Food Manager",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Adult Volunteer",
        duties: [
          "Oversee all food preparation and cooking",
          "Monitor food safety temperatures throughout service",
          "Direct other volunteers on cooking and serving tasks",
        ],
      },
    ],
  };

  // ── Shared roles for all meal types ───────────────────────
  const sharedRoles: VolunteerRole[] = [
    {
      role: "Serving Team",
      count: Math.max(2, Math.ceil(attendance / 55)),
      type: "Parent Oversight",
      duties: [
        "Serve food to guests as they move through the line",
        "Maintain consistent serving portions",
        "Alert the cooking crew when supply is running low",
      ],
    },
    {
      role: "Cashier / Donation Table",
      count: Math.max(1, Math.ceil(attendance / 150)),
      type: "Adult Volunteer",
      duties: [
        "Collect suggested donations or ticket payments",
        "Handle cash and provide change accurately",
        "Keep donation box or register secure at all times",
      ],
    },
    {
      role: "Student Runner",
      count: Math.max(2, Math.ceil(attendance / 70)),
      type: "Student Volunteer",
      duties: [
        "Carry supplies from storage to serving stations",
        "Refill condiment, napkin, and utensil stations continuously",
        "Assist wherever needed — shadow an Adult Volunteer if unsure",
      ],
    },
    {
      role: "Cleanup Team",
      count: Math.max(2, Math.ceil(attendance / 65)),
      type: "Student Volunteer",
      duties: [
        "Monitor trash levels and replace full bags during service",
        "Clear and wipe down tables between guests",
        "Lead post-event venue cleanup and equipment breakdown",
      ],
    },
  ];

  // Extra setup crew for larger or more complex events
  const needsSetupCrew = attendance > 80 || cookingComplexity === "high";
  if (needsSetupCrew) {
    sharedRoles.unshift({
      role: "Setup Crew",
      count: Math.max(2, Math.ceil(attendance / 90)),
      type: "Student Volunteer",
      duties: [
        "Arrange tables, chairs, and event signage before guests arrive",
        "Lay out place settings: plates, napkins, utensils",
        "Carry and position cooking equipment and supplies",
      ],
    });
  }

  const mealSpecificRoles = cookRoles[mealType] ?? cookRoles["custom"]!;
  const allRoles: VolunteerRole[] = [...mealSpecificRoles, ...sharedRoles];

  // Scale counts down proportionally if actual volunteer count
  // is less than the ideal computed total
  const rolesTotal = allRoles.reduce((s, r) => s + r.count, 0);
  if (totalVolunteers > 0 && rolesTotal > totalVolunteers) {
    const factor = totalVolunteers / rolesTotal;
    allRoles.forEach((r) => {
      r.count = Math.max(1, Math.round(r.count * factor));
    });
  }

  return allRoles;
}

// ── Full Event Pack generators ────────────────────────────────

function buildStrategySummary(form: PlannerFormData): StrategySection {
  const strategies: Record<string, StrategySection> = {
    hotdogs: {
      bestFit: "Hot dog fundraisers work best at outdoor events, sports games, and casual community socials. They are fast to serve and easy to scale.",
      mainProfitDriver: "High volume at low cost. Hot dogs are inexpensive per serving, so profit grows with attendance and a fair donation price.",
      mainExecutionRisk: "Grill capacity. One standard grill handles 90–120 hot dogs per hour. If you are serving 150+ guests, plan for a second grill or staggered cooking.",
      recommendedFocus: "Stage buns, condiments, and foil pans before doors open. Keep Student Runners restocking stations continuously — a stalled condiment table kills line speed.",
    },
    burgers: {
      bestFit: "Burger fundraisers work well at family events, church potlucks, and school spirit nights where guests expect a satisfying sit-down or casual meal.",
      mainProfitDriver: "A higher suggested donation ($12–$15) is easier to justify for burgers. Guests perceive them as a full meal compared to simpler options.",
      mainExecutionRisk: "Assembly bottleneck. Grilling and building burgers are two separate stations. If the assembly crew can't keep pace with the grill, food backs up and guests wait.",
      recommendedFocus: "Assign a dedicated Assembly Station with pre-staged ingredients. The Grill Master should never touch a bun — handoff to assembly and move on to the next batch.",
    },
    bakedPotatoes: {
      bestFit: "Baked potato dinners work best at sit-down church fundraiser nights, school dinner events, and fall or winter events where a hearty meal feels appropriate.",
      mainProfitDriver: "Potatoes are inexpensive, and a topping bar feels generous to guests without adding much cost. A $10–$12 suggested donation covers costs well.",
      mainExecutionRisk: "Oven timing. Potatoes need 60–75 minutes to bake and cannot be rushed. Running out of finished potatoes mid-event is the leading failure point for this meal.",
      recommendedFocus: "Pre-bake as many potatoes as possible before the event. Have a warm-holding system ready (coolers lined with towels or a low oven at 200°F) before the first guest arrives.",
    },
    breakfastBurritos: {
      bestFit: "Breakfast burritos are popular at morning church events, Saturday school spirit breakfasts, and sports team fundraisers where the crowd arrives early.",
      mainProfitDriver: "A steady assembly line keeps output high. Adding a $1–$2 coffee or juice station dramatically increases per-person revenue with minimal added labor.",
      mainExecutionRisk: "Multi-station coordination. Eggs, sausage, O'Brien potatoes, and assembly must stay in sync. A delay at any one station stalls the entire line.",
      recommendedFocus: "Assemble and wrap one test burrito before service starts to confirm flow. Assign one person per station and do not rotate — speed comes from staying in one role.",
    },
    tacos: {
      bestFit: "Taco fundraisers are broadly popular and work well for churches, schools, sports teams, and community events. A self-serve taco bar is easy to manage and feels festive.",
      mainProfitDriver: "The self-serve taco bar reduces labor and speeds service. Low meat cost per taco and a $10–$12 suggested donation produces a strong profit margin.",
      mainExecutionRisk: "Running out of seasoned meat mid-service. When the meat tray empties and the next batch is not ready, the entire taco bar stalls and guests wait.",
      recommendedFocus: "Always keep a second batch of meat cooking or warm-holding in reserve. Never let the serving tray go below one-quarter full before a replacement is ready.",
    },
    spaghetti: {
      bestFit: "Spaghetti dinners are a classic church and school fundraiser format. They work well for sit-down events with tables, a family-friendly atmosphere, and an organized serving line.",
      mainProfitDriver: "Pasta is one of the least expensive main ingredients at scale. With a $12–$15 suggested donation, a spaghetti dinner can produce a strong profit margin.",
      mainExecutionRisk: "Pasta timing and warm-holding. Overcooked pasta becomes mushy quickly. Running out of sauce while pasta is ready — or vice versa — disrupts the serving line.",
      recommendedFocus: "Designate one person solely to pasta water management. Stagger cooking in 15-minute intervals. Keep sauce at 170°F in a separate roaster — never mix until plating.",
    },
    pancakes: {
      bestFit: "Pancake breakfasts are well-suited to Saturday mornings, pre-game church breakfasts, and community events where a low-cost, family-friendly meal draws a wide crowd.",
      mainProfitDriver: "Pancake ingredients cost very little per serving. Adding sausage links and a coffee or juice option delivers a significant revenue lift with minimal added complexity.",
      mainExecutionRisk: "Griddle capacity. One large electric griddle produces 80–100 pancakes per hour. Underestimating griddle count creates long lines and frustrated guests.",
      recommendedFocus: "Assign dedicated Griddle Operators who never leave their station. Assign batter delivery and syrup restock to Student Runners so operators can focus entirely on cooking.",
    },
    custom: {
      bestFit: "Custom meal estimates are based on general event assumptions. Accuracy depends on your specific recipe, cooking method, and ingredients.",
      mainProfitDriver: "Profit depends on your actual food costs and pricing. Use the cost estimate as a starting point and verify against your recipe quantities.",
      mainExecutionRisk: "The main risk is underestimating prep time or ingredient quantities for a custom menu. Build in extra buffer time and buy 10–15% more than you think you need.",
      recommendedFocus: "Do a practice cook before the event if you have not made this dish at scale. Quantities and timing change significantly when cooking for a large group.",
    },
  };
  return strategies[form.mealType] ?? strategies["custom"]!;
}

function buildProfitStrategy(
  form: PlannerFormData,
  totalCostRange: [number, number],
  estimatedProfit: [number, number],
): ProfitStrategy {
  const org = form.orgType === "Other" ? "your group" : form.orgType;

  // Price check message
  let priceCheck: string;
  if (estimatedProfit[1] < 0) {
    const needed = Math.ceil(totalCostRange[1] / form.attendance) + 2;
    priceCheck = `Your suggested donation of ${fmt$(form.mealPrice)}/person will likely not cover your costs. Consider raising the price to at least ${fmt$(needed)}/person to break even, or look for donated supplies to reduce costs.`;
  } else if (estimatedProfit[0] < 0) {
    priceCheck = `Your price of ${fmt$(form.mealPrice)}/person is workable if attendance meets your goal, but there is little margin for error. Watch supply costs closely and aim to beat your attendance target by 10–15%.`;
  } else if (form.mealPrice < 8) {
    const extra = Math.round((form.mealPrice + 2) * form.attendance - form.mealPrice * form.attendance);
    priceCheck = `Your price of ${fmt$(form.mealPrice)}/person is on the low end for a food fundraiser. Raising the price by $2 per person would add approximately ${fmt$(extra)} to your total at your current attendance goal.`;
  } else {
    priceCheck = `Your suggested donation of ${fmt$(form.mealPrice)}/person is a reasonable amount for this type of event. You are in a solid range — focus on attendance and keeping supply costs tight.`;
  }

  // Upsell ideas per meal type
  const upsellMap: Record<string, string[]> = {
    hotdogs: [
      "Offer a small bag of chips for $1–$2 per guest.",
      "Sell canned soda or bottled water at $1 each.",
      "Add a dessert table (cookies, brownies) for a $1–$2 donation.",
    ],
    burgers: [
      "Bundle chips and a drink as a combo for a higher suggested donation.",
      "Sell brownies, cookies, or dessert for $1–$2 extra.",
      "Offer bottled water or lemonade near the exit.",
    ],
    bakedPotatoes: [
      "Offer a cup of soup as a side for an extra $1–$2 donation.",
      "Sell dessert pie slices for $2–$3 each.",
      "Add coffee or hot cider — ideal for fall and winter events.",
    ],
    breakfastBurritos: [
      "Add a coffee station — even a freewill offering adds $1–$2 per person on average.",
      "Sell orange juice or a bottled drink at $1–$2.",
      "Offer a breakfast pastry or muffin as a side.",
    ],
    tacos: [
      "Sell horchata, agua fresca, or lemonade for $1–$2.",
      "Offer chips and salsa as a $1 side at the table.",
      "Add churros, cookies, or a dessert table for $1–$2.",
    ],
    spaghetti: [
      "Sell dessert — pie, cookies, or brownies — for $2–$3 each.",
      "Offer iced tea or lemonade for $1 per cup.",
      "Consider a silent auction or raffle table to increase total giving beyond the meal.",
    ],
    pancakes: [
      "Add a coffee station — even a freewill offering generates meaningful extra revenue.",
      "Sell orange juice or bottled drinks for $1 each.",
      "Run a raffle or silent auction alongside the breakfast to boost total fundraising.",
    ],
    custom: [
      "Add a drink station — water, lemonade, or coffee — for a $1 suggested donation.",
      "Sell dessert or baked goods to supplement meal revenue.",
      "Consider a raffle or silent auction item alongside the meal.",
    ],
  };

  // Pricing model per org type
  const pricingModelMap: Record<string, string> = {
    "Church": "Suggested Donation works well for church events — it avoids pressure while still generating solid revenue. Place a clearly labeled donation box or basket near the serving line.",
    "School": "Fixed Price is the clearest choice for school events. Pre-sell tickets through teachers or online to confirm attendance numbers and reduce day-of payment hassles.",
    "Sports Team": "Pre-sold tickets work well for sports team fundraisers. Sell tickets at practice in the days before — it confirms your attendance count and speeds up the day-of process.",
    "Nonprofit": "A Suggested Donation model gives guests flexibility. Place a clearly visible donation box near the exit — guests who have just eaten tend to be more generous.",
    "Other": "Choose the model that fits your community: fixed price for simplicity, suggested donation for flexibility, or a basket at the exit.",
  };

  return {
    priceCheck,
    upsellIdeas: upsellMap[form.mealType] ?? upsellMap["custom"]!,
    donationTableNote: "Place the donation table near the exit, not the entrance. Guests who have just eaten tend to give more generously than guests who have not yet eaten. Use a clear sign with your suggested donation amount.",
    signageLines: [
      ...(form.mealPrice > 0 ? [`Suggested Donation: ${fmt$(form.mealPrice)} per person · Kids under 10 eat free`] : []),
      `Every plate supports ${org} — thank you for being here!`,
      ...(form.mealPrice > 0 ? [`Help us reach our goal — ${fmt$(form.attendance * form.mealPrice)} raised means a successful event.`] : []),
    ],
    pricingModel: pricingModelMap[form.orgType] ?? pricingModelMap["Other"]!,
  };
}

function buildVolunteerBriefing(
  mealType: string,
  mealName: string,
  form: PlannerFormData,
  volunteerPlan: VolunteerRole[],
  serveStart: string,
  prepStart: string,
): string {
  const hour = parseInt(serveStart.split(":")[0], 10);
  const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const org = form.orgType === "Other" ? "our group" : form.orgType;

  const flowMap: Record<string, string> = {
    hotdogs: `Guests walk up to the grill station for a hot dog, then move to the bun and condiment station to build their plate. Keep the line moving — aim for under 60 seconds per guest.`,
    burgers: `Guests receive a cooked patty at the grill hand-off point, then move to the assembly station to build their burger with toppings. Assembly Team: keep the line moving and portions consistent.`,
    bakedPotatoes: `Guests receive one hot baked potato at the start of the line, then move through the topping bar to customize their plate. The topping bar is self-serve — one Attendant keeps it stocked and clean.`,
    breakfastBurritos: `Guests move through the assembly line: eggs at the first station, filling at the second, cheese and wrap at the third. Each station adds one component and hands off to the next. Speed at every station matters. Use measuring cups to portion each filling component — this keeps every burrito consistent and prevents running out of filling before tortillas.`,
    tacos: `Guests pick up a plate, select shells or tortillas, then move down the taco bar to add meat and toppings at their own pace. The Meat Station is the most critical — keep it stocked at all times.`,
    spaghetti: `Guests receive a bowl with pasta and sauce at the serving station, then move to the garlic bread and condiment area. Servers should plate pasta and sauce together — do not send guests with plain pasta looking for sauce.`,
    pancakes: `Guests receive hot pancakes fresh from the griddle, then move to the syrup and topping station, then to sausage. The Griddle Operator should never stop — finished pancakes go straight to the pickup station.`,
    custom: `Guests move through your serving line in order. Make sure each station is clearly labeled and has a volunteer assigned to it at all times during service.`,
  };

  const rolesText = volunteerPlan.map(r => `  • ${r.role} (${r.type}): ${r.count} volunteer${r.count !== 1 ? "s" : ""}`).join("\n");

  return `Good ${timeOfDay}, ${form.eventName} team!

Thank you for being here. Today we're raising money for ${org} by serving ${mealName} to ${form.attendance} guests.${form.mealPrice > 0 ? ` Our suggested donation is ${fmt$(form.mealPrice)} per person (cash or card) — every plate helps.` : ""}

YOUR ROLE TODAY
${rolesText}

HOW TODAY WORKS
  • Doors open at ${formatTime(serveStart)}. Guests will move through the serving line in order.
  • ${flowMap[mealType] ?? flowMap["custom"]!}
  • Student Runners: your job is to keep stations stocked. Check napkins, utensils, and condiments every 10–15 minutes. Restock before things run out — not after.
  • Cleanup Team: do not wait until the end to start. Clear and wipe tables during service.
  • Cashier / Donation Table: stay at your station. Only volunteers assigned to cash should handle the donation box or register.

FOOD SAFETY REMINDERS
  • Keep gloves on whenever you are handling food.
  • Hot food stays hot: 140°F or above at all times.
  • Cold food stays cold: 40°F or below at all times.
  • If food has been sitting out for more than 2 hours, check with an adult before serving it.
  • When in doubt — throw it out. No exceptions.

QUESTIONS?
Check with your assigned Adult Volunteer. If you are not sure what to do, ask before acting. Let's make this a great event for ${org}!`.trim();
}

function buildSetupLayout(mealType: string): SetupStation[] {
  const layouts: Record<string, SetupStation[]> = {
    hotdogs: [
      { position: "1", label: "Welcome / Donation Table", detail: "Position near the entrance. Every guest should pass it when arriving." },
      { position: "2", label: "Grill Station", detail: "Outdoor or well-ventilated area. Stage fuel, tongs, and foil pans nearby." },
      { position: "3", label: "Bun & Condiment Station", detail: "Ketchup, mustard, relish, onion, chili, cheese — pre-staged in squeeze bottles and pans." },
      { position: "4", label: "Drink Station", detail: "Water, soda, or juice — keep this separate from the food line to avoid crowding." },
      { position: "5", label: "Seating Area", detail: "Tables set with napkins and any event decorations before guests arrive." },
      { position: "6", label: "Trash & Recycling", detail: "Two labeled bins at or near each exit. Monitor and change bags throughout service." },
    ],
    burgers: [
      { position: "1", label: "Welcome / Donation Table", detail: "Near the entrance. Keep donation visible and clearly signed." },
      { position: "2", label: "Grill Station", detail: "Manage patty output — the Grill Master signals assembly when each batch is done." },
      { position: "3", label: "Assembly Station", detail: "Buns, cheese, lettuce, tomato, onion, condiments — a dedicated crew builds each burger." },
      { position: "4", label: "Pickup / Hand-Off", detail: "Where assembled burgers are placed on trays for the Serving Team to distribute." },
      { position: "5", label: "Drink Station", detail: "Water, soda, or lemonade — separate from the food line." },
      { position: "6", label: "Seating Area", detail: "Set with napkins and utensils before service begins." },
      { position: "7", label: "Trash & Recycling", detail: "Two labeled bins near exits. Student Runners monitor throughout service." },
    ],
    bakedPotatoes: [
      { position: "1", label: "Welcome / Donation Table", detail: "Near the entrance. Keep donation sign clearly visible." },
      { position: "2", label: "Potato Station", detail: "Hot potatoes transferred from oven to warm-holding. One potato per guest." },
      { position: "3", label: "Topping Bar", detail: "Butter, sour cream, fiesta blend cheese, chili, nacho cheese, chives, white onion — each clearly labeled." },
      { position: "4", label: "Drink Station", detail: "Water, coffee, or lemonade — separate from the food line." },
      { position: "5", label: "Seating Area", detail: "Set with forks, napkins, and any event materials in advance." },
      { position: "6", label: "Trash & Recycling", detail: "Two labeled bins near exits." },
    ],
    breakfastBurritos: [
      { position: "1", label: "Welcome / Donation Table", detail: "Near the entrance. Clearly signed with suggested donation amount." },
      { position: "2", label: "Egg & Griddle Station", detail: "Continuous egg scrambling — never let this station sit empty during service." },
      { position: "3", label: "Sausage & Hash Brown Station", detail: "Warm-holding in foil pans. Replenish every 20–30 minutes." },
      { position: "4", label: "Assembly & Wrapping Station", detail: "2–3 people folding and foil-wrapping burritos in sequence." },
      { position: "5", label: "Salsa & Hot Sauce Bar", detail: "Self-serve, clearly labeled. Include mild, medium, and hot options if possible." },
      { position: "6", label: "Drink Station", detail: "Coffee carafes, orange juice pitchers — keep them refilled throughout service." },
      { position: "7", label: "Seating Area", detail: "Set with napkins and any event materials before guests arrive." },
      { position: "8", label: "Trash & Recycling", detail: "Two labeled bins near exits." },
    ],
    tacos: [
      { position: "1", label: "Welcome / Donation Table", detail: "Near the entrance — every guest passes it on the way in." },
      { position: "2", label: "Meat Station", detail: "Seasoned taco meat in a covered serving pan. Replenish before it drops below one-quarter full." },
      { position: "3", label: "Shell & Tortilla Station", detail: "Hard shells in a holder, warm flour tortillas in foil pans." },
      { position: "4", label: "Taco Bar", detail: "Cheese, lettuce, tomato, onion, cilantro, sour cream, salsa, lime, hot sauce — each labeled." },
      { position: "5", label: "Drink Station", detail: "Water, lemonade, or horchata — separate from the taco bar." },
      { position: "6", label: "Seating Area", detail: "Set with extra napkins — tacos are messy!" },
      { position: "7", label: "Trash & Recycling", detail: "Two labeled bins near exits. Cleanup Team monitors continuously." },
    ],
    spaghetti: [
      { position: "1", label: "Welcome / Donation Table", detail: "Near the entrance. Clearly signed with event name and suggested donation." },
      { position: "2", label: "Pasta Station", detail: "Pasta served from electric roaster — one portion per bowl, consistent scoops." },
      { position: "3", label: "Sauce Station", detail: "Meat sauce ladled over pasta. Keep sauce at 170°F and stir frequently." },
      { position: "4", label: "Garlic Bread Station", detail: "Pre-sliced, in foil pans — keep warm in a low oven until service begins." },
      { position: "5", label: "Parmesan & Condiment Bar", detail: "Self-serve shakers of parmesan, red pepper flakes, and any other condiments." },
      { position: "6", label: "Drink Station", detail: "Lemonade, iced tea, or water — separate from the serving line." },
      { position: "7", label: "Seating Area", detail: "Set with forks, napkins, and bowls before guests arrive." },
      { position: "8", label: "Trash & Recycling", detail: "Two labeled bins near exits." },
    ],
    pancakes: [
      { position: "1", label: "Welcome / Donation Table", detail: "Near the entrance. Sign clearly displays the suggested donation amount." },
      { position: "2", label: "Griddle Station", detail: "Continuous operation — the Griddle Operator never stops during service." },
      { position: "3", label: "Pancake Pickup", detail: "Finished pancakes plated immediately as they come off the griddle." },
      { position: "4", label: "Syrup, Butter & Toppings Bar", detail: "Maple syrup, butter, whipped topping, powdered sugar — self-serve." },
      { position: "5", label: "Sausage Station", detail: "Pre-cooked sausage links in warm-holding foil pan. Serve with tongs." },
      { position: "6", label: "Drink Station", detail: "Coffee carafes and orange juice pitchers. Keep refilled throughout." },
      { position: "7", label: "Seating Area", detail: "Set with forks, napkins, and syrup at each table before guests arrive." },
      { position: "8", label: "Trash & Recycling", detail: "Two labeled bins near exits." },
    ],
    custom: [
      { position: "1", label: "Welcome / Donation Table", detail: "Near the entrance so every guest sees it when arriving." },
      { position: "2", label: "Main Cooking / Prep Station", detail: "Your primary food prep area. Label it clearly and keep it staffed at all times." },
      { position: "3", label: "Serving Station", detail: "Where guests receive their food. Keep portions consistent and the line moving." },
      { position: "4", label: "Condiment / Extras Station", detail: "Any sauces, toppings, or sides guests can add. Clearly label each item." },
      { position: "5", label: "Drink Station", detail: "Water, lemonade, or other beverages — separate from the food line." },
      { position: "6", label: "Seating Area", detail: "Set with napkins and utensils before guests arrive." },
      { position: "7", label: "Trash & Recycling", detail: "Two labeled bins near exits. Monitor throughout service." },
    ],
  };
  return layouts[mealType] ?? layouts["custom"]!;
}

function buildLeftoverPlan(mealType: string): LeftoverPlan {
  const plans: Record<string, LeftoverPlan> = {
    hotdogs: {
      canSave: [
        "Unopened hot dog packages (refrigerate, use within 5 days)",
        "Sealed bun packages (room temp, use within 2–3 days)",
        "Sealed condiment bottles (store per label instructions)",
      ],
      discard: [
        "Any cooked hot dogs held at room temperature for more than 2 hours",
        "Opened buns that have been sitting out and are stale or moist",
        "Chili or cheese topping held unrefrigerated for more than 2 hours",
      ],
      packaging: "Return uncooked hot dogs to their original sealed packaging and refrigerate immediately. Label with today's date.",
      whoDecides: "The Adult Volunteer who managed the grill station makes all leftover calls.",
    },
    burgers: {
      canSave: [
        "Raw uncooked ground beef — refrigerate immediately, use within 1–2 days",
        "Sealed bun packages (room temp, use within 2–3 days)",
        "Sealed condiment bottles and sealed produce (refrigerate)",
      ],
      discard: [
        "Any cooked patties that have been out for more than 2 hours",
        "Opened tomato, lettuce, or onion that has been sitting out for more than 2 hours",
        "Any patty that smells off or was not kept at proper temperature",
      ],
      packaging: "Wrap raw ground beef tightly, refrigerate same day. Seal and store unused buns at room temperature.",
      whoDecides: "The Adult Volunteer at the grill makes all final leftover decisions.",
    },
    bakedPotatoes: {
      canSave: [
        "Uncut baked potatoes — wrap each in foil, refrigerate, good for 3–5 days",
        "Unopened sour cream and butter containers (refrigerate)",
        "Sealed cheese bags and unused dry toppings",
      ],
      discard: [
        "Potatoes that were cut open but not served",
        "Sour cream, butter, fiesta blend cheese, or nacho cheese that sat out for more than 2 hours",
        "Any dairy product that smells or looks off",
      ],
      packaging: "Wrap each unserved uncut potato in foil and label with the date. Transfer opened sour cream and cheese to sealed containers and refrigerate immediately.",
      whoDecides: "The Adult Volunteer at the topping bar makes all leftover calls.",
    },
    breakfastBurritos: {
      canSave: [
        "Foil-wrapped assembled burritos — refrigerate immediately, reheat to 165°F before eating, good for 1 day",
        "Sealed salsa jars (refrigerate after opening)",
        "Unopened cheese bags (refrigerate)",
        "Sealed uncooked sausage in original packaging (refrigerate)",
      ],
      discard: [
        "Scrambled eggs held at room temperature for more than 2 hours (serious food safety risk)",
        "Any burrito that cannot be confirmed refrigerated within 2 hours of cooking",
        "Cooked O'Brien potatoes held unrefrigerated for more than 2 hours",
      ],
      packaging: "Label each foil-wrapped burrito with the date and contents. Refrigerate immediately after service — these are great reheated the next morning.",
      whoDecides: "The Adult Volunteer at the egg and griddle station has final authority on food safety calls.",
    },
    tacos: {
      canSave: [
        "Leftover cooked taco meat — transfer to sealed container, refrigerate, use within 2–3 days",
        "Sealed seasoning packets and unopened shells or tortillas",
        "Sealed cheese, sour cream, and salsa jars (refrigerate opened containers)",
      ],
      discard: [
        "Cooked seasoned meat held at room temperature for more than 2 hours",
        "Shredded lettuce or diced tomato that has wilted or been out for more than 2 hours",
        "Any topping that smells off or was improperly held",
      ],
      packaging: "Transfer leftover taco meat to a sealed storage container and refrigerate within 30 minutes of service ending. Use within 2–3 days — excellent for tacos, nachos, or burritos.",
      whoDecides: "The Adult Volunteer at the meat station makes all food safety decisions.",
    },
    spaghetti: {
      canSave: [
        "Leftover meat sauce — refrigerate immediately, good for 3–4 days, or freeze for up to 3 months",
        "Cooked pasta tossed with a small amount of olive oil — refrigerate, good for 3–5 days",
        "Sealed garlic bread packages and uncooked pasta boxes",
      ],
      discard: [
        "Pasta or sauce held for more than 2 hours without proper temperature control",
        "Dressed salad that has wilted or been out too long",
        "Do not mix leftover pasta and sauce — store them separately",
      ],
      packaging: "Transfer pasta and sauce into separate labeled sealed containers. To reheat: warm sauce to 165°F in a pot; reheat pasta separately in boiling water or microwave with a splash of water.",
      whoDecides: "The Adult Volunteer at the pasta station is responsible for leftover storage decisions.",
    },
    pancakes: {
      canSave: [
        "Remaining dry pancake mix in a sealed bag (room temp, use by package date)",
        "Sealed maple syrup bottles (room temp)",
        "Mixed batter in a sealed container (refrigerate, use within 24 hours)",
        "Uncooked sausage links in sealed packaging (refrigerate)",
      ],
      discard: [
        "Cooked pancakes that have been sitting out for more than 2 hours",
        "Cooked sausage links held out for more than 2 hours",
        "Any mixed batter left unrefrigerated for more than 2 hours",
      ],
      packaging: "Pour unused batter into a sealed container, label with the date, and refrigerate. It is good for the next morning. Label remaining dry mix with the date it was opened.",
      whoDecides: "The Adult Volunteer at the griddle station has final authority on what gets saved versus discarded.",
    },
    custom: {
      canSave: [
        "Sealed, unopened ingredients stored per their package instructions",
        "Cooked food refrigerated within 2 hours (suitable for next-day use)",
      ],
      discard: [
        "Any cooked food held at room temperature for more than 2 hours without proper temperature control",
        "Food that smells, looks, or feels questionable — when in doubt, throw it out",
      ],
      packaging: "Transfer leftover cooked food to labeled sealed containers and refrigerate immediately after service ends. Label with the date.",
      whoDecides: "The Adult Volunteer who managed cooking makes all final food safety decisions.",
    },
  };
  return plans[mealType] ?? plans["custom"]!;
}

function buildCommsPack(
  mealName: string,
  form: PlannerFormData,
  volunteerPlan: VolunteerRole[],
  serveStart: string,
  serveEnd: string,
  prepStart: string,
): CommsPack {
  const org = form.orgType === "Other" ? "our group" : form.orgType;
  const rolesText = volunteerPlan.map(r => `  • ${r.role} (${r.type}) — ${r.count} needed`).join("\n");

  const announcementDonationLine = form.mealPrice > 0
    ? `  Suggested Donation: ${fmt$(form.mealPrice)} per person (cash or card)`
    : "";
  const announcement = `${form.eventName}
A Fundraiser for ${org}

Join us for our ${mealName} fundraiser! This is a great opportunity to support ${org} while enjoying a delicious meal with your community.

  When: ${formatTime(serveStart)} – ${formatTime(serveEnd)}
${announcementDonationLine ? announcementDonationLine + "\n" : ""}  We're expecting ${form.attendance} guests.

Come out, eat well, and help us reach our goal. Every plate makes a difference.

See you there!
— The ${form.eventName} Team`.trim();

  const volunteerRequest = `Hi everyone,

We need volunteers to help make ${form.eventName} a success!

We're looking for adults and students to help with cooking, serving, setup, and cleanup. If you can help out, please plan to arrive by ${formatTime(prepStart)}.

Roles we need to fill:
${rolesText}

Reply to this message or contact your group leader to sign up. Every hand matters!

Thank you for supporting ${org}!`.trim();

  const dayBeforeDonationLine = form.mealPrice > 0
    ? ` and a suggested donation of ${fmt$(form.mealPrice)} per person`
    : "";
  const dayBeforeReminder = `Quick reminder: ${form.eventName} is TOMORROW!

If you're VOLUNTEERING: please arrive by ${formatTime(prepStart)} ready to help set up and prep.
If you're ATTENDING: doors open at ${formatTime(serveStart)}.

What to bring: your appetite${dayBeforeDonationLine}.

We're looking forward to a great event — see you there!
— The ${form.eventName} Team`.trim();

  const thankYou = `Thank you from ${form.eventName}!

Our ${mealName} fundraiser is a wrap — and it was a success thanks to you.

Whether you cooked, served, cleaned up, donated, or simply showed up and supported us — your contribution makes a real difference for ${org}.

We are grateful for this community. Stay tuned for more updates!

— The ${form.eventName} Team`.trim();

  return { announcement, volunteerRequest, dayBeforeReminder, thankYou };
}

function buildShoppingListGrouped(shoppingList: ShoppingItem[]): ShoppingGroup[] {
  // When any item carries a tier, use three-tier display (essential → recommended → optional).
  // Items without a tier (cooking-only) are placed in a leading "Cooking Ingredients" group.
  const hasTiers = shoppingList.some(item => item.tier !== undefined);

  if (hasTiers) {
    const TIER_CONFIG: Array<{ key: ShoppingItem["tier"]; label: string; description: string }> = [
      { key: "essential",    label: "ESSENTIAL",    description: "You need these to run your event" },
      { key: "recommended",  label: "RECOMMENDED",  description: "These make your event better and guests expect them" },
      { key: "optional",     label: "OPTIONAL",     description: "Nice to have but adds to your cost" },
    ];

    const buckets: Record<string, ShoppingItem[]> = {
      essential: [], recommended: [], optional: [], untiered: [],
    };
    for (const item of shoppingList) {
      if (item.tier) {
        buckets[item.tier].push(item);
      } else {
        buckets.untiered.push(item);
      }
    }

    const result: ShoppingGroup[] = [];
    if (buckets.untiered.length > 0) {
      result.push({ label: "Cooking Ingredients", items: buckets.untiered });
    }
    for (const { key, label, description } of TIER_CONFIG) {
      result.push({ label, items: buckets[key!] ?? [], description });
    }
    return result;
  }

  // Default: category-based grouping
  const LABEL_MAP: Record<string, string> = {
    protein: "Proteins & Main Items",
    carb: "Bread, Grains & Tortillas",
    dairy: "Dairy",
    produce: "Produce",
    condiment: "Toppings & Condiments",
    other: "Drinks & Other Items",
  };
  const ORDER = ["protein", "carb", "dairy", "produce", "condiment", "other"];

  const groups: Record<string, ShoppingItem[]> = {};
  for (const item of shoppingList) {
    const key = item.category ?? "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return ORDER
    .filter(k => (groups[k]?.length ?? 0) > 0)
    .map(k => ({ label: LABEL_MAP[k] ?? k, items: groups[k] }));
}

// ── Custom menu ingredient generator (Tier 2 meals) ──────────
function buildCustomMenuIngredients(form: PlannerFormData): IngredientDef[] {
  const ingredients: IngredientDef[] = [];
  const sides = form.customMenuSides ?? [];
  const drinks = form.customMenuDrinks ?? [];
  const desserts = form.customMenuDesserts ?? [];

  // Sides — estimated per person (adultServings=1, so perServing ≈ per person)
  if (sides.includes("rolls")) {
    ingredients.push({ name: "Dinner Rolls (bag of 12)", perServing: 0.1, unit: "bag", packageSize: 1, packageUnit: "bag of 12", costPerPackage: [3.00, 5.50], category: "carb" });
  }
  if (sides.includes("chips")) {
    ingredients.push({ name: "Potato Chips (2-lb bulk bag)", perServing: 0.047, unit: "bag", packageSize: 1, packageUnit: "2-lb bag", costPerPackage: [5.00, 9.00], category: "other" });
  }
  if (sides.includes("salad")) {
    ingredients.push({ name: "Salad Mix (16-oz bag — 4 servings)", perServing: 0.25, unit: "bag", packageSize: 1, packageUnit: "16-oz bag", costPerPackage: [3.50, 6.00], category: "produce" });
  }
  if (sides.includes("mac")) {
    ingredients.push({ name: "Mac & Cheese (box — 3 servings)", perServing: 0.34, unit: "box", packageSize: 1, packageUnit: "box", costPerPackage: [1.50, 3.00], category: "other" });
  }
  if (sides.includes("coleslaw")) {
    ingredients.push({ name: "Coleslaw Mix (14-oz bag)", perServing: 0.07, unit: "bag", packageSize: 1, packageUnit: "14-oz bag", costPerPackage: [2.50, 4.50], category: "produce" });
  }
  // Drinks
  if (drinks.includes("water")) {
    ingredients.push({ name: "Water Bottles (24-pack, 16.9 oz)", perServing: 0.042, unit: "case", packageSize: 1, packageUnit: "24-pack case", costPerPackage: [4.00, 8.00], category: "other" });
  }
  if (drinks.includes("lemonade")) {
    ingredients.push({ name: "Lemonade Mix (canister — makes 2 gallons, ~32 servings)", perServing: 0.031, unit: "canister", packageSize: 1, packageUnit: "canister", costPerPackage: [3.00, 6.00], category: "other" });
  }
  if (drinks.includes("coffee")) {
    ingredients.push({ name: "Ground Coffee (1-lb can — ~60 cups)", perServing: 0.017, unit: "can", packageSize: 1, packageUnit: "1-lb can", costPerPackage: [8.00, 16.00], category: "other" });
  }
  if (drinks.includes("soda")) {
    ingredients.push({ name: "Soda (2-liter bottles — assorted, ~6 servings each)", perServing: 0.18, unit: "bottle", packageSize: 1, packageUnit: "2-liter bottle", costPerPackage: [1.75, 3.00], category: "other" });
  }
  // Desserts
  if (desserts.includes("cookies")) {
    ingredients.push({ name: "Cookies (30-count variety pack)", perServing: 0.067, unit: "pack", packageSize: 1, packageUnit: "30-count pack", costPerPackage: [8.00, 15.00], category: "other" });
  }
  if (desserts.includes("brownies")) {
    ingredients.push({ name: "Brownie Mix (box — 24 brownies)", perServing: 0.042, unit: "box", packageSize: 1, packageUnit: "box", costPerPackage: [2.50, 5.00], category: "other" });
  }
  if (desserts.includes("cake")) {
    ingredients.push({ name: "Sheet Cake (9×13 — serves 24)", perServing: 0.042, unit: "cake", packageSize: 1, packageUnit: "9×13 sheet cake", costPerPackage: [12.00, 22.00], category: "other" });
  }

  return ingredients;
}

// ── Ingredient calculator (module-level — fixes combo closure bug) ──────────
// IMPORTANT: This function MUST remain at module scope, not nested inside
// calculatePlan. Nesting it causes a subtle closure/hoisting issue in Vite
// ES module strict mode where combo branch returns empty ingredient arrays.
function computeIngredientResults(
  component: MealAssumption,
  guestCount: number,
  excludedItems?: string[],
  customItemPrices?: Record<string, number>,
): {
  foodQuantities: FundraiserPlan["foodQuantities"];
  shoppingItems: ShoppingItem[];
  cost: [number, number];
} {
  const servings = Math.ceil(guestCount * component.adultServings);
  const activeIngredients = component.ingredients.filter(
    (ing) => !excludedItems?.includes(ing.name)
  );

  let cost: [number, number] = [0, 0];
  const foodQuantities: FundraiserPlan["foodQuantities"] = [];
  const shoppingItems: ShoppingItem[] = [];

  for (const ing of activeIngredients) {
    // FIX 2: Apply usage rate — not every guest uses every topping/condiment
    const effectivePerServing = ing.perServing * (ing.usageRate ?? 1.0);
    const rawTotal = servings * effectivePerServing;
    const packages = ceilToPackage(rawTotal, ing.packageSize);
    const totalUnits = packages * ing.packageSize;

    // FIX 5: Use custom price if user entered one, otherwise use default range
    const costRange: [number, number] = customItemPrices?.[ing.name] !== undefined
      ? [customItemPrices[ing.name], customItemPrices[ing.name]]
      : ing.costPerPackage;
    const itemCost: [number, number] = [
      packages * costRange[0],
      packages * costRange[1],
    ];
    cost = rangeAdd(cost, itemCost);

    const neededCount = Math.ceil(rawTotal);
    const neededDisplay = `${neededCount} ${ing.unit}${neededCount === 1 ? "" : "s"} needed`;

    const usageNote = (ing.usageRate !== undefined && ing.usageRate < 1.0)
      ? `~${Math.round(ing.usageRate * 100)}% of guests typically use this`
      : undefined;
    const cookingNote = ing.cookingOnly
      ? "Cooking ingredient — calculated by batch, not per guest"
      : undefined;
    const note = cookingNote ?? usageNote ?? (ing.category === "condiment" ? "Estimate — adjust for your crowd" : undefined);

    foodQuantities.push({
      ingredient: ing.name,
      quantity: neededDisplay,
      notes: note,
    });
    shoppingItems.push({
      item: ing.name,
      quantity: neededDisplay,
      estimatedCost: itemCost,
      notes: cookingNote ?? usageNote ?? (ing.category === "condiment" ? "May have leftovers — saves money at your next event" : undefined),
      category: ing.category,
      tier: ing.tier,
    });
  }

  return { foodQuantities, shoppingItems, cost };
}

// ── Three-Scenario Revenue Calculator ────────────────────────
// Computes Conservative / Baseline / Optimistic revenue scenarios.
// For "split" (tiered) pricing: uses 4-group demographic math.
// For "flat" pricing: uses attendance × price × conversionRate.
function computeRevenueScenarios(
  form: PlannerFormData,
  costRange: [number, number],
): {
  conservative: import("./types").RevenueScenario;
  baseline:     import("./types").RevenueScenario;
  optimistic:   import("./types").RevenueScenario;
} {
  const baseDonationRate = Math.max(50, Math.min(95, form.donationRate ?? 75)) / 100;
  const conservativeRate = Math.max(0.50, baseDonationRate - 0.10);
  const optimisticRate   = Math.min(0.95, baseDonationRate + 0.10);

  const computeGrossRevenue = (convRate: number): number => {
    if (form.pricingModel === "split") {
      const att      = form.attendance;
      const soloPct  = (form.soloAdultPct  ?? 22) / 100;
      const cplPct   = (form.couplesPct    ?? 25) / 100;
      const famPct   = (form.familiesPct   ?? 45) / 100;
      const teenPct  = (form.teensPct      ??  8) / 100;
      const famSize  = Math.max(2, form.avgFamilySize ?? 3.75);
      const famAdopt = (form.familyPriceAdoptionRate ?? 80) / 100;
      const indPrice = form.individualPrice ?? form.mealPrice;
      const famPrice = form.familyPrice    ?? (form.mealPrice * Math.round(famSize));

      // Paying units per group
      const soloConv   = att * soloPct * convRate;
      const coupleConv = (att * cplPct  / 2)       * convRate;
      const famConv    = (att * famPct  / famSize)  * convRate;
      const teenConv   = (att * teenPct / 1.5)      * convRate * 0.73;

      const soloRev   = soloConv   * indPrice;
      const coupleRev = coupleConv * indPrice * 2;
      const famRev    = famConv    * famAdopt * famPrice
                      + famConv    * (1 - famAdopt) * indPrice * famSize;
      const teenRev   = teenConv   * indPrice;
      return Math.round(soloRev + coupleRev + famRev + teenRev);
    } else {
      return Math.round(form.attendance * form.mealPrice * convRate);
    }
  };

  const makeScenario = (
    label: string,
    convRate: number,
  ): import("./types").RevenueScenario => {
    const grossRevenue    = computeGrossRevenue(convRate);
    const netProfitRange: [number, number] = [
      grossRevenue - costRange[1],
      grossRevenue - costRange[0],
    ];
    const revenuePerAttendee = form.attendance > 0
      ? Math.round((grossRevenue / form.attendance) * 100) / 100
      : 0;
    const breakEvenAttendance = revenuePerAttendee > 0
      ? Math.ceil(costRange[1] / revenuePerAttendee)
      : 9999;
    return {
      label,
      conversionRate: Math.round(convRate * 100),
      grossRevenue,
      costRange,
      netProfitRange,
      revenuePerAttendee,
      breakEvenAttendance,
    };
  };

  return {
    conservative: makeScenario("Conservative", conservativeRate),
    baseline:     makeScenario("Baseline",     baseDonationRate),
    optimistic:   makeScenario("Optimistic",   optimisticRate),
  };
}

// ── Meal emoji lookup ─────────────────────────────────────────
const MEAL_EMOJIS: Record<string, string> = {
  hotdogs: "🌭",
  burgers: "🍔",
  bakedPotatoes: "🥔",
  breakfastBurritos: "🌯",
  tacos: "🌮",
  walkingTacos: "🌮",
  spaghetti: "🍝",
  pancakes: "🥞",
  custom: "🍽️",
};

// ── Multi-meal calculator (2 independent meals, shared supplies) ──
function calculateMultiMealPlan(rawForm: PlannerFormData): FundraiserPlan {
  const primaryMeal = (rawForm.selectedMeals?.[0] ?? rawForm.mealType) as MealType;
  const totalGuests = Math.max(1, rawForm.totalExpectedGuests ?? rawForm.attendance);

  // Base plan: primary meal + totalGuests → provides timeline, volunteer plan, risk warnings, revenue
  const basePlan = calculatePlan({
    ...rawForm,
    mealType: primaryMeal,
    attendance: totalGuests,
    selectedMeals: undefined, // prevent recursion
  });

  // Per-meal shopping sections (each uses its own independent serving count)
  const multiMealSections: MultiMealSection[] = (rawForm.selectedMeals ?? [primaryMeal]).map((mealType) => {
    const servings = Math.max(1, rawForm.mealServings?.[mealType] ?? totalGuests);
    const mealAssumption = MEAL_ASSUMPTIONS[mealType as MealType] ?? MEAL_ASSUMPTIONS["custom"]!;
    const r = computeIngredientResults(
      mealAssumption,
      servings,
      rawForm.excludedItems,
      rawForm.customItemPrices,
    );
    return {
      mealType,
      label: mealAssumption.displayName,
      emoji: MEAL_EMOJIS[mealType] ?? "🍽️",
      servings,
      shoppingList: r.shoppingItems,
      shoppingListGrouped: buildShoppingListGrouped(r.shoppingItems),
      costRange: r.cost,
    };
  });

  // Merge all shopping items for the preview table
  const combinedShoppingList = multiMealSections.flatMap((s) => s.shoppingList);

  return {
    ...basePlan,
    multiMealSections,
    sharedSuppliesList: basePlan.suppliesList, // supplies calculated off totalGuests
    shoppingList: combinedShoppingList,
    shoppingListGrouped: buildShoppingListGrouped(combinedShoppingList),
  };
}

// ── Main Calculator ───────────────────────────────────────────

export function calculatePlan(rawForm: PlannerFormData): FundraiserPlan {
  // ── Multi-meal shortcut ──────────────────────────────────────
  if (rawForm.selectedMeals && rawForm.selectedMeals.length >= 2 && rawForm.mealServings) {
    return calculateMultiMealPlan(rawForm);
  }
  // ── Input sanitization ──────────────────────────────────────
  // Guard against NaN, 0, or out-of-range values that can reach the
  // calculator via localStorage restore or edge-case form state.
  const form: PlannerFormData = {
    ...rawForm,
    attendance: Math.max(1, Math.round(Number(rawForm.attendance) || 1)),
    mealPrice: Math.max(0, Number(rawForm.mealPrice) || 0),
    adultPercent: Math.max(0, Math.min(100, Number(rawForm.adultPercent) || 0)),
    kidPercent: Math.max(0, Math.min(100, Number(rawForm.kidPercent) || 0)),
    adultVolunteers: Math.max(0, Math.round(Number(rawForm.adultVolunteers) || 0)),
    studentVolunteers: Math.max(0, Math.round(Number(rawForm.studentVolunteers) || 0)),
    eventName: rawForm.eventName?.trim() || "Untitled Event",
    mealType: rawForm.mealType || "custom",
    prepStartTime: rawForm.prepStartTime || "10:00",
    serveStartTime: rawForm.serveStartTime || "12:00",
    serveEndTime: rawForm.serveEndTime || "14:00",
  };

  const mealMeta = MEAL_ASSUMPTIONS[form.mealType] ?? MEAL_ASSUMPTIONS["custom"]!;
  const combo = isComboMeal(form.mealType) ? (COMBO_DEFINITIONS[form.mealType] ?? null) : null;
  // meal is used for display metadata (displayName, cookingComplexity)
  const meal = mealMeta;

  const adults = Math.round(form.attendance * (form.adultPercent / 100));
  const kids = form.attendance - adults;
  const kidPercent = form.attendance > 0 ? Math.round((kids / form.attendance) * 100) : 0;

  // ── Food Quantities + Shopping List ───────────────────────
  let totalCostRange: [number, number] = [0, 0];
  let foodQuantities: FundraiserPlan["foodQuantities"] = [];
  let shoppingList: ShoppingItem[] = [];

  if (combo) {
    // Combo: compute each component independently and merge
    for (const component of combo.components) {
      const r = computeIngredientResults(applyStorePackageOverrides(component, form.storePreference), form.attendance, form.excludedItems, form.customItemPrices);
      foodQuantities = foodQuantities.concat(r.foodQuantities);
      shoppingList = shoppingList.concat(r.shoppingItems);
      totalCostRange = rangeAdd(totalCostRange, r.cost);
    }
  } else if (form.mealType === "custom") {
    // Tier 2 custom: generate shopping list from menu details if provided
    const customIngredients = buildCustomMenuIngredients(form);
    const r = computeIngredientResults({
      ...applyStorePackageOverrides(meal, form.storePreference),
      ingredients: customIngredients,
    }, form.attendance, form.excludedItems, form.customItemPrices);
    foodQuantities = r.foodQuantities;
    shoppingList = r.shoppingItems;
    totalCostRange = rangeAdd(totalCostRange, r.cost);
  } else {
    const r = computeIngredientResults(applyStorePackageOverrides(meal, form.storePreference), form.attendance, form.excludedItems, form.customItemPrices);
    foodQuantities = r.foodQuantities;
    shoppingList = r.shoppingItems;
    totalCostRange = rangeAdd(totalCostRange, r.cost);
  }

  // ── Supplies List ──────────────────────────────────────────
  // For combos: use the first component's supplies (avoids duplication of plates/napkins)
  const supplySource = combo ? (combo.components[0]) : meal;
  const seenSupplyNames = new Set<string>();
  const suppliesList: SupplyItem[] = supplySource.supplies
    .filter((sup) => {
      // FIX 4: Respect user's item selections from CustomizeMenuPage
      if (form.excludedItems?.includes(sup.name)) return false;
      if (seenSupplyNames.has(sup.name)) return false;
      seenSupplyNames.add(sup.name);
      return true;
    })
    .map((sup) => {
      const rawTotal = form.attendance * sup.perPerson;
      const quantity = Math.ceil(rawTotal);
      // FIX 5: Use custom price if user entered one
      const supCost: [number, number] = form.customItemPrices?.[sup.name] !== undefined
        ? [form.customItemPrices[sup.name], form.customItemPrices[sup.name]]
        : sup.costPerPackage;
      const packageCount = sup.packageSize > 0 ? ceilToPackage(rawTotal, sup.packageSize) : 0;
      const itemCost: [number, number] = packageCount > 0
        ? [packageCount * supCost[0], packageCount * supCost[1]]
        : [0, 0];
      totalCostRange = rangeAdd(totalCostRange, itemCost);
      return { item: sup.name, quantity: `${quantity}`, estimatedCost: itemCost };
    });

  // ── Drinks List ───────────────────────────────────────────
  const morningMealTypes = new Set<string>(["pancakes", "breakfastBurritos", "combo_pancakes_sausage"]);
  const mealTimeCategory: "morning" | "midday" = morningMealTypes.has(form.mealType) ? "morning" : "midday";
  const drinksList: DrinkItem[] = drinkAssumptions
    .filter(d => d.mealTime === "universal" || d.mealTime === mealTimeCategory)
    .map(d => {
      const qty = Math.ceil(form.attendance * d.perServing);
      return { item: d.name, quantity: `${qty} ${d.unit}${qty !== 1 ? "s" : ""}` };
    });

  // Add a misc contingency buffer (5%)
  totalCostRange = [
    Math.round(totalCostRange[0] * 1.05),
    Math.round(totalCostRange[1] * 1.05),
  ];

  // ── Sam's Club store note ─────────────────────────────────
  if (form.storePreference === "Sam's Club") {
    shoppingList = shoppingList.map(item => ({
      ...item,
      notes: item.notes
        ? `${item.notes} · Sam's Club pricing is comparable to Costco for bulk items — verify locally.`
        : "Sam's Club pricing is comparable to Costco for most bulk items — verify locally before shopping.",
    }));
  }

  // ── Revenue & Profit ─────────────────────────────────────
  const revenueScenarios = computeRevenueScenarios(form, totalCostRange);
  let estimatedRevenue: number;
  let revenueConservative: number | undefined;
  let revenueGenerous: number | undefined;

  if (form.pricingModel === "split") {
    revenueConservative = revenueScenarios.conservative.grossRevenue;
    estimatedRevenue    = revenueScenarios.baseline.grossRevenue;
    revenueGenerous     = revenueScenarios.optimistic.grossRevenue;
  } else {
    estimatedRevenue = revenueScenarios.baseline.grossRevenue;
  }

  const estimatedProfit: [number, number] = [
    estimatedRevenue - totalCostRange[1],
    estimatedRevenue - totalCostRange[0],
  ];

  // ── Pricing Methodology Note (Part 5) ────────────────────
  const pricingMethodologyNote =
    form.storePreference === "Sam's Club"
      ? "Prices benchmarked against Sam's Club / Costco bulk pricing. Prices were cross-referenced with in-store pricing in Whittier, California. Prices vary by region, season, and availability — always verify before shopping."
      : "Prices benchmarked against Costco and Smart & Final bulk pricing, cross-referenced with in-store pricing in Whittier, California. Prices vary by region, season, and store — always verify before shopping. Walmart and Aldi prices are estimated 8–15% lower than the ranges shown.";

  // ── Prep Timeline ─────────────────────────────────────────
  const prepStart = form.prepStartTime || "09:00";
  const serveStart = form.serveStartTime || "12:00";
  const serveEnd = form.serveEndTime || "14:00";
  const serveDuration = minutesBetween(serveStart, serveEnd);
  const prepMins = minutesBetween(prepStart, serveStart);

  const prepTimeline: PrepStep[] = [
    {
      time: formatTime(prepStart),
      task: "Volunteer arrival & venue setup — tables, chairs, signage, stations",
      who: "Adult Volunteer",
      duration: "30 min",
      leaderNote: "Do a quick station walkthrough with all volunteers before anything else. Everyone should know their role before setup begins.",
      watchOut: "Volunteers arriving late can cascade into a rushed kitchen. Set a firm arrival time and follow up the day before.",
    },
    {
      time: formatTime(addMinutes(prepStart, 30)),
      task: `Unpack and stage all ingredients and supplies — ${meal.displayName} station layout`,
      who: "Adult Volunteer",
      duration: "20 min",
      leaderNote: "Stage each station completely before moving to the next one. A half-staged condiment station will cause confusion during service.",
      watchOut: "Do not start cooking until all supply stations are staged. Cooking before stations are set up leads to food sitting out while guests wait.",
    },
    {
      time: formatTime(addMinutes(prepStart, 50)),
      task: `Begin cooking and prep — ${meal.prepNotes}`,
      who: "Parent Oversight",
      duration: `${Math.max(0, prepMins - 65)} min`,
      leaderNote: "Assign one adult to track cooking progress and communicate expected readiness to the Serving Team.",
      watchOut: "Do not let the first batch of food sit out for more than 30 minutes before service opens. Stagger batches to stay fresh.",
    },
    {
      time: formatTime(addMinutes(serveStart, -15)),
      task: "Final readiness check — food temperatures verified, supply stations fully stocked, serving line staged",
      who: "Adult Volunteer",
      duration: "15 min",
      leaderNote: "Use a quick verbal check: ask each station lead 'Are you ready?' before opening doors. Fix any gaps before the first guest arrives.",
      watchOut: "Opening doors before you are fully ready is the most common cause of a chaotic start. Hold the line until you are confident.",
    },
    {
      time: formatTime(serveStart),
      task: `Doors open — begin serving. ${meal.cookNote}`,
      who: "All Volunteers",
      duration: `${serveDuration} min`,
      leaderNote: "Position yourself where you can see the full serving line. Your job during service is to spot bottlenecks and fix them before they cause a backup.",
      watchOut: "The first 15 minutes of service set the tone for the whole event. If the line slows, identify the bottleneck and redirect a volunteer immediately.",
    },
    {
      time: formatTime(addMinutes(serveStart, Math.floor(serveDuration / 2))),
      task: "Mid-service check: restock supplies, replenish food, empty trash, briefly check in with team",
      who: "Student Runner",
      duration: "10 min",
      leaderNote: "Walk every station during this check. Ask each volunteer what they need. Do not rely on volunteers to speak up on their own.",
      watchOut: "Mid-service is when food supplies tend to run low. If you are near the bottom on any main ingredient, start the next batch or warm-holding unit now.",
    },
    {
      time: formatTime(serveEnd),
      task: "Service ends — announce close to guests, begin breakdown and cleanup",
      who: "All Volunteers",
      duration: "30–45 min",
      leaderNote: "Give guests a 10-minute and 5-minute verbal warning before close. This avoids people rushing the line at the last minute.",
      watchOut: "Do not discard any food until an adult has assessed what can be safely stored. See the Leftover Plan for guidance.",
    },
    {
      time: formatTime(addMinutes(serveEnd, 30)),
      task: "Leftover food stored safely, venue cleaned, borrowed equipment returned or packed",
      who: "Adult Volunteer",
      duration: "15–30 min",
      leaderNote: "Walk the full venue after cleanup to check for forgotten equipment, trash, and personal items. Leave the space better than you found it.",
      watchOut: "Return any borrowed items (roasters, tables, extension cords) the same day. Lost equipment creates friction with future venues and partners.",
    },
  ];

  // ── Volunteer Plan ────────────────────────────────────────
  const volunteerPlan: VolunteerRole[] = buildVolunteerPlan(form, meal.cookingComplexity);

  // ── Risk Warnings + Plan ───────────────────────────────────
  const risks: Array<{ warning: RiskWarning; plan: RiskPlanItem }> = [];
  const totalVolunteers = form.adultVolunteers + form.studentVolunteers;
  const volunteerRatio = form.attendance / Math.max(totalVolunteers, 1);

  if (form.adultVolunteers === 0) {
    risks.push(buildRisk(
      "error",
      "No Adult Volunteers are listed. Food fundraisers require at least 1–2 adults for cooking oversight, food safety, and cash handling. Please add adult volunteers before finalizing your plan.",
      "Recruit at least 2 adults before the event. At minimum you need one adult managing cooking and one adult at the donation table. Do not proceed with zero adult volunteers.",
    ));
  }

  if (form.studentVolunteers === 0 && form.attendance > 40) {
    risks.push(buildRisk(
      "info",
      `No Student Runners or student volunteers are listed. For ${form.attendance} guests, student helpers are valuable for restocking supplies, running items between stations, and managing cleanup. Consider recruiting ${Math.ceil(form.attendance / 50)} to ${Math.ceil(form.attendance / 35)} student volunteers.`,
      "Ask your group leader for a list of students who can volunteer. Even 2–3 student runners significantly reduce adult workload and keep stations stocked.",
    ));
  }

  if (totalVolunteers < 3 && form.attendance > 30) {
    risks.push(buildRisk(
      "error",
      `Only ${totalVolunteers} volunteer${totalVolunteers !== 1 ? "s" : ""} for ${form.attendance} guests. This is not enough to safely run this event. Aim for at least 1 volunteer per 15–20 guests (${Math.ceil(form.attendance / 20)}–${Math.ceil(form.attendance / 15)} for this crowd).`,
      "Send an urgent volunteer request to parents and your community. Post on social media or your group's messaging platform. Consider postponing if you cannot reach minimum staffing before the event.",
    ));
  } else if (volunteerRatio > 25) {
    risks.push(buildRisk(
      "warning",
      `Your volunteer-to-guest ratio is 1:${Math.round(volunteerRatio)}. A stretched team leads to long lines and service gaps. Aim for 1 volunteer per 15–20 guests — this event would ideally have ${Math.ceil(form.attendance / 20)}–${Math.ceil(form.attendance / 15)} volunteers.`,
      "Reach out to other parent groups, community members, or last-minute recruits. Assign double-duty to capable volunteers — a Student Runner can also help with setup before service begins.",
    ));
  } else if (volunteerRatio > 18) {
    risks.push(buildRisk(
      "info",
      `Volunteer-to-guest ratio is 1:${Math.round(volunteerRatio)}. You're in an acceptable range, but recruiting ${Math.ceil(form.attendance / 15) - totalVolunteers} more volunteers would give you a comfortable buffer.`,
      "Even one or two additional student volunteers for restocking and cleanup gives you meaningful extra capacity. Ask for a few more recruits before the event.",
    ));
  }

  if (prepMins <= 0) {
    risks.push(buildRisk(
      "error",
      "Prep start time is at or after serve start time. There is no time to prepare food before guests arrive. Please adjust your schedule.",
      "Move your prep start time to at least 90–120 minutes before serving begins. If the serve time is fixed, pre-cook as much as possible the day or morning before.",
    ));
  } else if (prepMins < 60) {
    risks.push(buildRisk(
      "error",
      `Only ${prepMins} minutes of prep time before serving begins. For ${form.attendance} guests${meal.cookingComplexity !== "low" ? " and a meal with multiple cooking components" : ""}, plan for at least 90–120 minutes of prep. Adjust your prep start time.`,
      "Start prep at least 90 minutes before doors open. Use the extra time to stage stations, verify temperatures, and run a brief team briefing before the first guest arrives.",
    ));
  } else if (prepMins < 90 && meal.cookingComplexity === "high") {
    risks.push(buildRisk(
      "warning",
      `${meal.displayName} is a high-complexity meal with multiple simultaneous cooking components. You have ${prepMins} minutes of prep — plan for at least 120 minutes. Consider starting prep earlier to avoid a rushed opening.`,
      "Schedule a 2-hour minimum prep window for this meal type. Assign each cooking component its own dedicated adult volunteer to stay on schedule and avoid bottlenecks.",
    ));
  } else if (prepMins < 75 && meal.cookingComplexity === "medium") {
    risks.push(buildRisk(
      "warning",
      `${meal.displayName} benefits from at least 90 minutes of prep time. You currently have ${prepMins} minutes — consider starting 15–20 minutes earlier.`,
      "Start 15–20 minutes earlier to give yourself a comfortable buffer. Use the extra time for a final readiness walkthrough before doors open.",
    ));
  }

  if (serveDuration <= 0) {
    risks.push(buildRisk(
      "error",
      "Serve end time is at or before serve start time. Please check your serving window.",
      "Update your serve end time to be at least 60–90 minutes after your serve start time.",
    ));
  } else if (serveDuration < 60 && form.attendance > 100) {
    risks.push(buildRisk(
      "warning",
      `Your serving window is only ${serveDuration} minutes for ${form.attendance} guests — less than 1 minute per guest. Extend to at least 90 minutes or add a second serving line to maintain flow.`,
      "Open a second serving line to handle the crowd, or extend the closing time. A compressed window with a large crowd leads to long lines and stressed volunteers.",
    ));
  } else if (serveDuration < 90 && form.attendance > 200) {
    risks.push(buildRisk(
      "warning",
      `${form.attendance} guests in a ${serveDuration}-minute window is a tight pace. For crowds over 200, a 90–120 minute serving window reduces line pressure and keeps volunteers from being overwhelmed.`,
      "Set up two parallel serving lines before guests arrive. Stage both lines identically — food, condiments, utensils — so both can operate simultaneously from the start.",
    ));
  }

  if (estimatedProfit[1] < 0) {
    risks.push(buildRisk(
      "error",
      `At ${fmt$(form.mealPrice)}/person and estimated costs of ${fmt$(totalCostRange[0])}–${fmt$(totalCostRange[1])}, this event will likely not break even. Consider raising the donation/meal price, finding donated supplies, or reducing your menu scope.`,
      "Raise the suggested donation by $3–$5 per person, or look for donated ingredients from local businesses and community members. Even partial donations of supplies can shift a loss into a profit.",
    ));
  } else if (estimatedProfit[0] < 0) {
    risks.push(buildRisk(
      "warning",
      `Profit margin is thin — your low-end cost estimate puts you slightly in the red. Watch your supply costs carefully and aim for full attendance. Consider setting an internal goal 10–15% above your stated attendance target.`,
      "Purchase supplies at a warehouse store (Costco, Sam's Club) to reduce per-unit costs. Track spending against your cost estimate on the day of shopping — do not overbuy.",
    ));
  } else if (form.mealPrice < 7) {
    risks.push(buildRisk(
      "info",
      `Your suggested donation/price is ${fmt$(form.mealPrice)}, which is on the low end for a food fundraiser. Many groups charge $8–$15 per plate. Raising the price by even $2–$3 per person meaningfully improves your profit margin.`,
      `Raise the suggested donation to at least $8 per person. A $2 increase across ${form.attendance} guests adds ${fmt$(form.attendance * 2)} to your total revenue without requiring more attendance.`,
    ));
  }

  if (form.attendance > 300) {
    risks.push(buildRisk(
      "warning",
      `Large event: ${form.attendance} guests. Confirm you have sufficient cooking capacity (grills, griddles, roasters) and a clear backup plan. Consider staging a second cook team and a second serving line. Parking, seating, and restroom access also become important at this scale.`,
      "Assign a dedicated event coordinator whose only job is to watch traffic flow, cooking supply, and team communication. Do not let the coordinator get pulled into serving or cooking duties.",
    ));
  } else if (form.attendance > 250) {
    risks.push(buildRisk(
      "warning",
      `${form.attendance} guests is a substantial crowd. Two serving lines are strongly recommended above 250 guests. Verify you have enough cooking equipment and cooler space for the full quantity of food.`,
      "Set up two parallel serving lines before guests arrive. Confirm equipment capacity in advance — you need enough cooking equipment to maintain peak demand for your full serving window.",
    ));
  } else if (form.attendance > 150) {
    risks.push(buildRisk(
      "info",
      `${form.attendance} guests is a sizeable crowd. Make sure your serving line is wide enough and your cooking equipment can maintain pace. A second serving line is often worth setting up above 150 guests.`,
      "Stage a second serving station in advance, even if you plan to open only one. If lines get long, you can activate the second line immediately without scrambling to set it up.",
    ));
  }

  if (kidPercent > 60) {
    risks.push(buildRisk(
      "info",
      `${kidPercent}% of your guests are kids or students. Kid portions are smaller, so total food volume is lower — your estimates reflect this. Check whether any kids have food allergies that require a separate option, and label condiments clearly.`,
      "Prepare a simple allergen information card listing common allergens in your menu items. Post it at the serving station so parents can check before their child eats.",
    ));
  }

  if (meal.cookingComplexity === "high" && form.adultVolunteers < 4) {
    risks.push(buildRisk(
      "warning",
      `${meal.displayName} is a high-complexity meal requiring multiple simultaneous cooking stations. With only ${form.adultVolunteers} adult volunteer${form.adultVolunteers !== 1 ? "s" : ""}, you may be short on experienced cooking hands. Plan for at least 3–4 adults who are comfortable managing stovetops, griddles, or roasters at the same time.`,
      "Recruit 2–3 more adults with cooking confidence before the event. Assign each adult to one specific cooking station — do not ask anyone to manage multiple stations simultaneously.",
    ));
  } else if (meal.cookingComplexity === "medium" && form.adultVolunteers < 2) {
    risks.push(buildRisk(
      "warning",
      `${meal.displayName} needs at least 2 adult volunteers managing the cooking. With only ${form.adultVolunteers}, you risk a bottleneck. Recruit at least one more adult with cooking experience before the event.`,
      "Recruit one more adult who is comfortable managing the main cooking station. They should be assigned solely to cooking — not split across serving or setup duties.",
    ));
  }

  if (combo) {
    risks.push(buildRisk(
      "info",
      `${meal.displayName} is a combo meal — the shopping list combines independent ingredient calculations for each component. Review each section carefully and adjust quantities if your crowd strongly prefers one item over the other.`,
      "Plan cooking stations for each component separately. Assign at least one dedicated adult to each cooking area so neither component falls behind during service.",
    ));
  } else if (form.mealType === "custom") {
    const hasMenuDetails = (form.customMenuSides?.length ?? 0) > 0
      || (form.customMenuDrinks?.length ?? 0) > 0
      || (form.customMenuDesserts?.length ?? 0) > 0;
    if (hasMenuDetails) {
      risks.push(buildRisk(
        "info",
        "Shopping list items are estimates based on your menu selections. Quantities for custom meals are approximate — verify against your specific recipes before purchasing.",
        "Do a test cook at 25–50% scale before the event to confirm portion sizes and timing. Adjust quantities from this estimate as needed.",
      ));
    } else {
      risks.push(buildRisk(
        "info",
        "Custom meal calculations are rough estimates only. The app cannot calculate specific ingredients without menu details — use this plan for supplies and volunteer structure, and calculate your food quantities manually from your recipe.",
        "Do a test cook of your recipe at 25–50% of the full batch size before the event. This reveals actual timing, portion sizes, and equipment needs at scale.",
      ));
    }
  }

  if (form.adultPercent + form.kidPercent !== 100) {
    risks.push(buildRisk(
      "info",
      `Adult % (${form.adultPercent}%) + Kids % (${form.kidPercent}%) doesn't total 100%. The remainder (${100 - form.adultPercent - form.kidPercent}%) is treated as adults for calculation purposes.`,
      "Update your form to ensure adult percentage + kid percentage equals exactly 100%. This ensures food quantities are calculated correctly for your crowd mix.",
    ));
  }

  // ── Revenue scenario-based profit warnings (Part 3) ───────
  {
    const { conservative, baseline, optimistic } = revenueScenarios;
    const profitPerAttendee = form.attendance > 0
      ? baseline.grossRevenue / form.attendance : 0;

    if (conservative.netProfitRange[1] < 0 && baseline.netProfitRange[1] >= 0) {
      risks.push(buildRisk(
        "warning",
        `Your Conservative scenario (${conservative.conversionRate}% donation rate) results in a loss. If fewer guests donate than expected, this event may not break even. Pre-selling plates before the event is the most effective way to reduce this risk.`,
        "Pre-sell plates through your group's messaging platform before the event. Even 20–30 guaranteed sales meaningfully reduce your break-even risk and give you a floor to plan around.",
      ));
    } else if (optimistic.netProfitRange[1] < 0) {
      risks.push(buildRisk(
        "error",
        `All three revenue scenarios — Conservative (${conservative.conversionRate}%), Baseline (${baseline.conversionRate}%), and Optimistic (${optimistic.conversionRate}%) — project a loss. This event will not break even at your current pricing. Raise your price or find donated supplies before proceeding.`,
        "Raise your suggested donation by $3–5 per person, or identify 2–3 high-cost shopping items where local businesses might donate. A single donated ingredient can shift this from a loss to a profit.",
      ));
    }

    if (profitPerAttendee > 0 && profitPerAttendee < 3) {
      risks.push(buildRisk(
        "warning",
        `Your baseline revenue per guest is only $${profitPerAttendee.toFixed(2)} after costs — a very thin margin. A small drop in attendance or donation rate will erase your profit. Consider raising prices $2–$3 or seeking donated supplies.`,
        "Look for one or two donated items from local businesses (buns, condiments, drinks) to reduce your cost base. Even partial donations meaningfully shift the per-person margin.",
      ));
    }

    if ((form.donationRate ?? 75) < 60 && form.pricingModel === "split") {
      risks.push(buildRisk(
        "info",
        `Your baseline donation rate is set to ${form.donationRate ?? 75}%. For tiered-pricing events, a rate below 60% suggests guests may be hesitant about the pricing structure. A clear suggested-donation sign with specific amounts — not just a price board — often increases actual conversion.`,
        "Post clear signs showing 'Suggested donation: $X individual / $Y family.' Include a QR code for digital payment alongside a cash box. Removing friction from the payment step typically raises conversion rates by 5–10%.",
      ));
    }
  }

  const riskWarnings: RiskWarning[] = risks.map(r => r.warning);
  const riskPlan: RiskPlanItem[] = risks.map(r => r.plan);

  // ── Email Blurb ───────────────────────────────────────────
  const mealName = meal.displayName === "Custom Meal" && form.customMealName
    ? form.customMealName
    : meal.displayName;

  const emailBlurb = `Subject: Volunteer Sign-Up – ${form.eventName} | ${formatTime(serveStart)}

Hi everyone,

We're hosting a ${mealName} fundraiser for ${form.orgType === "Other" ? "our organization" : form.orgType} and we need your help to make it a success!

Event: ${form.eventName}
Meal: ${mealName}
Serving: ${formatTime(serveStart)} – ${formatTime(serveEnd)}
Volunteers needed by: ${formatTime(prepStart)}
${form.mealPrice > 0 ? `Suggested donation: ${fmt$(form.mealPrice)} per person` : ""}
Attendance goal: ${form.attendance} guests

We're looking for Adult Volunteers, Parent Volunteers, and Student Runners to help with cooking, serving, setup, and cleanup. Every role matters and we couldn't do it without you!

Roles available:
${volunteerPlan.map((r) => `• ${r.role} (${r.type}) — ${r.count} needed`).join("\n")}

Reply to this message to let us know you can help, or sign up using the link below.

Thank you for supporting ${form.eventName}!`.trim();

  // ── Scenario Bundle (attendance range mode) ────────────────
  let scenarioBundle: FundraiserPlan["scenarioBundle"];
  if (form.attendanceMode === "estimate" && form.attendanceLow && form.attendanceHigh) {
    const low  = Math.max(10, Math.min(form.attendanceLow, form.attendanceHigh));
    const high = Math.max(low, Math.max(form.attendanceLow, form.attendanceHigh));
    const mid  = Math.round((low + high) / 2);
    const base = Math.max(form.attendance, 1);

    const buildScenario = (n: number) => {
      const scale = n / base;
      const scenCost: [number, number] = [
        Math.round(totalCostRange[0] * scale),
        Math.round(totalCostRange[1] * scale),
      ];
      const scenRevenue = Math.round(n * form.mealPrice);
      const scenProfit: [number, number] = [
        scenRevenue - scenCost[1],
        scenRevenue - scenCost[0],
      ];
      return { attendance: n, estimatedRevenue: scenRevenue, costRange: scenCost, estimatedProfit: scenProfit };
    };

    scenarioBundle = {
      conservative: buildScenario(low),
      expected:     buildScenario(mid),
      generous:     buildScenario(high),
    };
  }

  // ── Full Event Pack sections ──────────────────────────────
  const strategySummary = buildStrategySummary(form);
  const profitStrategy = buildProfitStrategy(form, totalCostRange, estimatedProfit);
  const volunteerBriefing = buildVolunteerBriefing(form.mealType, mealName, form, volunteerPlan, serveStart, prepStart);
  const setupLayout = buildSetupLayout(form.mealType);
  const leftoverPlan = buildLeftoverPlan(form.mealType);
  const commsPack = buildCommsPack(mealName, form, volunteerPlan, serveStart, serveEnd, prepStart);
  const shoppingListGrouped = buildShoppingListGrouped(shoppingList);

  // ── Assemble Plan ─────────────────────────────────────────
  return {
    summary: {
      eventName: form.eventName,
      orgType: form.orgType,
      mealType: mealName,
      attendance: form.attendance,
      adults,
      kids,
      mealPrice: form.mealPrice,
      storePreference: form.storePreference,
    },
    foodQuantities,
    shoppingList,
    shoppingListGrouped,
    suppliesList,
    drinksList,
    costRange: totalCostRange,
    estimatedRevenue,
    revenueConservative,
    revenueGenerous,
    estimatedProfit,
    revenueScenarios,
    pricingMethodologyNote,
    scenarioBundle,
    prepTimeline,
    volunteerPlan,
    riskWarnings,
    riskPlan,
    emailBlurb,
    disclaimer: DISCLAIMER,
    strategySummary,
    profitStrategy,
    volunteerBriefing,
    setupLayout,
    leftoverPlan,
    commsPack,
  };
}
