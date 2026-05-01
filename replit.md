# Fundraiser Food Math

## Overview

A production-ready food fundraiser planning web app for churches, schools, sports teams, and nonprofits. Users fill out a short form and instantly get a shopping list, food quantity plan, prep timeline, volunteer role plan, cost estimate, profit estimate, and printable event plan.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend framework**: React + Vite
- **Routing**: Wouter
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS v4 with custom CSS properties
- **UI components**: shadcn/ui

## Artifact

- **fundraiser-food-math** — React + Vite frontend at `/` (port 19397)

## Key Files

### Core Logic (edit these to change how the app works)
- `artifacts/fundraiser-food-math/src/lib/mealAssumptions.ts` — all meal types, ingredients, serving sizes, cost estimates, and supply lists. **Edit this to update any food assumptions.**
- `artifacts/fundraiser-food-math/src/lib/calculator.ts` — core calculation engine (food quantities, shopping list, timeline, volunteer plan, profit estimate)
- `artifacts/fundraiser-food-math/src/lib/types.ts` — TypeScript types for all data structures

### Configuration
- `artifacts/fundraiser-food-math/src/config/paymentLinks.ts` — **Replace placeholder URLs with your Stripe or Gumroad payment links.** Also controls pricing tier display labels and features.

### Pages
- `src/pages/LandingPage.tsx` — hero, how it works, pricing section, about
- `src/pages/PlannerPage.tsx` — 3-step form wizard
- `src/pages/ResultsPage.tsx` — full results with tabs (shopping, supplies, timeline, volunteers, email blurb)
- `src/pages/PrintPage.tsx` — print-friendly PDF layout

### Styling
- `artifacts/fundraiser-food-math/src/index.css` — all CSS custom properties (theme colors) and custom CSS classes

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Workflow: `artifacts/fundraiser-food-math: web` — runs `pnpm --filter @workspace/fundraiser-food-math run dev`

## Payment Links

Pricing buttons in the app are placeholders. To activate them:
1. Open `src/config/paymentLinks.ts`
2. Replace the URLs in the `PAYMENT_LINKS` object with your Stripe Payment Link or Gumroad product URLs

## Volunteer Terminology

The app consistently uses:
- "Adult Volunteer"
- "Parent Oversight"
- "Student Volunteer"

Never use "Parent Helper" — this wording was intentionally excluded.

## Meal Assumptions

To add a new meal type:
1. Add the meal key to the `MealType` union in `types.ts`
2. Create a new `MealAssumption` object in `mealAssumptions.ts`
3. Add it to the `MEAL_ASSUMPTIONS` map
4. Add the display option to `PlannerPage.tsx`'s `MEAL_TYPES` array

## Architecture Notes

- This is a frontend-only app — all calculations happen in the browser (no backend needed)
- No database, no user accounts (by design for v1)
- Print page uses `sessionStorage` to pass plan data from the results page
- Navigation uses `window.location.href` for simplicity (no complex routing state needed)
