// ============================================================
// CORE CALCULATION ENGINE
// All food quantity, cost, timeline, and volunteer logic lives here.
// To update serving assumptions, edit mealAssumptions.ts.
// ============================================================

import type {
  PlannerFormData, FundraiserPlan, ShoppingItem,
  SupplyItem, PrepStep, VolunteerRole, RiskWarning,
} from "./types";
import { MEAL_ASSUMPTIONS } from "./mealAssumptions";

// ── Planning disclaimer ───────────────────────────────────────
const DISCLAIMER =
  "These are planning estimates. Adjust for your group, appetite, store prices, and local context.";

// ── Helpers ──────────────────────────────────────────────────

function ceilToPackage(total: number, packageSize: number): number {
  return Math.ceil(total / packageSize);
}

function rangeAdd(a: [number, number], b: [number, number]): [number, number] {
  return [a[0] + b[0], a[1] + b[1]];
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

function fmt$(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
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
// Counts scale from attendance and the actual volunteer inputs.

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
          "Keep topping bar stocked: butter, sour cream, cheese, bacon bits, chives",
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
          "Cook and season hash brown potatoes and bell peppers",
          "Keep the protein and potato station continuously stocked",
        ],
      },
      {
        role: "Burrito Assembly & Wrapping",
        count: Math.max(2, Math.ceil(attendance / 45)),
        type: "Parent Oversight",
        duties: [
          "Assemble burritos in order: eggs → sausage → hash browns → cheese",
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

// ── Main Calculator ───────────────────────────────────────────

export function calculatePlan(form: PlannerFormData): FundraiserPlan {
  const meal = MEAL_ASSUMPTIONS[form.mealType];

  const adults = Math.round(form.attendance * (form.adultPercent / 100));
  const kids = form.attendance - adults;
  const kidPercent = Math.round((kids / form.attendance) * 100);

  // Total individual servings (e.g. number of hot dogs, tacos, etc.)
  // including the waste/overage buffer
  const totalServings = Math.ceil(
    (adults * meal.adultServings + kids * meal.kidServings) * meal.wasteBuffer
  );

  // ── Food Quantities ────────────────────────────────────────
  const foodQuantities: FundraiserPlan["foodQuantities"] = meal.ingredients.map((ing) => {
    const rawTotal = totalServings * ing.perServing;
    const packages = ceilToPackage(rawTotal, ing.packageSize);
    const totalUnits = packages * ing.packageSize;
    const neededDisplay = rawTotal < 1
      ? `~${rawTotal.toFixed(2)} ${ing.unit}s`
      : `~${Math.ceil(rawTotal)} ${ing.unit}s`;
    return {
      ingredient: ing.name,
      quantity: `${packages} × ${ing.packageUnit} (need ${neededDisplay}, buying ${totalUnits})`,
      notes: ing.category === "condiment"
        ? "Estimate — adjust based on your crowd's preferences"
        : undefined,
    };
  });

  // ── Shopping List ──────────────────────────────────────────
  let totalCostRange: [number, number] = [0, 0];

  const shoppingList: ShoppingItem[] = meal.ingredients.map((ing) => {
    const rawTotal = totalServings * ing.perServing;
    const packages = ceilToPackage(rawTotal, ing.packageSize);
    const totalUnits = packages * ing.packageSize;
    const itemCost: [number, number] = [
      packages * ing.costPerPackage[0],
      packages * ing.costPerPackage[1],
    ];
    totalCostRange = rangeAdd(totalCostRange, itemCost);

    const neededRaw = Math.ceil(rawTotal);
    const quantityStr = `${packages} × ${ing.packageUnit}  (${neededRaw} ${ing.unit}s needed → ${totalUnits} buying)`;

    return {
      item: ing.name,
      quantity: quantityStr,
      estimatedCost: itemCost,
      notes: ing.category === "condiment"
        ? "May have leftovers — saves money at your next event"
        : undefined,
    };
  });

  // ── Supplies List ──────────────────────────────────────────
  const suppliesList: SupplyItem[] = meal.supplies.map((sup) => {
    const rawTotal = form.attendance * sup.perPerson;
    const packages = sup.packageSize > 0 ? ceilToPackage(rawTotal, sup.packageSize) : 0;
    const totalUnits = packages * sup.packageSize;
    const itemCost: [number, number] = packages > 0
      ? [packages * sup.costPerPackage[0], packages * sup.costPerPackage[1]]
      : [0, 0];
    totalCostRange = rangeAdd(totalCostRange, itemCost);

    const quantityStr = packages > 0
      ? `${packages} pack${packages > 1 ? "s" : ""} (${totalUnits} units)`
      : "As needed / already owned";

    return {
      item: sup.name,
      quantity: quantityStr,
      estimatedCost: itemCost,
    };
  });

  // Add a misc contingency buffer (5%)
  totalCostRange = [
    Math.round(totalCostRange[0] * 1.05),
    Math.round(totalCostRange[1] * 1.05),
  ];

  // ── Revenue & Profit ──────────────────────────────────────
  const estimatedRevenue = Math.round(form.attendance * form.mealPrice);
  const estimatedProfit: [number, number] = [
    estimatedRevenue - totalCostRange[1],
    estimatedRevenue - totalCostRange[0],
  ];

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
    },
    {
      time: formatTime(addMinutes(prepStart, 30)),
      task: `Unpack and stage all ingredients and supplies — ${meal.displayName} station layout`,
      who: "Adult Volunteer",
      duration: "20 min",
    },
    {
      time: formatTime(addMinutes(prepStart, 50)),
      task: `Begin cooking and prep — ${meal.prepNotes}`,
      who: "Parent Oversight",
      duration: `${Math.max(0, prepMins - 65)} min`,
    },
    {
      time: formatTime(addMinutes(serveStart, -15)),
      task: "Final readiness check — food temperatures verified, supply stations fully stocked, serving line staged",
      who: "Adult Volunteer",
      duration: "15 min",
    },
    {
      time: formatTime(serveStart),
      task: `Doors open — begin serving. ${meal.cookNote}`,
      who: "All Volunteers",
      duration: `${serveDuration} min`,
    },
    {
      time: formatTime(addMinutes(serveStart, Math.floor(serveDuration / 2))),
      task: "Mid-service check: restock supplies, replenish food, empty trash, briefly check in with team",
      who: "Student Runner",
      duration: "10 min",
    },
    {
      time: formatTime(serveEnd),
      task: "Service ends — announce close to guests, begin breakdown and cleanup",
      who: "All Volunteers",
      duration: "30–45 min",
    },
    {
      time: formatTime(addMinutes(serveEnd, 30)),
      task: "Leftover food stored safely, venue cleaned, borrowed equipment returned or packed",
      who: "Adult Volunteer",
      duration: "15–30 min",
    },
  ];

  // ── Volunteer Plan ────────────────────────────────────────
  const volunteerPlan: VolunteerRole[] = buildVolunteerPlan(form, meal.cookingComplexity);

  // ── Risk Warnings ─────────────────────────────────────────
  const riskWarnings: RiskWarning[] = [];
  const totalVolunteers = form.adultVolunteers + form.studentVolunteers;
  const volunteerRatio = form.attendance / Math.max(totalVolunteers, 1);

  // — No adult volunteers at all
  if (form.adultVolunteers === 0) {
    riskWarnings.push({
      level: "error",
      message: "No Adult Volunteers are listed. Food fundraisers require at least 1–2 adults for cooking oversight, food safety, and cash handling. Please add adult volunteers before finalizing your plan.",
    });
  }

  // — No student volunteers (informational nudge)
  if (form.studentVolunteers === 0 && form.attendance > 40) {
    riskWarnings.push({
      level: "info",
      message: `No Student Runners or student volunteers are listed. For ${form.attendance} guests, student helpers are valuable for restocking supplies, running items between stations, and managing cleanup. Consider recruiting ${Math.ceil(form.attendance / 50)} to ${Math.ceil(form.attendance / 35)} student volunteers.`,
    });
  }

  // — Dangerously low total volunteers
  if (totalVolunteers < 3 && form.attendance > 30) {
    riskWarnings.push({
      level: "error",
      message: `Only ${totalVolunteers} volunteer${totalVolunteers !== 1 ? "s" : ""} for ${form.attendance} guests. This is not enough to safely run this event. Aim for at least 1 volunteer per 15–20 guests (${Math.ceil(form.attendance / 20)}–${Math.ceil(form.attendance / 15)} for this crowd).`,
    });
  } else if (volunteerRatio > 25) {
    riskWarnings.push({
      level: "warning",
      message: `Your volunteer-to-guest ratio is 1:${Math.round(volunteerRatio)}. A stretched team leads to long lines and service gaps. Aim for 1 volunteer per 15–20 guests — this event would ideally have ${Math.ceil(form.attendance / 20)}–${Math.ceil(form.attendance / 15)} volunteers.`,
    });
  } else if (volunteerRatio > 18) {
    riskWarnings.push({
      level: "info",
      message: `Volunteer-to-guest ratio is 1:${Math.round(volunteerRatio)}. You're in an acceptable range, but recruiting ${Math.ceil(form.attendance / 15) - totalVolunteers} more volunteers would give you a comfortable buffer.`,
    });
  }

  // — Prep time warnings
  if (prepMins <= 0) {
    riskWarnings.push({
      level: "error",
      message: "Prep start time is at or after serve start time. There is no time to prepare food before guests arrive. Please adjust your schedule.",
    });
  } else if (prepMins < 60) {
    riskWarnings.push({
      level: "error",
      message: `Only ${prepMins} minutes of prep time before serving begins. For ${form.attendance} guests${meal.cookingComplexity !== "low" ? " and a meal with multiple cooking components" : ""}, plan for at least 90–120 minutes of prep. Adjust your prep start time.`,
    });
  } else if (prepMins < 90 && meal.cookingComplexity === "high") {
    riskWarnings.push({
      level: "warning",
      message: `${meal.displayName} is a high-complexity meal with multiple simultaneous cooking components. You have ${prepMins} minutes of prep — plan for at least 120 minutes. Consider starting prep earlier to avoid a rushed opening.`,
    });
  } else if (prepMins < 75 && meal.cookingComplexity === "medium") {
    riskWarnings.push({
      level: "warning",
      message: `${meal.displayName} benefits from at least 90 minutes of prep time. You currently have ${prepMins} minutes — consider starting 15–20 minutes earlier.`,
    });
  }

  // — Short serve window
  if (serveDuration <= 0) {
    riskWarnings.push({
      level: "error",
      message: "Serve end time is at or before serve start time. Please check your serving window.",
    });
  } else if (serveDuration < 60 && form.attendance > 100) {
    riskWarnings.push({
      level: "warning",
      message: `Your serving window is only ${serveDuration} minutes for ${form.attendance} guests — less than 1 minute per guest. Extend to at least 90 minutes or add a second serving line to maintain flow.`,
    });
  } else if (serveDuration < 90 && form.attendance > 200) {
    riskWarnings.push({
      level: "warning",
      message: `${form.attendance} guests in a ${serveDuration}-minute window is a tight pace. For crowds over 200, a 90–120 minute serving window reduces line pressure and keeps volunteers from being overwhelmed.`,
    });
  }

  // — Profit warnings
  if (estimatedProfit[1] < 0) {
    riskWarnings.push({
      level: "error",
      message: `At ${fmt$(form.mealPrice)}/person and estimated costs of ${fmt$(totalCostRange[0])}–${fmt$(totalCostRange[1])}, this event will likely not break even. Consider raising the donation/meal price, finding donated supplies, or reducing your menu scope.`,
    });
  } else if (estimatedProfit[0] < 0) {
    riskWarnings.push({
      level: "warning",
      message: `Profit margin is thin — your low-end cost estimate puts you slightly in the red. Watch your supply costs carefully and aim for full attendance. Consider setting an internal goal 10–15% above your stated attendance target.`,
    });
  } else if (form.mealPrice < 7) {
    riskWarnings.push({
      level: "info",
      message: `Your suggested donation/price is ${fmt$(form.mealPrice)}, which is on the low end for a food fundraiser. Many groups charge $8–$15 per plate. Raising the price by even $2–$3 per person meaningfully improves your profit margin.`,
    });
  }

  // — Large attendance warnings (graduated)
  if (form.attendance > 300) {
    riskWarnings.push({
      level: "warning",
      message: `Large event: ${form.attendance} guests. Confirm you have sufficient cooking capacity (grills, griddles, roasters) and a clear backup plan. Consider staging a second cook team and a second serving line. Parking, seating, and restroom access also become important at this scale.`,
    });
  } else if (form.attendance > 250) {
    riskWarnings.push({
      level: "warning",
      message: `${form.attendance} guests is a substantial crowd. Two serving lines are strongly recommended above 250 guests. Verify you have enough cooking equipment and cooler space for the full quantity of food.`,
    });
  } else if (form.attendance > 150) {
    riskWarnings.push({
      level: "info",
      message: `${form.attendance} guests is a sizeable crowd. Make sure your serving line is wide enough and your cooking equipment can maintain pace. A second serving line is often worth setting up above 150 guests.`,
    });
  }

  // — High kid percentage (affects portions and dietary needs)
  if (kidPercent > 60) {
    riskWarnings.push({
      level: "info",
      message: `${kidPercent}% of your guests are kids or students. Kid portions are smaller, so total food volume is lower — your estimates reflect this. Check whether any kids have food allergies that require a separate option, and label condiments clearly.`,
    });
  }

  // — Cooking complexity vs. adult volunteer count
  if (meal.cookingComplexity === "high" && form.adultVolunteers < 4) {
    riskWarnings.push({
      level: "warning",
      message: `${meal.displayName} is a high-complexity meal requiring multiple simultaneous cooking stations. With only ${form.adultVolunteers} adult volunteer${form.adultVolunteers !== 1 ? "s" : ""}, you may be short on experienced cooking hands. Plan for at least 3–4 adults who are comfortable managing stovetops, griddles, or roasters at the same time.`,
    });
  } else if (meal.cookingComplexity === "medium" && form.adultVolunteers < 2) {
    riskWarnings.push({
      level: "warning",
      message: `${meal.displayName} needs at least 2 adult volunteers managing the cooking. With only ${form.adultVolunteers}, you risk a bottleneck. Recruit at least one more adult with cooking experience before the event.`,
    });
  }

  // — Custom meal limited accuracy
  if (form.mealType === "custom") {
    riskWarnings.push({
      level: "info",
      message: "Custom meal calculations are rough estimates only. The app cannot calculate specific ingredients for a custom meal — use this plan for supplies and volunteer structure, and calculate your food quantities manually from your recipe.",
    });
  }

  // — Adult % + Kid % doesn't total 100%
  if (form.adultPercent + form.kidPercent !== 100) {
    riskWarnings.push({
      level: "info",
      message: `Adult % (${form.adultPercent}%) + Kids % (${form.kidPercent}%) doesn't total 100%. The remainder (${100 - form.adultPercent - form.kidPercent}%) is treated as adults for calculation purposes.`,
    });
  }

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
Suggested donation: $${form.mealPrice} per person
Attendance goal: ${form.attendance} guests

We're looking for Adult Volunteers, Parent Volunteers, and Student Runners to help with cooking, serving, setup, and cleanup. Every role matters and we couldn't do it without you!

Roles available:
${volunteerPlan.map((r) => `• ${r.role} (${r.type}) — ${r.count} needed`).join("\n")}

Reply to this message to let us know you can help, or sign up using the link below.

Thank you for supporting ${form.eventName}!`.trim();

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
    suppliesList,
    costRange: totalCostRange,
    estimatedRevenue,
    estimatedProfit,
    prepTimeline,
    volunteerPlan,
    riskWarnings,
    emailBlurb,
    disclaimer: DISCLAIMER,
  };
}
