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
// Returns a list of role definitions tailored to the meal.
// Counts are scaled from attendance and actual volunteer input.

function buildVolunteerPlan(
  form: PlannerFormData,
  cookingComplexity: "low" | "medium" | "high",
): VolunteerRole[] {
  const { attendance, mealType, adultVolunteers, studentVolunteers } = form;
  const totalVolunteers = adultVolunteers + studentVolunteers;

  // Role templates per meal type
  const cookRoles: Record<string, VolunteerRole[]> = {
    hotdogs: [
      {
        role: "Grill Master",
        count: Math.max(1, Math.ceil(attendance / 80)),
        type: "Adult Volunteer",
        duties: ["Operate and monitor grill", "Cook hot dogs to safe temperature", "Signal when next batch is ready"],
      },
      {
        role: "Bun & Condiment Station",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Parent Volunteer",
        duties: ["Pre-open buns and stage in trays", "Keep condiment station stocked (ketchup, mustard, relish)", "Assist guests with toppings"],
      },
    ],
    burgers: [
      {
        role: "Grill Master",
        count: Math.max(1, Math.ceil(attendance / 60)),
        type: "Adult Volunteer",
        duties: ["Form and grill patties", "Monitor internal temperature (160°F)", "Coordinate timing with assembly crew"],
      },
      {
        role: "Burger Assembly Station",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Parent Volunteer",
        duties: ["Place cheese on hot patties", "Build burgers at the assembly table", "Keep buns, lettuce, and toppings stocked"],
      },
    ],
    bakedPotatoes: [
      {
        role: "Oven / Potato Monitor",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Adult Volunteer",
        duties: ["Monitor oven temperatures", "Pull and check potatoes for doneness", "Transfer finished potatoes to warm-holding"],
      },
      {
        role: "Topping Bar Attendant",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Parent Volunteer",
        duties: ["Keep topping bar stocked (butter, sour cream, cheese, bacon bits)", "Serve toppings to guests if buffet is not self-serve", "Maintain cleanliness of topping station"],
      },
    ],
    breakfastBurritos: [
      {
        role: "Lead Cook — Eggs & Griddle",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Adult Volunteer",
        duties: ["Scramble eggs in large batches", "Manage griddle temperature and oil", "Signal assembly crew when eggs are ready"],
      },
      {
        role: "Sausage & Potato Station",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Parent Volunteer",
        duties: ["Pre-cook and hold sausage in roaster or foil pans", "Cook and season hash brown potatoes", "Keep protein station stocked"],
      },
      {
        role: "Burrito Assembly & Wrapping",
        count: Math.max(2, Math.ceil(attendance / 50)),
        type: "Parent Volunteer",
        duties: ["Assemble and fold burritos in foil", "Maintain assembly line pace", "Pass finished burritos to serving line"],
      },
    ],
    tacos: [
      {
        role: "Taco Meat Station",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Adult Volunteer",
        duties: ["Brown and season meat in batches", "Keep meat warm in roaster or covered foil pans", "Replenish serving tray as needed"],
      },
      {
        role: "Taco Bar Setup & Restock",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Parent Volunteer",
        duties: ["Stock and maintain taco bar (shells, cheese, lettuce, tomato, sour cream, salsa)", "Refill serving dishes during service", "Keep bar clean and organized"],
      },
    ],
    spaghetti: [
      {
        role: "Pasta Station Lead",
        count: Math.max(1, Math.ceil(attendance / 50)),
        type: "Adult Volunteer",
        duties: ["Cook pasta in large stockpots", "Stagger batches to maintain supply", "Drain and hold pasta in roasters with olive oil"],
      },
      {
        role: "Sauce Station",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Parent Volunteer",
        duties: ["Keep meat sauce hot and stirred in roaster", "Ladle sauce over pasta at serving", "Replenish sauce from backup containers"],
      },
      {
        role: "Garlic Bread & Sides",
        count: Math.max(1, Math.ceil(attendance / 150)),
        type: "Parent Volunteer",
        duties: ["Warm and slice garlic bread", "Keep bread station stocked", "Plate or bag bread for each guest"],
      },
    ],
    pancakes: [
      {
        role: "Griddle Operator",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Adult Volunteer",
        duties: ["Operate electric griddle continuously", "Pour batter, flip at right time, remove finished pancakes", "Keep griddle greased and at correct temperature"],
      },
      {
        role: "Batter & Syrup Station",
        count: Math.max(1, Math.ceil(attendance / 100)),
        type: "Parent Volunteer",
        duties: ["Mix fresh batter batches as needed", "Keep syrup and toppings restocked on tables", "Deliver batter to griddle operators"],
      },
    ],
    custom: [
      {
        role: "Lead Cook / Food Manager",
        count: Math.max(1, Math.ceil(attendance / 75)),
        type: "Adult Volunteer",
        duties: ["Oversee food preparation and cooking", "Monitor food safety temperatures", "Direct other volunteers on cooking tasks"],
      },
    ],
  };

  // Shared roles for all meal types
  const sharedRoles: VolunteerRole[] = [
    {
      role: "Serving Line",
      count: Math.max(2, Math.ceil(attendance / 60)),
      type: "Parent Oversight",
      duties: [
        "Serve food to guests as they move through the line",
        "Maintain serving portions for consistency",
        "Alert cooking crew when supply is running low",
      ],
    },
    {
      role: "Cashier / Donation Table",
      count: Math.max(1, Math.ceil(attendance / 150)),
      type: "Adult Volunteer",
      duties: [
        "Collect suggested donations or ticket payments",
        "Handle cash and provide change",
        "Keep donation box or register secure",
      ],
    },
    {
      role: "Student Runner",
      count: Math.max(2, Math.ceil(attendance / 75)),
      type: "Student Volunteer",
      duties: [
        "Carry supplies from storage to serving stations",
        "Refill condiment and supply stations",
        "Assist wherever needed during service",
      ],
    },
    {
      role: "Cleanup Team",
      count: Math.max(2, Math.ceil(attendance / 75)),
      type: "Student Volunteer",
      duties: [
        "Monitor trash levels and replace full bags during service",
        "Clear and wipe down tables between guests",
        "Final post-event cleanup of venue",
      ],
    },
  ];

  // Extra setup crew for large or complex events
  const needsSetupCrew = attendance > 100 || cookingComplexity === "high";
  if (needsSetupCrew) {
    sharedRoles.unshift({
      role: "Setup Crew",
      count: Math.max(2, Math.ceil(attendance / 100)),
      type: "Student Volunteer",
      duties: [
        "Arrange tables, chairs, and signage",
        "Lay out place settings (plates, napkins, utensils)",
        "Carry and position cooking equipment",
      ],
    });
  }

  const mealSpecificRoles = cookRoles[mealType] ?? cookRoles["custom"]!;
  const allRoles: VolunteerRole[] = [...mealSpecificRoles, ...sharedRoles];

  // Scale counts if actual volunteer count is lower than ideal
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
      task: "Final readiness check — food temperatures, supply stations fully stocked, serving line staged",
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
      task: "Mid-service check: restock supplies, replenish food, empty trash, brief team",
      who: "Student Volunteer",
      duration: "10 min",
    },
    {
      time: formatTime(serveEnd),
      task: "Service ends — announce close, begin breakdown and cleanup",
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
      message: "No Adult Volunteers are listed. Food fundraisers require at least 1–2 adults for cooking oversight, food safety, and cash handling. Please add adult volunteers.",
    });
  }

  // — Dangerously low total volunteers
  if (totalVolunteers < 3 && form.attendance > 30) {
    riskWarnings.push({
      level: "error",
      message: `Only ${totalVolunteers} volunteer${totalVolunteers !== 1 ? "s" : ""} for ${form.attendance} guests. This is not enough to safely run this event. Aim for at least 1 volunteer per 20–25 guests.`,
    });
  } else if (volunteerRatio > 25) {
    riskWarnings.push({
      level: "warning",
      message: `Volunteer-to-guest ratio is 1:${Math.round(volunteerRatio)}. A stretched team leads to long lines and service gaps. Aim for at least 1 volunteer per 20–25 guests (${Math.ceil(form.attendance / 20)}–${Math.ceil(form.attendance / 15)} for this event).`,
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
      level: "warning",
      message: `Only ${prepMins} minutes of prep time before serving begins. For ${form.attendance} guests${meal.cookingComplexity === "high" ? " and a complex meal like " + meal.displayName : ""}, plan for at least 90–120 minutes of prep.`,
    });
  } else if (prepMins < 90 && meal.cookingComplexity === "high") {
    riskWarnings.push({
      level: "warning",
      message: `${meal.displayName} has multiple cooking components (pasta, sauce, bread) and benefits from at least 90–120 minutes of prep time. You have ${prepMins} minutes — consider starting earlier.`,
    });
  }

  // — Short serve window for large crowd
  if (serveDuration < 60 && form.attendance > 100) {
    riskWarnings.push({
      level: "warning",
      message: `Your serving window is only ${serveDuration} minutes for ${form.attendance} guests. That's less than 1 minute per guest — plan for a fast-moving line or extend the window to at least 90 minutes.`,
    });
  }

  // — Profit warnings
  if (estimatedProfit[1] < 0) {
    riskWarnings.push({
      level: "error",
      message: `At ${fmt$(form.mealPrice)}/person and estimated costs of ${fmt$(totalCostRange[0])}–${fmt$(totalCostRange[1])}, this event may not break even at any attendance level. Consider raising the donation/price or finding donated supplies.`,
    });
  } else if (estimatedProfit[0] < 0) {
    riskWarnings.push({
      level: "warning",
      message: `Profit margin is thin. Low-end cost estimate puts you slightly in the red. Aim for 100% attendance, watch your supply costs carefully, and consider 10–15% above your stated goal as your actual attendance target.`,
    });
  } else if (estimatedProfit[0] > 0 && form.mealPrice < 5) {
    riskWarnings.push({
      level: "info",
      message: `Your suggested donation/price is ${fmt$(form.mealPrice)}, which is on the low end for a food fundraiser. Many groups successfully charge $8–$15 per plate. A higher price increases your profit margin significantly.`,
    });
  }

  // — Large attendance warnings
  if (form.attendance > 300) {
    riskWarnings.push({
      level: "warning",
      message: `Large event (${form.attendance} guests). Confirm you have enough cooking capacity — grills, griddles, or roasters — and a clear backup plan. Consider staging a second cook team.`,
    });
  } else if (form.attendance > 150) {
    riskWarnings.push({
      level: "info",
      message: `${form.attendance} guests is a sizeable crowd. Make sure your serving line is wide enough and you have enough cooking equipment to maintain flow. Two serving lines are often worth it above 150 guests.`,
    });
  }

  // — High kid percentage (affects portions and dietary needs)
  if (kidPercent > 60) {
    riskWarnings.push({
      level: "info",
      message: `${kidPercent}% of your guests are kids or students. Kid portions are smaller, so total food volume is lower — your estimates reflect this. Consider whether any kids have allergy restrictions that require a separate option.`,
    });
  }

  // — Cooking complexity for low-experience teams
  if (meal.cookingComplexity === "high" && form.adultVolunteers < 3) {
    riskWarnings.push({
      level: "warning",
      message: `${meal.displayName} is a complex meal with multiple cooking components. With only ${form.adultVolunteers} adult volunteer${form.adultVolunteers !== 1 ? "s" : ""}, you may be short on experienced cooking hands. Plan to have at least 2–3 adults who are comfortable managing stovetops and roasters simultaneously.`,
    });
  }

  // — Custom meal limited accuracy
  if (form.mealType === "custom") {
    riskWarnings.push({
      level: "info",
      message: "Custom meal calculations are rough estimates only. The app cannot calculate specific ingredients for a custom meal — use this plan for supplies and volunteer structure, and calculate your food quantities manually.",
    });
  }

  // — % doesn't add up
  if (form.adultPercent + form.kidPercent !== 100) {
    riskWarnings.push({
      level: "info",
      message: `Adult % (${form.adultPercent}%) + Kids % (${form.kidPercent}%) doesn't total 100%. The remainder is treated as adults for calculation purposes.`,
    });
  }

  // ── Email Blurb ───────────────────────────────────────────
  const mealName = meal.displayName === "Custom Meal" && form.customMealName
    ? form.customMealName
    : meal.displayName;

  const emailBlurb = `Subject: Volunteer Sign-Up – ${form.eventName} | ${formatTime(serveStart)}

Hi everyone,

We're hosting a ${mealName} fundraiser for ${form.orgType === "Other" ? "our organization" : form.orgType} and we need your help to make it a success!

📅 Event: ${form.eventName}
🍽 Meal: ${mealName}
🕐 Serving: ${formatTime(serveStart)} – ${formatTime(serveEnd)}
⏰ Volunteers needed by: ${formatTime(prepStart)}
👥 Suggested donation: $${form.mealPrice} per person
🎯 Attendance goal: ${form.attendance} guests

We're looking for Adult Volunteers, Parent Volunteers, and Student Volunteers to help with cooking, serving, setup, and cleanup. Every role matters and we couldn't do it without you!

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
