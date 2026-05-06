# Fundraiser Food Math

A production-ready food fundraiser planning web app for churches, schools, sports teams, and nonprofits. Users fill out a short form and instantly get a shopping list, food quantity plan, prep timeline, volunteer plan, cost estimate, profit estimate, and printable event plan.

## Run & Operate

- Workflow: `artifacts/fundraiser-food-math: web` — `pnpm --filter @workspace/fundraiser-food-math run dev`
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- No env vars required for the frontend (Stripe links live in `src/config/paymentLinks.ts`)

## Stack

- pnpm workspaces monorepo · Node 24 · TypeScript 5.9
- React 19 + Vite 7 · Wouter routing · React Hook Form + Zod · Tailwind CSS v4 · shadcn/ui

## Where things live

- `artifacts/fundraiser-food-math/src/lib/mealAssumptions.ts` — all meal assumptions, ingredients, serving sizes, costs. **Edit here to change food data.**
- `artifacts/fundraiser-food-math/src/lib/calculator.ts` — core calculation engine
- `artifacts/fundraiser-food-math/src/lib/types.ts` — all TypeScript types (`MealType`, `PlannerFormData`, etc.)
- `artifacts/fundraiser-food-math/src/config/paymentLinks.ts` — Stripe/Gumroad payment link URLs
- `src/pages/PlannerPage.tsx` — multi-step form wizard (4 steps for custom, 3 for all others)
- `src/pages/ResultsPage.tsx` — full results with tabs
- `src/pages/PrintPage.tsx` — print-friendly PDF layout
- `src/index.css` — all CSS custom properties and utility classes

## Architecture decisions

- **Frontend-only** — all calculations run in the browser, no backend needed
- **Meal type tiers**: Tier 1 = 7 known meals with full ingredient lists; Combo = two Tier 1 meals merged (independent two-pass calculation, not averaged); Tier 2 = "custom" meal that triggers a follow-up "Tell Us About Your Menu" step with checkbox-driven shopping list generation
- **Combo calculation**: each combo component runs its own `computeIngredientResults()` pass (correct serving ratios per meal), then results are concatenated — never averaged or merged into a single assumption
- **Unlock model**: free preview → paid Full Event Pack. Keys: `ffm_unlocked` (localStorage), `ffm_plan` (sessionStorage). Code `DEVINTEST` unlocks for 30 days
- Print page reads `sessionStorage["ffm_plan"]` with a `localStorage` fallback via `getStoredPlan()`

## Product

- Free preview: event summary, revenue/cost/profit estimate, top 5 shopping items, risk warnings
- Full Event Pack ($19): complete shopping list (grouped by category), supplies list, prep timeline, volunteer plan, email blurb, printable plan, Full Event Pack tabs
- Meal selector: three-section card UI — Popular Combos (3), Individual Meals (7), Custom Meal (1)
- Custom meal step 2 "Tell Us About Your Menu": sides, drinks, desserts, dietary checkboxes → drives shopping list estimates

## User preferences

- Volunteer terminology: "Adult Volunteer", "Parent Oversight", "Student Volunteer" — never "Parent Helper"
- Do not change Stripe links, USE_STRIPE_TEST_MODE, or unlock behavior without explicit instruction

## Gotchas

- Combo types must be in both `MealType` (types.ts), `MEAL_ASSUMPTIONS` (stubs for type safety), and `COMBO_DEFINITIONS` (real ingredient logic)
- `buildCustomMenuIngredients()` in calculator.ts uses `adultServings=1` from customAssumptions — perServing values are calibrated per-person
- `buildVolunteerBriefing`, `buildSetupLayout`, `buildLeftoverPlan` fall back to `plans["custom"]` automatically for unknown/combo types — no extra handling needed
- PlannerPage step flow: step 1 → step 2 (custom only) → step 3 → step 4; non-custom skips step 2 (1→3→4 internally, displayed as 1,2,3)

## Pointers

- Adding a new Tier 1 meal: add key to `MealType`, create `MealAssumption`, add to `MEAL_ASSUMPTIONS`, add card option to `INDIVIDUAL_OPTIONS` in PlannerPage
- Adding a new combo: add key to `MealType`, add stub to `MEAL_ASSUMPTIONS`, add entry to `COMBO_DEFINITIONS` with component assumptions
