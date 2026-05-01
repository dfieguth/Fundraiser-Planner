// ============================================================
// CORE CALCULATION ENGINE
// All food quantity, cost, timeline, and volunteer logic lives here.
// To update assumptions, edit mealAssumptions.ts.
// ============================================================

import type { PlannerFormData, FundraiserPlan, ShoppingItem, SupplyItem, PrepStep, VolunteerRole, RiskWarning } from "./types";
import { MEAL_ASSUMPTIONS } from "./mealAssumptions";

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

// ── Main Calculator ───────────────────────────────────────────

export function calculatePlan(form: PlannerFormData): FundraiserPlan {
  const meal = MEAL_ASSUMPTIONS[form.mealType];

  const adults = Math.round(form.attendance * (form.adultPercent / 100));
  const kids = form.attendance - adults;

  // Total servings including waste buffer
  const totalServings = Math.ceil(
    (adults * meal.adultServings + kids * meal.kidServings) * meal.wasteBuffer
  );

  // ── Food Quantities ────────────────────────────────────────
  const foodQuantities: FundraiserPlan["foodQuantities"] = meal.ingredients.map((ing) => {
    const rawTotal = totalServings * ing.perServing;
    const packages = ceilToPackage(rawTotal, ing.packageSize);
    const totalUnits = packages * ing.packageSize;
    return {
      ingredient: ing.name,
      quantity: `${packages} ${ing.packageUnit} (${totalUnits} ${ing.unit}s)`,
      notes: ing.category === "condiment" ? "Adjust based on personal preference" : undefined,
    };
  });

  // ── Shopping List ──────────────────────────────────────────
  let totalCostRange: [number, number] = [0, 0];

  const shoppingList: ShoppingItem[] = meal.ingredients.map((ing) => {
    const rawTotal = totalServings * ing.perServing;
    const packages = ceilToPackage(rawTotal, ing.packageSize);
    const itemCost: [number, number] = [
      packages * ing.costPerPackage[0],
      packages * ing.costPerPackage[1],
    ];
    totalCostRange = rangeAdd(totalCostRange, itemCost);
    return {
      item: ing.name,
      quantity: `${packages} × ${ing.packageUnit}`,
      estimatedCost: itemCost,
      notes: ing.category === "condiment" ? "May have leftovers for next event" : undefined,
    };
  });

  // ── Supplies List ──────────────────────────────────────────
  const suppliesList: SupplyItem[] = meal.supplies.map((sup) => {
    const rawTotal = form.attendance * sup.perPerson;
    const packages = sup.packageSize > 0 ? ceilToPackage(rawTotal, sup.packageSize) : 0;
    const itemCost: [number, number] = packages > 0
      ? [packages * sup.costPerPackage[0], packages * sup.costPerPackage[1]]
      : [0, 0];
    totalCostRange = rangeAdd(totalCostRange, itemCost);
    return {
      item: sup.name,
      quantity: packages > 0 ? `${packages} pack(s)` : "As needed",
      estimatedCost: itemCost,
    };
  });

  // Add a misc buffer (5%)
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

  const prepTimeline: PrepStep[] = [
    {
      time: formatTime(prepStart),
      task: "Volunteer arrival & setup — tables, stations, supplies",
      who: "Adult Volunteer",
      duration: "30 min",
    },
    {
      time: formatTime(addMinutes(prepStart, 30)),
      task: `Unpack and organize ingredients — ${meal.displayName} station setup`,
      who: "Adult Volunteer",
      duration: "20 min",
    },
    {
      time: formatTime(addMinutes(prepStart, 50)),
      task: `Begin cooking / prep — ${meal.prepNotes}`,
      who: "Parent Oversight",
      duration: `${minutesBetween(prepStart, serveStart) - 50} min`,
    },
    {
      time: formatTime(addMinutes(serveStart, -15)),
      task: "Final quality check — temperatures, supplies at stations, serve line ready",
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
      time: formatTime(serveEnd),
      task: "Service ends — begin breakdown and cleanup",
      who: "All Volunteers",
      duration: "30–45 min",
    },
    {
      time: formatTime(addMinutes(serveEnd, 30)),
      task: "Leftover food secured, venue clean, equipment returned",
      who: "Adult Volunteer",
      duration: "15–30 min",
    },
  ];

  // ── Volunteer Plan ────────────────────────────────────────
  const totalVolunteers = form.adultVolunteers + form.studentVolunteers;
  const volunteerPlan: VolunteerRole[] = [
    {
      role: "Grill Master / Lead Cook",
      count: Math.max(1, Math.ceil(form.attendance / 100)),
      type: "Adult Volunteer",
      duties: [
        "Oversee all cooking",
        "Monitor food temperatures",
        "Coordinate cook timing",
      ],
    },
    {
      role: "Serving Line",
      count: Math.max(2, Math.ceil(form.attendance / 75)),
      type: "Parent Oversight",
      duties: [
        "Serve food to guests",
        "Maintain serving station",
        "Restock as needed",
      ],
    },
    {
      role: "Condiment & Topping Station",
      count: Math.max(1, Math.ceil(form.attendance / 150)),
      type: "Student Volunteer",
      duties: [
        "Keep condiment area stocked and clean",
        "Assist guests with toppings",
      ],
    },
    {
      role: "Cashier / Donation Collection",
      count: Math.max(1, Math.ceil(form.attendance / 200)),
      type: "Adult Volunteer",
      duties: [
        "Collect suggested donations or meal payments",
        "Handle cash and receipts",
        "Keep donation box secure",
      ],
    },
    {
      role: "Setup & Teardown Crew",
      count: Math.max(2, Math.ceil(form.attendance / 100)),
      type: "Student Volunteer",
      duties: [
        "Arrange tables and chairs",
        "Carry supplies",
        "Post-event cleanup",
      ],
    },
    {
      role: "Cleanup / Trash Patrol",
      count: Math.max(1, Math.ceil(form.attendance / 100)),
      type: "Student Volunteer",
      duties: [
        "Monitor trash levels during event",
        "Replace full bags",
        "Keep venue tidy during service",
      ],
    },
  ];

  // Adjust counts to not exceed total volunteers
  const rolesTotal = volunteerPlan.reduce((s, r) => s + r.count, 0);
  if (rolesTotal > totalVolunteers && totalVolunteers > 0) {
    // Scale down proportionally
    const factor = totalVolunteers / rolesTotal;
    volunteerPlan.forEach((r) => {
      r.count = Math.max(1, Math.round(r.count * factor));
    });
  }

  // ── Risk Warnings ─────────────────────────────────────────
  const riskWarnings: RiskWarning[] = [];

  if (totalVolunteers < 5) {
    riskWarnings.push({
      level: "warning",
      message: `You have only ${totalVolunteers} volunteers for ${form.attendance} guests. Consider recruiting more — a rough guide is 1 volunteer per 20 guests.`,
    });
  }

  if (estimatedProfit[1] < 0) {
    riskWarnings.push({
      level: "error",
      message: `At $${form.mealPrice}/person and estimated costs of $${totalCostRange[0]}–$${totalCostRange[1]}, this event may not break even. Consider raising the suggested donation or reducing portions.`,
    });
  } else if (estimatedProfit[0] < 0) {
    riskWarnings.push({
      level: "warning",
      message: `Profit margin is tight. Low-end cost estimate puts you at a loss. Aim for 100% attendance and watch supply costs carefully.`,
    });
  }

  const prepMins = minutesBetween(prepStart, serveStart);
  if (prepMins < 60) {
    riskWarnings.push({
      level: "warning",
      message: `You have less than 60 minutes of prep time before serving starts. For ${form.attendance} guests, consider starting prep earlier.`,
    });
  }

  if (form.attendance > 300) {
    riskWarnings.push({
      level: "info",
      message: `Large event (${form.attendance} guests). Confirm you have adequate cooking capacity — grills, griddles, or roasters — and a backup plan for slow cooking equipment.`,
    });
  }

  if (form.adultPercent + form.kidPercent !== 100) {
    riskWarnings.push({
      level: "info",
      message: `Adult % + Kids % doesn't total 100%. Calculations assume the remainder are adults.`,
    });
  }

  // ── Email Blurb ───────────────────────────────────────────
  const mealName = meal.displayName === "Custom Meal" && form.customMealName
    ? form.customMealName
    : meal.displayName;

  const emailBlurb = `
Subject: Volunteer Sign-Up – ${form.eventName} | ${formatTime(serveStart)}

Hi everyone,

We're hosting a ${mealName} fundraiser for ${form.orgType === "Other" ? "our organization" : form.orgType} and we need your help to make it a success!

📅 Event: ${form.eventName}
🍽 Meal: ${mealName}
🕐 Serving: ${formatTime(serveStart)} – ${formatTime(serveEnd)}
⏰ Volunteers needed starting at: ${formatTime(prepStart)}
👥 Suggested donation: $${form.mealPrice} per person
🎯 Attendance goal: ${form.attendance} guests

We're looking for Adult Volunteers and Student Volunteers to help with serving, setup, cleanup, and more. Every role matters and we couldn't do it without you!

Reply to this message or sign up at the link below to let us know you can help.

Thank you for supporting ${form.eventName}!
`.trim();

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
  };
}
