// ============================================================
// FUNDRAISER IDEA FINDER — Rules-based recommendation engine
// No AI, no external APIs. Pure scoring logic.
// ============================================================

import type { PlannerFormData, OrgType } from "./types";

// ── Answer types ──────────────────────────────────────────────
export type AttendanceRange = "under75" | "75-150" | "150-250" | "250plus";
export type AudienceType = "mostly-kids" | "mostly-adults" | "mixed";
export type EventTime = "breakfast" | "lunch" | "dinner" | "after-church-school" | "during-event";
export type VolunteerAdults = "0-2" | "3-5" | "6-10" | "10plus";
export type VolunteerStudents = "0-3" | "4-8" | "9-15" | "16plus";
export type EquipmentItem = "kitchen" | "oven" | "grill" | "large-pots" | "warmers" | "fridge" | "no-kitchen";
export type PriorityItem = "lowest-cost" | "easiest" | "highest-profit" | "fastest-serving" | "kid-friendly" | "adult-friendly";
export type ConstraintItem = "no-cooking" | "limited-prep" | "limited-adults" | "grab-and-go" | "vegetarian";
export type MealKey = "hotdogs" | "burgers" | "bakedPotatoes" | "breakfastBurritos" | "tacos" | "walkingTacos" | "spaghetti" | "pancakes";

export interface QuizAnswers {
  orgType: OrgType;
  attendance: AttendanceRange;
  audience: AudienceType;
  timeOfEvent: EventTime;
  adultVolunteers: VolunteerAdults;
  studentHelpers: VolunteerStudents;
  equipment: EquipmentItem[];
  priorities: PriorityItem[];
  constraints: ConstraintItem[];
}

export interface MealRecommendation {
  mealKey: MealKey;
  mealName: string;
  emoji: string;
  rankLabel: string;
  score: number;
  whyThisFits: string;
  difficulty: "Easy" | "Moderate" | "High";
  profitPotential: "Low" | "Medium" | "High";
  volunteerNeed: "Low" | "Medium" | "High";
  equipment: string[];
  watchOuts: string[];
  defaultFormData: PlannerFormData;
}

// ── Static meal metadata ──────────────────────────────────────
const MEAL_STATIC: Record<MealKey, {
  name: string;
  emoji: string;
  difficulty: "Easy" | "Moderate" | "High";
  profitPotential: "Low" | "Medium" | "High";
  volunteerNeed: "Low" | "Medium" | "High";
  equipment: string[];
  watchOuts: string[];
}> = {
  hotdogs: {
    name: "Hot Dogs", emoji: "🌭",
    difficulty: "Easy", profitPotential: "Medium", volunteerNeed: "Low",
    equipment: ["Grill or steamer", "Serving tongs and foil pans", "Condiment squeeze bottles or small bowls"],
    watchOuts: [
      "One standard grill usually handles ~80–100 hot dogs/hour — plan extra capacity for larger crowds.",
      "Pre-stage buns and condiments before doors open so the line keeps moving.",
    ],
  },
  burgers: {
    name: "Burgers", emoji: "🍔",
    difficulty: "Moderate", profitPotential: "High", volunteerNeed: "Medium",
    equipment: ["Grill (required)", "Spatulas and tongs", "Assembly station with warming tray", "Foil or paper for serving"],
    watchOuts: [
      "Grill-to-assembly coordination is critical — assign a dedicated assembly team separate from the grill.",
      "Budget at least 60 minutes of prep before serving begins.",
    ],
  },
  bakedPotatoes: {
    name: "Baked Potatoes", emoji: "🥔",
    difficulty: "Moderate", profitPotential: "High", volunteerNeed: "Medium",
    equipment: ["Oven access (required)", "Aluminum foil", "Warm-holding containers or low oven", "Topping bar containers and tongs"],
    watchOuts: [
      "Potatoes need 60–75 minutes of oven time — watch your local prices and buy in bulk.",
      "Plan oven batches in advance so supply stays ahead of demand during service.",
    ],
  },
  walkingTacos: {
    name: "Walking Tacos", emoji: "🌮",
    difficulty: "Easy", profitPotential: "Medium", volunteerNeed: "Low",
    equipment: ["Tabletop topping station", "Foil pans for meat", "Serving forks"],
    watchOuts: [
      "Open chip bags at service and keep seasoned meat hot in covered pans.",
      "Use a separate topping station to keep the line moving.",
    ],
  },
  breakfastBurritos: {
    name: "Breakfast Burritos", emoji: "🌯",
    difficulty: "Moderate", profitPotential: "Medium", volunteerNeed: "Medium",
    equipment: ["Large griddle or electric skillet", "Roaster or foil pans for warm-holding", "Aluminum foil for wrapping", "Assembly table"],
    watchOuts: [
      "Multi-station coordination matters — eggs, filling, and assembly must stay in sync.",
      "Scrambled eggs are a food safety concern if held too long — cook in smaller batches as demand requires.",
    ],
  },
  tacos: {
    name: "Tacos", emoji: "🌮",
    difficulty: "Moderate", profitPotential: "Medium", volunteerNeed: "Medium",
    equipment: ["Large skillet or roaster for meat", "Warmers or foil pans", "Taco bar containers, spoons, and tongs"],
    watchOuts: [
      "The meat station is the most common bottleneck — keep it continuously stocked.",
      "Shredded toppings (lettuce, tomato) have a short window before they look unappetizing at room temp.",
    ],
  },
  spaghetti: {
    name: "Spaghetti", emoji: "🍝",
    difficulty: "High", profitPotential: "High", volunteerNeed: "High",
    equipment: ["Large stockpots (required)", "Kitchen access (required)", "Electric roasters for warm-holding", "Serving ladles and tongs"],
    watchOuts: [
      "Overcooked pasta is a common problem — stagger cooking batches every 15 minutes.",
      "Keep sauce and pasta in separate warm-holding containers until plating.",
    ],
  },
  pancakes: {
    name: "Pancakes", emoji: "🥞",
    difficulty: "Moderate", profitPotential: "Medium", volunteerNeed: "Medium",
    equipment: ["Large electric griddle (required)", "Batter mixing bowls and ladle", "Syrup, butter, and topping containers"],
    watchOuts: [
      "Output is usually limited to ~80–100 pancakes per hour per griddle — plan equipment accordingly.",
      "Griddle Operators should stay at their station the entire service — assign runners to restock batter.",
    ],
  },
};

// ── Scoring tables ────────────────────────────────────────────
// Each value is the number of points added for that meal/answer combo.

const ATTENDANCE_SCORE: Record<string, Record<AttendanceRange, number>> = {
  hotdogs:          { "under75": 2, "75-150": 2, "150-250": 1, "250plus": 0 },
  burgers:          { "under75": 1, "75-150": 2, "150-250": 2, "250plus": 1 },
  bakedPotatoes:    { "under75": 1, "75-150": 2, "150-250": 2, "250plus": 1 },
  breakfastBurritos:{ "under75": 2, "75-150": 2, "150-250": 1, "250plus": 0 },
  tacos:            { "under75": 1, "75-150": 2, "150-250": 2, "250plus": 1 },
  spaghetti:        { "under75": 0, "75-150": 1, "150-250": 3, "250plus": 3 },
  pancakes:         { "under75": 2, "75-150": 2, "150-250": 1, "250plus": 0 },
};

const AUDIENCE_SCORE: Record<string, Record<AudienceType, number>> = {
  hotdogs:          { "mostly-kids": 2, "mostly-adults": 0, "mixed": 1 },
  burgers:          { "mostly-kids": 0, "mostly-adults": 2, "mixed": 2 },
  bakedPotatoes:    { "mostly-kids": 0, "mostly-adults": 3, "mixed": 2 },
  breakfastBurritos:{ "mostly-kids": 1, "mostly-adults": 1, "mixed": 2 },
  tacos:            { "mostly-kids": 2, "mostly-adults": 1, "mixed": 2 },
  spaghetti:        { "mostly-kids": 0, "mostly-adults": 2, "mixed": 2 },
  pancakes:         { "mostly-kids": 2, "mostly-adults": 1, "mixed": 2 },
};

const TIME_SCORE: Record<string, Record<EventTime, number>> = {
  hotdogs:          { breakfast: -2, lunch: 2, dinner: 1, "after-church-school": 2, "during-event": 2 },
  burgers:          { breakfast: -2, lunch: 2, dinner: 2, "after-church-school": 1, "during-event": 1 },
  bakedPotatoes:    { breakfast: -2, lunch: 1, dinner: 3, "after-church-school": 1, "during-event": 0 },
  breakfastBurritos:{ breakfast: 4, lunch: 0, dinner: -1, "after-church-school": 1, "during-event": 2 },
  tacos:            { breakfast: -1, lunch: 2, dinner: 2, "after-church-school": 2, "during-event": 1 },
  spaghetti:        { breakfast: -3, lunch: 1, dinner: 4, "after-church-school": 0, "during-event": 0 },
  pancakes:         { breakfast: 4, lunch: 0, dinner: -2, "after-church-school": 1, "during-event": 0 },
};

const ADULT_VOL_SCORE: Record<string, Record<VolunteerAdults, number>> = {
  hotdogs:          { "0-2": 3, "3-5": 2, "6-10": 1, "10plus": 0 },
  burgers:          { "0-2": -1, "3-5": 1, "6-10": 2, "10plus": 2 },
  bakedPotatoes:    { "0-2": -1, "3-5": 1, "6-10": 2, "10plus": 2 },
  breakfastBurritos:{ "0-2": -2, "3-5": 1, "6-10": 2, "10plus": 2 },
  tacos:            { "0-2": -1, "3-5": 1, "6-10": 2, "10plus": 2 },
  spaghetti:        { "0-2": -3, "3-5": -1, "6-10": 2, "10plus": 3 },
  pancakes:         { "0-2": 0, "3-5": 1, "6-10": 2, "10plus": 2 },
};

const STUDENT_VOL_SCORE: Record<string, Record<VolunteerStudents, number>> = {
  hotdogs:          { "0-3": 1, "4-8": 1, "9-15": 1, "16plus": 1 },
  burgers:          { "0-3": 0, "4-8": 1, "9-15": 1, "16plus": 1 },
  bakedPotatoes:    { "0-3": 0, "4-8": 1, "9-15": 1, "16plus": 1 },
  breakfastBurritos:{ "0-3": -1, "4-8": 1, "9-15": 2, "16plus": 2 },
  tacos:            { "0-3": 0, "4-8": 1, "9-15": 2, "16plus": 2 },
  spaghetti:        { "0-3": 0, "4-8": 0, "9-15": 1, "16plus": 2 },
  pancakes:         { "0-3": 0, "4-8": 1, "9-15": 1, "16plus": 1 },
};

const EQUIPMENT_SCORE: Record<string, Record<EquipmentItem, number>> = {
  hotdogs:          { kitchen: 0, oven: 0, grill: 3, "large-pots": 0, warmers: 1, fridge: 0, "no-kitchen": 1 },
  burgers:          { kitchen: 0, oven: 0, grill: 3, "large-pots": 0, warmers: 1, fridge: 1, "no-kitchen": -2 },
  bakedPotatoes:    { kitchen: 2, oven: 3, grill: 0, "large-pots": 0, warmers: 2, fridge: 1, "no-kitchen": -3 },
  breakfastBurritos:{ kitchen: 2, oven: 1, grill: 0, "large-pots": 0, warmers: 2, fridge: 1, "no-kitchen": -2 },
  tacos:            { kitchen: 1, oven: 0, grill: 0, "large-pots": 1, warmers: 2, fridge: 1, "no-kitchen": -1 },
  spaghetti:        { kitchen: 3, oven: 0, grill: 0, "large-pots": 3, warmers: 2, fridge: 1, "no-kitchen": -4 },
  pancakes:         { kitchen: 2, oven: 0, grill: 0, "large-pots": 0, warmers: 1, fridge: 0, "no-kitchen": -2 },
};

const PRIORITY_SCORE: Record<string, Record<PriorityItem, number>> = {
  hotdogs:          { "lowest-cost": 2, easiest: 3, "highest-profit": 0, "fastest-serving": 3, "kid-friendly": 2, "adult-friendly": 0 },
  burgers:          { "lowest-cost": 0, easiest: -1, "highest-profit": 2, "fastest-serving": 1, "kid-friendly": 0, "adult-friendly": 2 },
  bakedPotatoes:    { "lowest-cost": 1, easiest: -2, "highest-profit": 3, "fastest-serving": -1, "kid-friendly": 0, "adult-friendly": 2 },
  breakfastBurritos:{ "lowest-cost": 2, easiest: 0, "highest-profit": 1, "fastest-serving": 2, "kid-friendly": 1, "adult-friendly": 0 },
  tacos:            { "lowest-cost": 2, easiest: 1, "highest-profit": 1, "fastest-serving": 1, "kid-friendly": 2, "adult-friendly": 1 },
  spaghetti:        { "lowest-cost": 0, easiest: -2, "highest-profit": 3, "fastest-serving": -2, "kid-friendly": 0, "adult-friendly": 2 },
  pancakes:         { "lowest-cost": 3, easiest: 1, "highest-profit": 1, "fastest-serving": 0, "kid-friendly": 2, "adult-friendly": 1 },
  walkingTacos:     { "lowest-cost": 2, easiest: 3, "highest-profit": 1, "fastest-serving": 3, "kid-friendly": 3, "adult-friendly": 0 },
};

const CONSTRAINT_SCORE: Record<string, Record<ConstraintItem, number>> = {
  hotdogs:          { "no-cooking": -3, "limited-prep": 2, "limited-adults": 2, "grab-and-go": 2, vegetarian: -2 },
  burgers:          { "no-cooking": -3, "limited-prep": -1, "limited-adults": -1, "grab-and-go": 1, vegetarian: -2 },
  bakedPotatoes:    { "no-cooking": -4, "limited-prep": -2, "limited-adults": -1, "grab-and-go": -2, vegetarian: 1 },
  breakfastBurritos:{ "no-cooking": -3, "limited-prep": -2, "limited-adults": -2, "grab-and-go": 3, vegetarian: 0 },
  tacos:            { "no-cooking": -3, "limited-prep": -1, "limited-adults": -1, "grab-and-go": 0, vegetarian: 1 },
  spaghetti:        { "no-cooking": -4, "limited-prep": -3, "limited-adults": -3, "grab-and-go": -2, vegetarian: 0 },
  pancakes:         { "no-cooking": -3, "limited-prep": -1, "limited-adults": 0, "grab-and-go": -1, vegetarian: 1 },
  walkingTacos:     { "no-cooking": -2, "limited-prep": 2, "limited-adults": 2, "grab-and-go": 3, vegetarian: 1 },
};

// ── Score a single meal ───────────────────────────────────────
function scoreMeal(meal: MealKey, quiz: QuizAnswers): number {
  let score = 0;
  score += ATTENDANCE_SCORE[meal]?.[quiz.attendance] ?? 0;
  score += AUDIENCE_SCORE[meal]?.[quiz.audience] ?? 0;
  score += TIME_SCORE[meal]?.[quiz.timeOfEvent] ?? 0;
  score += ADULT_VOL_SCORE[meal]?.[quiz.adultVolunteers] ?? 0;
  score += STUDENT_VOL_SCORE[meal]?.[quiz.studentHelpers] ?? 0;
  for (const eq of quiz.equipment) score += EQUIPMENT_SCORE[meal]?.[eq] ?? 0;
  for (const pr of quiz.priorities) score += PRIORITY_SCORE[meal]?.[pr] ?? 0;
  for (const cn of quiz.constraints) score += CONSTRAINT_SCORE[meal]?.[cn] ?? 0;
  return score;
}

// ── Dynamic "why this fits" text ──────────────────────────────
function buildWhyThisFits(meal: MealKey, quiz: QuizAnswers): string {
  const parts: string[] = [];
  if (quiz.timeOfEvent === "breakfast") {
    parts.push("We do not currently offer an audited breakfast meal in the public planner, so this is the closest supported format to review.");
  }

  switch (meal) {
    case "hotdogs":
      parts.push("Hot dogs are usually one of the easiest and fastest meals to run at a fundraiser.");
      if (quiz.audience === "mostly-kids") parts.push("They often go over well with kids and student groups.");
      if (quiz.adultVolunteers === "0-2" || quiz.adultVolunteers === "3-5")
        parts.push("With fewer adult volunteers, this may be your most practical option.");
      if (quiz.priorities.includes("fastest-serving"))
        parts.push("If serving speed matters, a hot dog line tends to move faster than most alternatives.");
      if (quiz.priorities.includes("lowest-cost")) parts.push("Ingredient costs are generally low.");
      if (quiz.equipment.includes("grill")) parts.push("You have grill access, which is the ideal setup.");
      if (quiz.constraints.includes("limited-prep")) parts.push("With limited prep time, hot dogs may work well — advance preparation is minimal.");
      if (quiz.constraints.includes("grab-and-go")) parts.push("They can be served grab-and-go style with no seating required.");
      break;

    case "burgers":
      parts.push("Burgers often allow a higher suggested donation, which may work well for profit-focused events.");
      if (quiz.attendance === "150-250" || quiz.attendance === "250plus")
        parts.push("They may work well for larger crowds with a well-organized grill and assembly team.");
      if (quiz.audience === "mostly-adults" || quiz.audience === "mixed")
        parts.push("Adult and mixed audiences often respond well to a burger fundraiser.");
      if (quiz.equipment.includes("grill")) parts.push("You have grill access, which is required for this meal.");
      if (quiz.priorities.includes("highest-profit"))
        parts.push("With a higher price point, burgers may generate a strong profit when attendance meets your goal.");
      if (quiz.adultVolunteers === "6-10" || quiz.adultVolunteers === "10plus")
        parts.push("Your volunteer count is usually enough to run a smooth grill-and-assembly operation.");
      break;

    case "bakedPotatoes":
      parts.push("A baked potato bar often feels like a full, satisfying meal and may support a higher donation price.");
      if (quiz.audience === "mostly-adults") parts.push("Adult audiences often appreciate the topping bar format.");
      if (quiz.priorities.includes("highest-profit"))
        parts.push("Potatoes are relatively inexpensive to buy in bulk, which may leave room for a strong margin.");
      if (quiz.equipment.includes("oven") || quiz.equipment.includes("warmers"))
        parts.push("Your equipment access is well-suited for this meal.");
      if (quiz.timeOfEvent === "dinner") parts.push("An evening dinner is usually a great format for a baked potato bar.");
      parts.push("Watch your prep time — potatoes need at least 60–75 minutes of oven time before serving.");
      break;

    case "breakfastBurritos":
      if (quiz.timeOfEvent === "breakfast") parts.push("Breakfast burritos are usually an excellent fit for morning events.");
      else if (quiz.constraints.includes("grab-and-go")) parts.push("Foil-wrapped burritos are a natural grab-and-go option that travels well.");
      else parts.push("Breakfast burritos may work well depending on your serving window and volunteer setup.");
      if (quiz.priorities.includes("fastest-serving")) parts.push("Pre-wrapped burritos tend to move through a serving line quickly.");
      if (quiz.priorities.includes("lowest-cost")) parts.push("Ingredient costs are generally reasonable for this meal.");
      if (quiz.adultVolunteers !== "0-2")
        parts.push("With your volunteer count, you should have enough adults for the egg and assembly stations.");
      break;

    case "tacos":
      parts.push("A taco bar often appeals broadly and may work well for youth-heavy or community events.");
      if (quiz.audience === "mostly-kids") parts.push("Tacos are usually popular with younger crowds.");
      if (quiz.priorities.includes("lowest-cost")) parts.push("Taco ingredients are often a cost-effective option compared to other fundraiser meals.");
      if (quiz.timeOfEvent === "lunch" || quiz.timeOfEvent === "dinner")
        parts.push("Lunch or dinner events are usually a natural fit.");
      if (quiz.constraints.includes("vegetarian"))
        parts.push("With a bean option added to the bar, tacos can accommodate vegetarians more easily than most other fundraiser meals.");
      parts.push("Keeping the meat station continuously stocked is the most common challenge — adjust for your group.");
      break;

    case "spaghetti":
      parts.push("Spaghetti dinners are a proven fundraiser format that may work well for larger sit-down events.");
      if (quiz.attendance === "150-250" || quiz.attendance === "250plus")
        parts.push("Pasta scales well and may be a practical choice at your expected attendance.");
      if (quiz.timeOfEvent === "dinner") parts.push("An evening dinner is usually the ideal format for this meal.");
      if (quiz.priorities.includes("highest-profit"))
        parts.push("Pasta is inexpensive at scale, which often produces a strong margin with a reasonable ticket price.");
      if (quiz.equipment.includes("kitchen") || quiz.equipment.includes("large-pots"))
        parts.push("Your kitchen or large pot access is well-suited for this meal.");
      if (quiz.adultVolunteers === "6-10" || quiz.adultVolunteers === "10plus")
        parts.push("Your volunteer count gives you enough coverage for the pasta, sauce, and bread stations.");
      break;

    case "pancakes":
      if (quiz.timeOfEvent === "breakfast")
        parts.push("Pancakes are often a natural fit for breakfast events and tend to be popular with all ages.");
      else
        parts.push("Pancakes may work well if you have griddle equipment and a dedicated cooking team.");
      if (quiz.priorities.includes("lowest-cost")) parts.push("Pancake ingredients are usually among the least expensive of any fundraiser meal.");
      if (quiz.audience === "mostly-kids") parts.push("Kids typically enjoy pancakes, making this a good fit for family-friendly events.");
      parts.push("You'll need at least one large electric griddle — output is usually limited to around 80–100 pancakes per hour per griddle.");
      break;
  }

  if (parts.length === 0) parts.push("Based on your answers, this meal may work well for your event. Adjust for your group and local context.");
  return parts.join(" ");
}

// ── Assign rank labels ────────────────────────────────────────
function getRankLabel(rank: number, meal: MealKey, quiz: QuizAnswers): string {
  const static_ = MEAL_STATIC[meal];
  if (rank === 0) return "Best Overall";
  if (rank === 1) {
    if (quiz.priorities.includes("easiest") && static_.difficulty === "Easy") return "Easiest Option";
    if (quiz.priorities.includes("highest-profit") && static_.profitPotential === "High") return "Highest Profit Potential";
    if (quiz.priorities.includes("kid-friendly") && (meal === "hotdogs" || meal === "tacos" || meal === "pancakes")) return "Best for Your Crowd";
    if (quiz.priorities.includes("fastest-serving") && meal === "hotdogs") return "Fastest Serving Line";
    return "Runner-Up";
  }
  if (rank === 2) {
    if (static_.profitPotential === "High" && !quiz.priorities.includes("highest-profit")) return "Strong Profit Option";
    if (static_.difficulty === "Easy") return "Easy Alternative";
    return "Also Worth Considering";
  }
  return "Also Worth Considering";
}

// ── Build default PlannerFormData from quiz ───────────────────
const ATTENDANCE_MIDPOINTS: Record<AttendanceRange, number> = {
  "under75": 60, "75-150": 110, "150-250": 190, "250plus": 275,
};

const TIME_DEFAULTS: Record<EventTime, { prep: string; serveStart: string; serveEnd: string }> = {
  breakfast:           { prep: "07:30", serveStart: "09:00", serveEnd: "11:00" },
  lunch:               { prep: "10:30", serveStart: "12:00", serveEnd: "14:00" },
  dinner:              { prep: "15:00", serveStart: "17:30", serveEnd: "19:30" },
  "after-church-school": { prep: "11:00", serveStart: "12:30", serveEnd: "14:00" },
  "during-event":      { prep: "09:00", serveStart: "10:30", serveEnd: "12:30" },
};

const ADULT_VOL_MIDPOINTS: Record<VolunteerAdults, number> = {
  "0-2": 2, "3-5": 4, "6-10": 7, "10plus": 12,
};

const STUDENT_VOL_MIDPOINTS: Record<VolunteerStudents, number> = {
  "0-3": 2, "4-8": 6, "9-15": 10, "16plus": 16,
};

const DEFAULT_PRICES: Record<string, number> = {
  hotdogs: 8, burgers: 12, bakedPotatoes: 10,
  breakfastBurritos: 8, tacos: 10, walkingTacos: 9, spaghetti: 13, pancakes: 8,
};

function buildDefaultFormData(meal: MealKey, quiz: QuizAnswers): PlannerFormData {
  const timings = TIME_DEFAULTS[quiz.timeOfEvent];
  return {
    eventName: "",
    orgType: quiz.orgType,
    mealType: meal,
    attendance: ATTENDANCE_MIDPOINTS[quiz.attendance],
    mealPrice: "" as unknown as number,
    storePreference: "Mixed",
    prepStartTime: timings.prep,
    serveStartTime: timings.serveStart,
    serveEndTime: timings.serveEnd,
    adultVolunteers: ADULT_VOL_MIDPOINTS[quiz.adultVolunteers],
    studentVolunteers: STUDENT_VOL_MIDPOINTS[quiz.studentHelpers],
    notes: "",
    customMealName: "",
    customServingSize: "",
    customIngredients: "",
  };
}

// ── Main entry point ──────────────────────────────────────────
export function getRecommendations(quiz: QuizAnswers): MealRecommendation[] {
  const meals: MealKey[] = ["hotdogs", "burgers", "bakedPotatoes", "tacos", "walkingTacos", "spaghetti"];

  const scored = meals.map((meal) => ({
    meal,
    score: scoreMeal(meal, quiz),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Return top 3
  return scored.slice(0, 3).map(({ meal, score }, rank) => {
    const static_ = MEAL_STATIC[meal];
    return {
      mealKey: meal,
      mealName: static_.name,
      emoji: static_.emoji,
      rankLabel: getRankLabel(rank, meal, quiz),
      score,
      whyThisFits: buildWhyThisFits(meal, quiz),
      difficulty: static_.difficulty,
      profitPotential: static_.profitPotential,
      volunteerNeed: static_.volunteerNeed,
      equipment: static_.equipment,
      watchOuts: static_.watchOuts,
      defaultFormData: buildDefaultFormData(meal, quiz),
    };
  });
}
